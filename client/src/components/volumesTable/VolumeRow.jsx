import { Link } from "react-router-dom";
import { EditableCell, ReadOnlyCell } from "./TableCells";

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
}) {
	return (
		<tr className={row.pendingFields?.size ? "volumes-table__row--dirty" : undefined}>
			<td className="volumes-table__cell volumes-table__cell--volume">
				<div className="volumes-table__volume">
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
					{editable ? (
						<EditableCell
							column={column}
							row={row}
							onChange={(value) => onFieldChange(row, column.key, value)}
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
