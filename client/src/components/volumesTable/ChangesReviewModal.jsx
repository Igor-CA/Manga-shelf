import { useEffect, useRef } from "react";
import { COLUMN_BY_KEY } from "./columns";
import { formatCellValue } from "./TableCells";
import "./ChangesReviewModal.css";

export default function ChangesReviewModal({
	open,
	onClose,
	pendingList,
	onRevert,
	onDiscardAll,
	onSave,
	saving,
}) {
	const dialogRef = useRef(null);

	useEffect(() => {
		if (open) dialogRef.current?.showModal();
		else dialogRef.current?.close();
	}, [open]);

	return (
		<dialog ref={dialogRef} className="changes-review-modal" onClose={onClose}>
			<div className="changes-review-modal__content">
				<h2 className="modal-title">Alterações não salvas</h2>
				{pendingList.length === 0 ? (
					<p className="changes-review-modal__empty">Nenhuma alteração pendente.</p>
				) : (
					<ul className="changes-review-modal__list">
						{pendingList.map((entry) => (
							<li key={entry.volumeId}>
								<div className="changes-review-modal__item-title">
									{entry.seriesTitle} · Vol. {entry.volumeNumber}
								</div>
								<ul className="changes-review-modal__fields">
									{Object.keys(entry.fields).map((field) => {
										const column = COLUMN_BY_KEY[field];
										return (
											<li key={field} className="changes-review-modal__field">
												<span className="changes-review-modal__field-label">
													{column.label}
												</span>
												<span>
													{formatCellValue(column, entry.base[field])}
													{" → "}
													{formatCellValue(column, entry.fields[field])}
												</span>
												{entry.fieldErrors?.[field] && (
													<span className="changes-review-modal__field-error">
														{entry.fieldErrors[field]}
													</span>
												)}
												<button
													type="button"
													className="changes-review-modal__revert"
													onClick={() => onRevert(entry.volumeId, field)}
												>
													Desfazer
												</button>
											</li>
										);
									})}
								</ul>
							</li>
						))}
					</ul>
				)}
				<div className="modal-actions">
					<button
						type="button"
						className="button button--red"
						onClick={onDiscardAll}
						disabled={pendingList.length === 0}
					>
						Descartar tudo
					</button>
					<button
						type="button"
						className="button"
						onClick={onSave}
						disabled={pendingList.length === 0 || saving}
					>
						{saving ? "Salvando..." : `Salvar (${pendingList.length})`}
					</button>
				</div>
				<button
					type="button"
					className="changes-review-modal__close"
					onClick={onClose}
					aria-label="Fechar"
				>
					×
				</button>
			</div>
		</dialog>
	);
}
