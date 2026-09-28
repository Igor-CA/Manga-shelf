import { useCallback, useContext, useMemo, useRef, useState } from "react";
import axios from "axios";
import { UserContext } from "../contexts/userProvider";
import { messageContext } from "../contexts/messageStateProvider";
import { usePrompt } from "../contexts/PromptContext";
import { applyReadStateChange } from "./readStateRules";
import { toDateInputValue } from "./formatters";
import { findPreviousUnread, PREVIOUS_UNREAD_PROMPT } from "./previousUnreadVolumes";

const MAX_BATCH_EDITS = 500;
const READ_STATE_FIELDS = ["isRead", "readCount", "readAt"];
const EMPTY_SET = new Set();

const isEmpty = (value) => value === null || value === undefined || value === "";

export function useOwnedVolumeEdits() {
	const { user, setOutdated } = useContext(UserContext);
	const { addMessage } = useContext(messageContext);
	const { confirm } = usePrompt();

	const [pending, setPending] = useState(() => new Map());
	const [errors, setErrors] = useState(() => new Map());
	const [saving, setSaving] = useState(false);
	const pendingRef = useRef(pending);
	const seriesVolumesRef = useRef(new Map());

	const savedReadState = useMemo(
		() =>
			new Map(
				(user?.ownedVolumes || []).map((owned) => [
					String(owned.volume?._id ?? owned.volume),
					{
						isRead: owned.isRead || false,
						readCount: owned.readCount ?? 0,
						readAt: toDateInputValue(owned.readAt),
					},
				]),
			),
		[user],
	);

	const applyFieldChange = useCallback(
		(row, field, value) => {
			const prev = pendingRef.current;
			const existing = prev.get(row.volumeId);

			if (!existing && prev.size >= MAX_BATCH_EDITS) {
				addMessage("Salve as alterações antes de editar mais volumes.");
				return;
			}

			const fields = { ...(existing?.fields || {}) };
			const base = { ...(existing?.base || {}) };

			const applyOne = (f, v) => {
				const savedValue = f in base ? base[f] : row[f];
				if (v === savedValue || (isEmpty(v) && isEmpty(savedValue))) {
					delete fields[f];
					delete base[f];
				} else {
					fields[f] = v;
					base[f] = savedValue ?? null;
				}
			};

			if (READ_STATE_FIELDS.includes(field)) {
				const effective = (f) => (f in fields ? fields[f] : row[f]);
				const result = applyReadStateChange(
					{
						isRead: effective("isRead"),
						readCount: effective("readCount"),
						readAt: effective("readAt"),
					},
					field,
					value,
				);
				applyOne("isRead", result.isRead);
				applyOne("readCount", result.readCount);
				applyOne("readAt", result.readAt);
			} else {
				applyOne(field, value);
			}

			const next = new Map(prev);
			if (Object.keys(fields).length === 0) {
				next.delete(row.volumeId);
			} else {
				next.set(row.volumeId, {
					fields,
					base,
					seriesId: row.seriesId,
					seriesTitle: row.seriesTitle,
					volumeNumber: row.volumeNumber,
					isVariant: row.isVariant,
				});
			}

			pendingRef.current = next;
			setPending(next);
		},
		[addMessage],
	);

	const getSeriesVolumes = useCallback(async (seriesId) => {
		if (!seriesVolumesRef.current.has(seriesId)) {
			const response = await axios.get(
				`${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/series/${seriesId}`,
				{
					withCredentials: true,
					headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				},
			);
			seriesVolumesRef.current.set(seriesId, response.data.volumes);
		}
		return seriesVolumesRef.current.get(seriesId);
	}, []);

	const markRead = useCallback(
		async (row) => {
			const markRow = () => applyFieldChange(row, "isRead", true);

			let seriesVolumes = [];
			try {
				seriesVolumes = await getSeriesVolumes(row.seriesId);
			} catch (err) {
				console.error("Error fetching series volumes:", err);
			}

			const volumeStates = seriesVolumes.map((volume) => {
				const saved = savedReadState.get(volume.volumeId);
				const pendingIsRead = pendingRef.current.get(volume.volumeId)?.fields.isRead;
				return {
					...volume,
					ownsVolume: !!saved,
					isRead: pendingIsRead ?? saved?.isRead ?? false,
				};
			});
			const previousUnread = findPreviousUnread(volumeStates, row.volumeId);
			if (previousUnread.length === 0) return markRow();

			confirm(
				PREVIOUS_UNREAD_PROMPT,
				() => {
					previousUnread.forEach((volume) =>
						applyFieldChange(
							{
								volumeId: volume.volumeId,
								seriesId: row.seriesId,
								seriesTitle: row.seriesTitle,
								volumeNumber: volume.volumeNumber,
								isVariant: false,
								...savedReadState.get(volume.volumeId),
							},
							"isRead",
							true,
						),
					);
					markRow();
				},
				markRow,
			);
		},
		[applyFieldChange, confirm, getSeriesVolumes, savedReadState],
	);

	const setField = useCallback(
		(row, field, value) => {
			if (field === "isRead" && value === true) markRead(row);
			else applyFieldChange(row, field, value);
		},
		[applyFieldChange, markRead],
	);

	const discardAll = useCallback(() => {
		pendingRef.current = new Map();
		setPending(new Map());
		setErrors(new Map());
	}, []);

	const save = useCallback(async () => {
		if (pending.size === 0) return true;
		setSaving(true);

		const edits = Array.from(pending.entries()).map(([volume, entry]) => ({
			volume,
			...entry.fields,
		}));

		try {
			await axios({
				method: "PATCH",
				data: { edits },
				withCredentials: true,
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/owned-volumes/batch`,
			});
			pendingRef.current = new Map();
			setPending(new Map());
			setErrors(new Map());
			addMessage("Alterações salvas com sucesso.", "Success");
			setOutdated(true);
			return true;
		} catch (err) {
			const data = err.response?.data;
			const nextErrors = new Map();
			(data?.errors || []).forEach((e) => {
				const entry = nextErrors.get(e.volume) || {};
				entry[e.field || "_general"] = e.msg;
				nextErrors.set(e.volume, entry);
			});
			setErrors(nextErrors);
			addMessage(data?.msg || "Erro de conexão. Tente novamente.");
			return false;
		} finally {
			setSaving(false);
		}
	}, [pending, addMessage, setOutdated]);

	const revert = useCallback((volumeId, field) => {
		const entry = pendingRef.current.get(volumeId);
		if (!entry) return;

		const fields = { ...entry.fields };
		const base = { ...entry.base };
		delete fields[field];
		delete base[field];

		const next = new Map(pendingRef.current);
		if (Object.keys(fields).length === 0) next.delete(volumeId);
		else next.set(volumeId, { ...entry, fields, base });
		pendingRef.current = next;
		setPending(next);
	}, []);

	const fillDown = useCallback(
		(sourceRow, field, rowViews) => {
			const value = sourceRow[field];
			const start = rowViews.findIndex((row) => row.volumeId === sourceRow.volumeId);
			if (isEmpty(value) || start === -1) return;

			for (const row of rowViews.slice(start + 1)) {
				if (row.seriesId !== sourceRow.seriesId) break;
				if (row.owned && isEmpty(row[field])) applyFieldChange(row, field, value);
			}
		},
		[applyFieldChange],
	);

	const countOutside = useCallback(
		(visibleIds) => {
			const visible = new Set(visibleIds);
			let count = 0;
			pending.forEach((_entry, volumeId) => {
				if (!visible.has(volumeId)) count += 1;
			});
			return count;
		},
		[pending],
	);

	const getRowView = useCallback(
		(row) => {
			const entry = pending.get(row.volumeId);
			if (!entry) return { ...row, pendingFields: EMPTY_SET, fieldErrors: null };
			return {
				...row,
				...entry.fields,
				pendingFields: new Set(Object.keys(entry.fields)),
				fieldErrors: errors.get(row.volumeId) || null,
			};
		},
		[pending, errors],
	);

	const getPendingList = useCallback(
		() =>
			Array.from(pending.entries()).map(([volumeId, entry]) => ({
				volumeId,
				...entry,
				fieldErrors: errors.get(volumeId) || null,
			})),
		[pending, errors],
	);

	return {
		count: pending.size,
		saving,
		getRowView,
		getPendingList,
		setField,
		revert,
		fillDown,
		discardAll,
		save,
		countOutside,
	};
}
