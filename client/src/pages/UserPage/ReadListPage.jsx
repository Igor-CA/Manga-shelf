import axios from "axios";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../SeriesPage/SeriesPage.css";
import SeriesCardList from "../../components/cards/SeriesCardList";
import FilterControls from "../../components/FilterControls";
import ViewToggle, {
	readStoredView,
	writeStoredView,
} from "../../components/ViewToggle";
import OwnedVolumesTable from "../../components/volumesTable/OwnedVolumesTable";
import ExportCollectionControl from "../../components/ExportCollectionControl";
import { useOwnedVolumeEdits } from "../../utils/useOwnedVolumeEdits";
import { useFilterHandler } from "../../utils/useFiltersHandler";
import { hasActiveFilters } from "../../utils/hasActiveFilters";
import { useCallback } from "react";
import { useContext } from "react";
import { useMemo } from "react";
import { useEffect, useRef, useState } from "react";
import { UserContext } from "../../contexts/userProvider";
import { toDateInputValue } from "../../utils/formatters";

const TABLE_VIEW_KEY = "view:readList";
const TABLE_PAGE_SIZE = 50;

const normalizeTableRow = (row) => ({
	volumeId: row._id,
	seriesId: row.seriesId,
	seriesTitle: row.title,
	volumeNumber: row.volumeNumber,
	isVariant: row.isVariant,
	variantNumber: row.variantNumber,
	owned: true,
	isRead: row.isRead,
	readAt: toDateInputValue(row.readAt),
	readCount: row.readCount ?? 0,
	rating: row.ratingScore,
	price: row.purchasePrice ?? null,
	condition: row.condition ?? null,
	store: row.store ?? null,
	acquiredAt: toDateInputValue(row.acquiredAt),
	amount: row.amount,
	notes: row.notes ?? null,
	lotSize: row.lotSize ?? null,
});

export default function ReadListPage() {
	const { username } = useParams();
	const navigate = useNavigate();
	const { user: loggedUser } = useContext(UserContext);
	const isOwner = username === loggedUser?.username;
	const personalRatingLabel =
		username === loggedUser?.username ? "Sua nota" : `Nota de ${username}`;

	const [view, setView] = useState(() => readStoredView(TABLE_VIEW_KEY));
	const edits = useOwnedVolumeEdits();

	const handleViewChange = (nextView) =>
		edits.guard(() => {
			setView(nextView);
			writeStoredView(TABLE_VIEW_KEY, nextView);
		});

	const fetchFiltersUrl = `${
		import.meta.env.REACT_APP_HOST_ORIGIN
	}/api/data/user/${username}/filters`;
	const {
		params,
		genreList,
		publishersList,
		typesList,
		demographicsList,
		handleChange,
		searchBarValue,
	} = useFilterHandler(fetchFiltersUrl, true, {}, "title");
	const fetchVolumes = useCallback(
		async (page, params) => {
			try {
				const response = await axios({
					method: "GET",
					withCredentials: true,
					headers: {
						Authorization: import.meta.env.REACT_APP_API_KEY,
					},
					params: {
						p: page,
						...params,
					},
					url: `${
						import.meta.env.REACT_APP_HOST_ORIGIN
					}/api/data/user/${username}/volumes`,
				});
				return response.data;
			} catch (error) {
				const errorType = error.response?.status; // Added optional chaining safety
				if (errorType === 400) {
					navigate("/404");
				}
				console.error("Error fetching volumes:", error.response?.data?.msg);
			}
		},
		[username, navigate]
	); // Dependencies: recreate only if these change
	const filtersActive = hasActiveFilters(params, searchBarValue);

	const EmptyListComponent = () => {
		if (filtersActive) {
			return (
				<p className="not-found-message">
					Nenhum volume corresponde aos filtros selecionados.
				</p>
			);
		}
		return (
			<p className="not-found-message">
				Esta conta não possuí nenhum volume. Talvez seja a hora de começar uma
				nova coleção?
				<Link to={"/browse"}>
					<strong>Busque novos títulos na nossa página de pesquisa</strong>
				</Link>{" "}
			</p>
		);
	};

	const unreadArgs = useMemo(() => [{ ...params, group: false }], [params]);
    const readArgs = useMemo(() => [{ ...params, group: true }], [params]);

	const [searchParams, setSearchParams] = useSearchParams();
	const tablePage = Math.max(1, parseInt(searchParams.get("p")) || 1);
	const setTablePage = (page) =>
		setSearchParams((current) => {
			const next = new URLSearchParams(current);
			if (page === 1) next.delete("p");
			else next.set("p", page);
			return next;
		});

	const [tableRows, setTableRows] = useState([]);
	const [tableTotal, setTableTotal] = useState(0);
	const [tableLoading, setTableLoading] = useState(true);
	const tableRequestRef = useRef(0);

	const fetchTablePage = useCallback(
		async (page) => {
			const requestId = ++tableRequestRef.current;
			setTableLoading(true);
			try {
				const response = await axios({
					method: "GET",
					withCredentials: true,
					headers: {
						Authorization: import.meta.env.REACT_APP_API_KEY,
					},
					params: { p: page, ...params },
					url: `${
						import.meta.env.REACT_APP_HOST_ORIGIN
					}/api/data/user/${username}/volumes/table`,
				});
				if (requestId !== tableRequestRef.current) return;
				setTableRows((response.data.items || []).map(normalizeTableRow));
				setTableTotal(response.data.total || 0);
			} catch (error) {
				if (requestId !== tableRequestRef.current) return;
				if (error.response?.status === 400) navigate("/404");
				console.error(
					"Error fetching volumes table:",
					error.response?.data?.msg
				);
			} finally {
				if (requestId === tableRequestRef.current) setTableLoading(false);
			}
		},
		[username, params, navigate]
	);

	useEffect(() => {
		if (view !== "table") return;
		fetchTablePage(tablePage);
	}, [view, tablePage, fetchTablePage]);

	const totalPages = Math.max(1, Math.ceil(tableTotal / TABLE_PAGE_SIZE));

	return (
		<div className="container">
			<FilterControls
				availableFilters={[
					"search",
					"genre",
					"publisher",
					"status",
					"demographic",
					"type",
					"ordering",
				]}
				handleChange={handleChange}
				values={{ searchBarValue, ...params }}
				lists={{ genreList, publishersList, typesList, demographicsList }}
				personalRatingLabel={personalRatingLabel}
			></FilterControls>
			<div className="view-toggle-bar">
				{view === "table" && isOwner && !filtersActive && (
					<ExportCollectionControl />
				)}
				<ViewToggle view={view} onChange={handleViewChange} />
			</div>

			{view === "table" ? (
				tableRows.length === 0 && !tableLoading ? (
					<EmptyListComponent />
				) : (
					<OwnedVolumesTable
						rows={tableRows}
						editable={isOwner}
						showSeriesColumn
						edits={edits}
						loading={tableLoading}
						pagination={{
							page: tablePage,
							totalPages,
							onPageChange: setTablePage,
						}}
						onSaved={() => fetchTablePage(tablePage)}
					/>
				)
			) : (
				<>
					<hr style={{ margin: "0px 10px" }} />
					<h2 className="collection-lable">Não lidos</h2>
					<SeriesCardList
						skeletonsCount={36}
						fetchFunction={fetchVolumes}
						itemType="Volumes-Read"
						errorComponent={EmptyListComponent}
						showActions={true}
						functionArguments={unreadArgs}
					></SeriesCardList>

					<hr style={{ margin: "0px 10px" }} />
					<h2 className="collection-lable">Lidos</h2>
					<SeriesCardList
						skeletonsCount={36}
						fetchFunction={fetchVolumes}
						itemType="Volumes-Read"
						errorComponent={EmptyListComponent}
						showActions={true}
						functionArguments={readArgs}
					></SeriesCardList>
				</>
			)}
		</div>
	);
}
