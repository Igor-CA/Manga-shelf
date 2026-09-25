import { useLayoutEffect, useRef, useState } from "react";
import VolumeRow from "./VolumeRow";
import TablePagination from "./TablePagination";
import { ALL_COLUMNS, VISITOR_COLUMN_KEYS } from "./columns";
import "./OwnedVolumesTable.css";

const SKELETON_ROWS = 10;

export default function OwnedVolumesTable({
	rows,
	editable,
	showSeriesColumn = false,
	loading = false,
	pagination,
}) {
	const [headSize, setHeadSize] = useState(null);
	const wrapRef = useRef(null);
	const tableRef = useRef(null);
	const stickyHeadRef = useRef(null);
	const bodyScrollRef = useRef(null);
	const headLeadsScrollRef = useRef(false);

	const columns = editable
		? ALL_COLUMNS
		: ALL_COLUMNS.filter((column) => VISITOR_COLUMN_KEYS.includes(column.key));
	const headerColumns = [{ key: "volume", label: "Volume" }, ...columns];

	useLayoutEffect(() => {
		const table = tableRef.current;
		const cells = Array.from(table.tHead.rows[0].cells);
		const observer = new ResizeObserver(() => {
			setHeadSize({
				width: table.offsetWidth,
				height:
					table.tHead.getBoundingClientRect().bottom -
					table.parentElement.getBoundingClientRect().top,
				columns: cells.map((cell) => cell.getBoundingClientRect().width),
			});
		});
		observer.observe(table);
		cells.forEach((cell) => observer.observe(cell));
		return () => observer.disconnect();
	}, [columns.length]);

	const renderHeaderRow = (widths) => (
		<tr>
			{headerColumns.map((column, index) => (
				<th
					key={column.key}
					className={`volumes-table__cell${
						column.key === "volume" ? " volumes-table__cell--volume" : ""
					}`}
					style={widths && { width: widths[index] }}
				>
					{column.label}
				</th>
			))}
		</tr>
	);

	const renderSkeletonRows = () =>
		Array.from({ length: rows.length || SKELETON_ROWS }, (_, rowIndex) => (
			<tr key={rowIndex}>
				{headerColumns.map((column) => (
					<td
						key={column.key}
						className={`volumes-table__cell${
							column.key === "volume" ? " volumes-table__cell--volume" : ""
						}`}
					>
						<div className="volumes-table__skeleton" />
					</td>
				))}
			</tr>
		));

	const leadScrollFrom = (fromHead) => () => {
		headLeadsScrollRef.current = fromHead;
	};

	const followScroll = (targetRef, fromHead) => (e) => {
		if (headLeadsScrollRef.current === fromHead && targetRef.current) {
			targetRef.current.scrollLeft = e.currentTarget.scrollLeft;
		}
	};

	return (
		<div className="volumes-table__wrap" ref={wrapRef}>
			<div className="volumes-table__frame">
				{headSize && (
					<div className="volumes-table__sticky-head">
						<div
							className="volumes-table__sticky-head-scroll"
							ref={stickyHeadRef}
							aria-hidden="true"
							tabIndex={-1}
							onPointerDown={leadScrollFrom(true)}
							onWheel={leadScrollFrom(true)}
							onScroll={followScroll(bodyScrollRef, true)}
						>
							<table
								className="volumes-table volumes-table--sticky-head"
								style={{ width: headSize.width }}
							>
								<thead>{renderHeaderRow(headSize.columns)}</thead>
							</table>
						</div>
					</div>
				)}
				<div
					className="volumes-table__scroll"
					ref={bodyScrollRef}
					style={headSize ? { marginTop: -headSize.height } : undefined}
					onPointerDown={leadScrollFrom(false)}
					onWheel={leadScrollFrom(false)}
					onFocus={leadScrollFrom(false)}
					onScroll={followScroll(stickyHeadRef, false)}
				>
					<table
						className={`volumes-table${loading ? " volumes-table--loading" : ""}`}
						ref={tableRef}
						aria-busy={loading}
					>
						<thead>{renderHeaderRow()}</thead>
						<tbody>
							{loading && rows.length === 0
								? renderSkeletonRows()
								: rows.map((row) => (
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
			</div>

			{pagination && (
				<TablePagination
					{...pagination}
					onPageChange={(page) => {
						pagination.onPageChange(page);
						wrapRef.current.scrollIntoView({ block: "start" });
					}}
				/>
			)}
		</div>
	);
}
