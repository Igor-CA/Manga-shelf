import { useContext, useMemo, useState } from "react";
import SeriesVolumesList from "./SeriesVolumesList";
import ViewToggle, {
	readStoredView,
	writeStoredView,
} from "../../components/ViewToggle";
import OwnedVolumesTable from "../../components/volumesTable/OwnedVolumesTable";
import { useOwnedVolumeEdits } from "../../utils/useOwnedVolumeEdits";
import { toDateInputValue } from "../../utils/formatters";
import { UserContext } from "../../contexts/userProvider";
import { usePrompt } from "../../contexts/PromptContext";

const TABLE_VIEW_KEY = "view:seriesVolumes";

const hasRecordedData = (row) =>
	row.price != null ||
	row.condition != null ||
	row.store != null ||
	row.readAt != null ||
	row.readCount > 0 ||
	!!row.notes;

export default function SeriesVolumesPage({ series, volumesState, actions }) {
	const { handleVolumeChange, handleReadToggle } = actions;
	const { user } = useContext(UserContext);
	const { confirm } = usePrompt();
	const edits = useOwnedVolumeEdits();

	const [view, setView] = useState(() => readStoredView(TABLE_VIEW_KEY));
	const ownsAny = volumesState.some((volume) => volume.ownsVolume);

	const handleViewChange = (nextView) =>
		edits.guard(() => {
			setView(nextView);
			writeStoredView(TABLE_VIEW_KEY, nextView);
		});

	const tableRows = useMemo(() => {
		const ownedById = new Map(
			(user?.ownedVolumes || []).map((owned) => [
				String(owned.volume?._id ?? owned.volume),
				owned,
			]),
		);
		const ownsById = new Map(
			volumesState.map((volume) => [volume.volumeId, volume.ownsVolume]),
		);
		return (series.volumes || []).map((volume) => {
			const ownsVolume = ownsById.get(volume.volumeId) ?? false;
			const owned = ownsVolume ? ownedById.get(volume.volumeId) : null;
			return {
				volumeId: volume.volumeId,
				seriesId: series.id,
				seriesTitle: series.title,
				volumeNumber: volume.volumeNumber,
				isVariant: volume.isVariant,
				variantNumber: volume.variantNumber,
				owned: ownsVolume,
				isRead: owned?.isRead || false,
				readAt: toDateInputValue(owned?.readAt),
				readCount: owned?.readCount ?? 0,
				rating: series.myVolumeScores?.[volume.volumeId] ?? null,
				price: owned?.purchasePrice ?? null,
				condition: owned?.condition ?? null,
				store: owned?.store ?? null,
				acquiredAt: toDateInputValue(owned?.acquiredAt),
				amount: owned?.amount ?? 1,
				notes: owned?.notes ?? null,
				lotSize: owned?.lotSize ?? null,
			};
		});
	}, [series, user, volumesState]);

	const handleToggleOwnership = (row, checked) => {
		const toggle = () => handleVolumeChange({ target: { checked } }, row.volumeId);
		if (checked) return toggle();

		const pendingCount = row.pendingFields?.size || 0;
		const remove = () => {
			edits.discardRow(row.volumeId);
			toggle();
		};
		if (!hasRecordedData(row) && pendingCount === 0) return remove();

		const pendingNote =
			pendingCount > 0
				? ` e ${pendingCount} alteraç${pendingCount === 1 ? "ão não salva" : "ões não salvas"}`
				: "";
		confirm(
			`Remover o volume ${row.volumeNumber}? Os dados registrados${pendingNote} serão perdidos.`,
			remove,
		);
	};

	return (
		<div className="container">
			<div className="content-overall__container">
				<div className="overall-content__container">
					<hr style={{ margin: "0px 10px" }} />
					<div className="view-toggle-row">
						<h2 className="collection-lable">Volumes</h2>
						{ownsAny && <ViewToggle view={view} onChange={handleViewChange} />}
					</div>
					{view === "table" && ownsAny ? (
						<OwnedVolumesTable
							rows={tableRows}
							editable
							onToggleOwnership={handleToggleOwnership}
							edits={edits}
						/>
					) : (
						<SeriesVolumesList
							volumes={series.volumes}
							localVolumesList={volumesState}
							handleChange={handleVolumeChange}
							handleReadToggle={handleReadToggle}
							dense={false}
						></SeriesVolumesList>
					)}
				</div>
			</div>
		</div>
	);
}
