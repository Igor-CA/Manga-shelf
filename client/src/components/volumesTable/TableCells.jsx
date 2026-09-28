import { useState, useEffect } from "react";
import { VOLUME_CONDITIONS, CONDITION_LABELS } from "../../utils/volumeConditions";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { SCORE_LABELS } from "../contentHeader/RateButton";
import CustomCheckbox from "../customInputs/CustomCheckbox";

const toText = (value) => value ?? "";
const toPriceText = (value) => (value != null ? String(value).replace(".", ",") : "");
const trimmedOrNull = (text) => text.trim() || null;
const toIntOrNull = (text) => (text === "" ? null : parseInt(text, 10));

function useDraft(value, format) {
	const [text, setText] = useState(() => format(value));
	useEffect(() => setText(format(value)), [value, format]);
	return [text, setText];
}

function CheckboxCell({ row, value, onChange }) {
	return (
		<CustomCheckbox
			htmlId={`isRead-${row.volumeId}`}
			checked={!!value}
			handleChange={(e) => onChange(e.target.checked)}
			ariaLabel="Lido"
		/>
	);
}

function DateCell({ column, value, onChange }) {
	return (
		<input
			type="date"
			data-col={column.key}
			value={value || ""}
			onChange={(e) => onChange(e.target.value || null)}
			className="volumes-table__input"
		/>
	);
}

function NumberCell({ column, value, onChange }) {
	return (
		<input
			type="number"
			data-col={column.key}
			min={column.key === "amount" ? 1 : 0}
			value={value ?? ""}
			onChange={(e) => onChange(toIntOrNull(e.target.value))}
			className="volumes-table__input volumes-table__input--narrow"
		/>
	);
}

function ScoreCell({ value, onChange }) {
	return (
		<select
			data-col="rating"
			value={value ?? ""}
			onChange={(e) => onChange(toIntOrNull(e.target.value))}
			className="volumes-table__input volumes-table__input--narrow"
		>
			<option value="">–</option>
			{[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
				<option key={n} value={n}>
					{n} · {SCORE_LABELS[n]}
				</option>
			))}
		</select>
	);
}

function PriceCell({ row, value, onChange }) {
	const [text, setText] = useDraft(value, toPriceText);

	const commit = () => {
		if (text.trim() === "") return onChange(null);
		const parsed = parseFloat(text.trim().replace(",", "."));
		if (Number.isNaN(parsed)) setText(toPriceText(value));
		else onChange(parsed);
	};

	return (
		<>
			<input
				type="text"
				inputMode="decimal"
				data-col="price"
				value={text}
				onChange={(e) => setText(e.target.value)}
				onBlur={commit}
				className="volumes-table__input volumes-table__input--narrow"
				placeholder="-"
			/>
			{row.lotSize > 1 && (
				<span
					className="volumes-table__lot-marker"
					title={`Preço vindo de uma compra de ${row.lotSize} volumes`}
				>
					lote
				</span>
			)}
		</>
	);
}

function ConditionCell({ value, onChange }) {
	return (
		<select
			data-col="condition"
			value={value || ""}
			onChange={(e) => onChange(e.target.value || null)}
			className="volumes-table__input"
		>
			<option value="">-</option>
			{VOLUME_CONDITIONS.map(({ value: v, label }) => (
				<option key={v} value={v}>
					{label}
				</option>
			))}
		</select>
	);
}

function StoreCell({ value, onChange }) {
	const [text, setText] = useDraft(value, toText);
	return (
		<input
			type="text"
			data-col="store"
			maxLength={100}
			value={text}
			onChange={(e) => setText(e.target.value)}
			onBlur={() => onChange(trimmedOrNull(text))}
			className="volumes-table__input"
			placeholder="Shopee, sebo..."
		/>
	);
}

function NotesCell({ value, onChange }) {
	const [expanded, setExpanded] = useState(false);
	const [text, setText] = useDraft(value, toText);

	if (!expanded) {
		return (
			<button
				type="button"
				className="volumes-table__notes-preview"
				onClick={() => setExpanded(true)}
			>
				{value || (
					<span className="volumes-table__placeholder">Adicionar nota</span>
				)}
			</button>
		);
	}

	return (
		<textarea
			data-col="notes"
			autoFocus
			maxLength={500}
			rows={3}
			value={text}
			onChange={(e) => setText(e.target.value)}
			onBlur={() => {
				onChange(trimmedOrNull(text));
				setExpanded(false);
			}}
			className="volumes-table__input volumes-table__notes-textarea"
		/>
	);
}

const EDITABLE_CELLS = {
	checkbox: CheckboxCell,
	date: DateCell,
	number: NumberCell,
	score: ScoreCell,
	price: PriceCell,
	condition: ConditionCell,
	text: StoreCell,
	notes: NotesCell,
};

export function EditableCell({ column, row, onChange, pending, error }) {
	const Cell = EDITABLE_CELLS[column.type];
	return (
		<div
			className={`volumes-table__field${
				pending ? " volumes-table__field--pending" : ""
			}${error ? " volumes-table__field--error" : ""}`}
		>
			<Cell column={column} row={row} value={row[column.key]} onChange={onChange} />
			{error && <span className="volumes-table__cell-error">{error}</span>}
		</div>
	);
}

const READ_ONLY_FORMATTERS = {
	checkbox: (value) => (value ? "Sim" : "Não"),
	date: (value) => formatDate(value),
	price: (value) => (value != null ? formatCurrency(value) : null),
	condition: (value) => CONDITION_LABELS[value],
};

export function formatCellValue(column, value) {
	const format = READ_ONLY_FORMATTERS[column.type];
	const text = format ? format(value) : value;
	return text === null || text === undefined || text === "" ? "-" : text;
}

export function ReadOnlyCell({ column, row }) {
	return formatCellValue(column, row[column.key]);
}
