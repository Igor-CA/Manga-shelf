import { useLayoutEffect, useRef, useState } from "react";
import VolumeRow from "./VolumeRow";
import TablePagination from "./TablePagination";
import ChangesReviewModal from "./ChangesReviewModal";
import { ALL_COLUMNS, VISITOR_COLUMN_KEYS } from "./columns";
import "./OwnedVolumesTable.css";

const SKELETON_ROWS = 10;

export default function OwnedVolumesTable({
	rows,
	editable,
	showSeriesColumn = false,
	edits,
	loading = false,
	pagination,
	onSaved,
}) {
	const [headSize, setHeadSize] = useState(null);
	const [reviewOpen, setReviewOpen] = useState(false);
	const wrapRef = useRef(null);
	const tableRef = useRef(null);
	const stickyHeadRef = useRef(null);
	const bodyScrollRef = useRef(null);
	const headLeadsScrollRef = useRef(false);

	const columns = editable
		? ALL_COLUMNS
		: ALL_COLUMNS.filter((column) => VISITOR_COLUMN_KEYS.includes(column.key));
	const headerColumns = [{ key: "volume", label: "Volume" }, ...columns];
	const rowViews = editable ? rows.map(edits.getRowView) : rows;

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

	useLayoutEffect(() => {
		if (stickyHeadRef.current && bodyScrollRef.current) {
			stickyHeadRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
		}
	}, [headSize]);

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

	const handleTableKeyDown = (e) => {
		if (e.key !== "Enter") return;
		const target = e.target;
		if (target.tagName === "TEXTAREA") return;
		const col = target.dataset?.col;
		if (!col) return;
		e.preventDefault();
		target.blur();
		requestAnimationFrame(() => {
			const inputs = Array.from(
				tableRef.current?.querySelectorAll(`[data-col="${col}"]`) || [],
			);
			inputs[inputs.indexOf(target) + 1]?.focus();
		});
	};

	const outsideCount = editable
		? edits.countOutside(rows.map((row) => row.volumeId))
		: 0;

	const handleSave = async () => {
		if (!(await edits.save())) return;
		setReviewOpen(false);
		onSaved?.();
	};

	const handleDiscardAll = () => {
		edits.discardAll();
		setReviewOpen(false);
	};

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
						onKeyDown={handleTableKeyDown}
					>
						<thead>{renderHeaderRow()}</thead>
						<tbody>
							{loading && rows.length === 0
								? renderSkeletonRows()
								: rowViews.map((row) => (
										<VolumeRow
											key={row.volumeId}
											row={row}
											columns={columns}
											editable={editable}
											showSeriesColumn={showSeriesColumn}
											onFieldChange={edits.setField}
											onFillDown={(sourceRow, field) =>
												edits.fillDown(sourceRow, field, rowViews)
											}
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

			{editable && edits.count > 0 && (
				<div className="volumes-table__pending-bar">
					<div className="volumes-table__pending-info">
						<button
							type="button"
							className="volumes-table__pending-count"
							onClick={() => setReviewOpen(true)}
						>
							{edits.count} alteraç{edits.count === 1 ? "ão" : "ões"}
						</button>
						{outsideCount > 0 && (
							<button
								type="button"
								className="volumes-table__pending-outside"
								onClick={() => setReviewOpen(true)}
							>
								{outsideCount} fora desta página
							</button>
						)}
					</div>
					<div className="volumes-table__pending-actions">
						<button
							type="button"
							className="button button--red"
							onClick={handleDiscardAll}
						>
							Descartar tudo
						</button>
						<button
							type="button"
							className="button"
							onClick={handleSave}
							disabled={edits.saving}
						>
							{edits.saving ? "Salvando..." : `Salvar (${edits.count})`}
						</button>
					</div>
				</div>
			)}

			{editable && (
				<ChangesReviewModal
					open={reviewOpen}
					onClose={() => setReviewOpen(false)}
					pendingList={edits.getPendingList()}
					onRevert={edits.revert}
					onDiscardAll={handleDiscardAll}
					onSave={handleSave}
					saving={edits.saving}
				/>
			)}
		</div>
	);
}
