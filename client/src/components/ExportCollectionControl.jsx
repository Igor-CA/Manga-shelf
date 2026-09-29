import { useContext, useEffect, useRef, useState } from "react";
import { FaFileCsv, FaFileExcel } from "react-icons/fa";
import { downloadCollectionExport } from "../utils/downloadCollectionExport";
import { messageContext } from "../contexts/messageStateProvider";
import "./ExportCollectionControl.css";

const FORMATS = [
	{
		value: "csv",
		label: "CSV",
		hint: "Um .zip com volumes.csv e obras.csv",
		Icon: FaFileCsv,
	},
	{
		value: "xlsx",
		label: "Excel",
		hint: "Um .xlsx com as abas Volumes e Obras",
		Icon: FaFileExcel,
	},
];

const readServerMessage = async (error) => {
	try {
		return JSON.parse(await error.response.data.text()).msg;
	} catch {
		return null;
	}
};

export default function ExportCollectionControl() {
	const { addMessage } = useContext(messageContext);
	const dialogRef = useRef(null);
	const [open, setOpen] = useState(false);
	const [exportingFormat, setExportingFormat] = useState(null);

	useEffect(() => {
		if (open) dialogRef.current?.showModal();
		else dialogRef.current?.close();
	}, [open]);

	const handleExport = async (format) => {
		if (exportingFormat) return;
		setExportingFormat(format);
		try {
			await downloadCollectionExport(format);
			setOpen(false);
		} catch (error) {
			addMessage(
				(await readServerMessage(error)) ||
					"Não foi possível exportar os seus dados",
			);
		} finally {
			setExportingFormat(null);
		}
	};

	const handleCancel = (e) => {
		if (exportingFormat) e.preventDefault();
	};

	return (
		<>
			<button type="button" className="button" onClick={() => setOpen(true)}>
				Exportar
			</button>
			<dialog
				ref={dialogRef}
				className="edit-modal"
				onCancel={handleCancel}
				onClose={() => setOpen(false)}
			>
				<div className="modal-content export-collection">
					<h2 className="modal-title">Exportar coleção</h2>
					<p className="export-collection__text">
						Escolha o formato do arquivo.
					</p>
					<div className="export-collection__options">
						{FORMATS.map(({ value, label, hint, Icon }) => (
							<button
								key={value}
								type="button"
								className="export-collection__option"
								onClick={() => handleExport(value)}
								disabled={Boolean(exportingFormat)}
							>
								<Icon className="export-collection__icon" aria-hidden="true" />
								<span className="export-collection__option-text">
									<span className="export-collection__label">
										{exportingFormat === value ? "Exportando…" : label}
									</span>
									<span className="export-collection__hint">{hint}</span>
								</span>
							</button>
						))}
					</div>
					<button
						type="button"
						className="export-collection__close"
						onClick={() => setOpen(false)}
						disabled={Boolean(exportingFormat)}
						aria-label="Fechar"
					>
						×
					</button>
				</div>
			</dialog>
		</>
	);
}
