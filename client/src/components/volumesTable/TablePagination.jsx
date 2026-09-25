import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const SIBLING_PAGES = 2;

const getPageItems = (page, totalPages) => {
	let start = Math.max(2, page - SIBLING_PAGES);
	let end = Math.min(totalPages - 1, page + SIBLING_PAGES);
	if (start === 3) start = 2;
	if (end === totalPages - 2) end = totalPages - 1;

	const items = [1];
	if (start > 2) items.push("start-gap");
	for (let p = start; p <= end; p++) items.push(p);
	if (end < totalPages - 1) items.push("end-gap");
	items.push(totalPages);
	return items;
};

export default function TablePagination({ page, totalPages, onPageChange }) {
	if (totalPages <= 1) return null;

	return (
		<nav className="table-pagination" aria-label="Páginas">
			<button
				type="button"
				className="table-pagination__item table-pagination__arrow"
				aria-label="Página anterior"
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
			>
				<FaChevronLeft />
			</button>
			{getPageItems(page, totalPages).map((item) =>
				typeof item === "number" ? (
					<button
						key={item}
						type="button"
						className={`table-pagination__item${
							item === page ? " table-pagination__item--active" : ""
						}`}
						aria-current={item === page ? "page" : undefined}
						onClick={() => item !== page && onPageChange(item)}
					>
						{item}
					</button>
				) : (
					<span key={item} className="table-pagination__gap">
						…
					</span>
				),
			)}
			<button
				type="button"
				className="table-pagination__item table-pagination__arrow"
				aria-label="Próxima página"
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
			>
				<FaChevronRight />
			</button>
		</nav>
	);
}
