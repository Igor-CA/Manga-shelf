import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { messageContext } from "../contexts/messageStateProvider";

const round1 = (n) => Math.round(n * 10) / 10;

export function useRating({
	seriesId,
	volumeId = null,
	manualScore = null,
	derivedScore = null,
	average = 0,
	count = 0,
}) {
	const { addMessage, setMessageType } = useContext(messageContext);
	const [score, setScore] = useState(manualScore);
	const [avg, setAvg] = useState(average);
	const [cnt, setCnt] = useState(count);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setScore(manualScore ?? null);
		setAvg(average ?? 0);
		setCnt(count ?? 0);
	}, [seriesId, volumeId, manualScore, average, count]);

	const effectiveScore = score ?? derivedScore;
	const isDerived = score == null && derivedScore != null;

	const recompute = (oldEff, newEff) => {
		if (oldEff == null && newEff == null) return { avg: avg, cnt: cnt };
		if (oldEff == null) {
			const nc = cnt + 1;
			return { avg: round1((avg * cnt + newEff) / nc), cnt: nc };
		}
		if (newEff == null) {
			const nc = cnt - 1;
			return { avg: nc > 0 ? round1((avg * cnt - oldEff) / nc) : 0, cnt: Math.max(nc, 0) };
		}
		return { avg: round1((avg * cnt - oldEff + newEff) / cnt), cnt: cnt };
	};

	const write = async (method, body, nextScore, oldEff, newEff, successMsg, errorMsg) => {
		const prev = { score, avg, cnt };
		const next = recompute(oldEff, newEff);
		setScore(nextScore);
		setAvg(next.avg);
		setCnt(next.cnt);
		setLoading(true);
		try {
			await axios({
				method,
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/rating`,
				data: { seriesId, volumeId: volumeId || undefined, ...body },
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				withCredentials: true,
			});
			setMessageType("Success");
			addMessage(successMsg);
		} catch {
			setScore(prev.score);
			setAvg(prev.avg);
			setCnt(prev.cnt);
			addMessage(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	const submit = (newScore) =>
		write(
			"POST",
			{ score: newScore },
			newScore,
			score ?? derivedScore,
			newScore,
			"Nota salva com sucesso",
			"Erro ao salvar nota",
		);

	const remove = () => {
		if (score == null) return;
		return write(
			"DELETE",
			{},
			null,
			score,
			derivedScore,
			"Nota removida com sucesso",
			"Erro ao remover nota",
		);
	};

	return {
		myScore: effectiveScore,
		isDerived,
		average: avg,
		count: cnt,
		loading,
		submit,
		remove,
	};
}
