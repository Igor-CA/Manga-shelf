import { BsGridFill, BsTable } from "react-icons/bs";
import "./ViewToggle.css";

const readStoredView = (storageKey) => {
	try {
		return localStorage.getItem(storageKey) === "table" ? "table" : "cards";
	} catch {
		return "cards";
	}
};

const writeStoredView = (storageKey, view) => {
	try {
		localStorage.setItem(storageKey, view);
	} catch {
		return;
	}
};

export { readStoredView, writeStoredView };

export default function ViewToggle({ view, onChange }) {
	return (
		<div className="view-toggle" role="group" aria-label="Modo de visualização">
			<button
				type="button"
				className={`view-toggle__button${
					view === "cards" ? " view-toggle__button--active" : ""
				}`}
				aria-pressed={view === "cards"}
				title="Ver como capas"
				onClick={() => onChange("cards")}
			>
				<BsGridFill />
			</button>
			<button
				type="button"
				className={`view-toggle__button${
					view === "table" ? " view-toggle__button--active" : ""
				}`}
				aria-pressed={view === "table"}
				title="Ver como tabela"
				onClick={() => onChange("table")}
			>
				<BsTable />
			</button>
		</div>
	);
}
