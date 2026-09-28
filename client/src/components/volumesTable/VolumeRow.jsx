import { Link } from "react-router-dom";
import { EditableCell, ReadOnlyCell } from "./TableCells";
import CustomCheckbox from "../customInputs/CustomCheckbox";

function VolumeLabel({ row, showSeriesColumn }) {
	const variantSuffix = row.isVariant
		? ` · variante ${row.variantNumber || 1}`
		: "";
	const volumeLabel = `Vol. ${row.volumeNumber}${variantSuffix}`;

	if (!showSeriesColumn) {
		return <span className="volumes-table__volume-label">{volumeLabel}</span>;
	}

	return (
		<Link to={`/volume/${row.volumeId}`} className="volumes-table__volume-link">
			<span className="volumes-table__series-title">{row.seriesTitle}</span>
			<span className="volumes-table__volume-label">{volumeLabel}</span>
		</Link>
	);
}

export default function VolumeRow({
	row,
	columns,
	editable,
	showSeriesColumn,
	onFieldChange,
	onFillDown,
	onToggleOwnership,
}) {
	const rowClassName = row.owned
		? row.pendingFields?.size
			? "volumes-table__row--dirty"
			: undefined
		: "volumes-table__row--unowned";

	return (
		<tr className={rowClassName}>
			<td className="volumes-table__cell volumes-table__cell--volume">
				<div className="volumes-table__volume">
					{onToggleOwnership && (
						<CustomCheckbox
							htmlId={`owned-${row.volumeId}`}
							checked={row.owned}
							handleChange={(e) => onToggleOwnership(row, e.target.checked)}
							ariaLabel={
								row.owned ? "Remover volume da coleção" : "Adicionar volume à coleção"
							}
						/>
					)}
					<VolumeLabel row={row} showSeriesColumn={showSeriesColumn} />
				</div>
			</td>
			{columns.map((column) => (
				<td
					key={column.key}
					className={`volumes-table__cell${
						column.type === "notes" ? " volumes-table__cell--notes" : ""
					}`}
				>
					{editable && row.owned ? (
						<EditableCell
							column={column}
							row={row}
							onChange={(value) => onFieldChange(row, column.key, value)}
							onFillDown={() => onFillDown(row, column.key)}
							pending={row.pendingFields?.has(column.key)}
							error={row.fieldErrors?.[column.key]}
						/>
					) : (
						<ReadOnlyCell column={column} row={row} />
					)}
				</td>
			))}
		</tr>
	);
}
