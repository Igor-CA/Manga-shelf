import { Link } from "react-router-dom";
import { ReadOnlyCell } from "./TableCells";

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

export default function VolumeRow({ row, columns, showSeriesColumn }) {
	return (
		<tr>
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
					<ReadOnlyCell column={column} row={row} />
				</td>
			))}
		</tr>
	);
}
