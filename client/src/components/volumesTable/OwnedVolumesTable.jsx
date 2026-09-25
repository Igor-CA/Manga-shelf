import VolumeRow from "./VolumeRow";
import TablePagination from "./TablePagination";
import { ALL_COLUMNS, VISITOR_COLUMN_KEYS } from "./columns";
import "./OwnedVolumesTable.css";

export default function OwnedVolumesTable({
	rows,
	editable,
	showSeriesColumn = false,
	pagination,
}) {
	const columns = editable
		? ALL_COLUMNS
		: ALL_COLUMNS.filter((column) => VISITOR_COLUMN_KEYS.includes(column.key));
	const headerColumns = [{ key: "volume", label: "Volume" }, ...columns];

	return (
		<div className="volumes-table__wrap">
			<div className="volumes-table__scroll">
				<table className="volumes-table">
					<thead>
						<tr>
							{headerColumns.map((column) => (
								<th
									key={column.key}
									className={`volumes-table__cell${
										column.key === "volume" ? " volumes-table__cell--volume" : ""
									}`}
								>
									{column.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<VolumeRow
								key={row.volumeId}
								row={row}
								columns={columns}
								showSeriesColumn={showSeriesColumn}
							/>
						))}
					</tbody>
				</table>
			</div>

			{pagination && <TablePagination {...pagination} />}
		</div>
	);
}
