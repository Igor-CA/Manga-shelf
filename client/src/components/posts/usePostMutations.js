import { useContext } from "react";
import { messageContext } from "../../contexts/messageStateProvider";
import editPostRequest from "./editPostRequest";
import deletePostRequest from "./deletePostRequest";

export default function usePostMutations({ seriesId, volumeId, getPost, patchPost }) {
	const { addMessage, setMessageType } = useContext(messageContext);

	const editPost = async (postId, patch) => {
		const target = getPost(postId);
		if (!target) return false;

		const effectiveSeriesId = seriesId ?? target.context?.seriesId;
		const effectiveVolumeId = volumeId ?? target.context?.volumeId;

		const hadImage = !!target.image;
		const isNewFile = patch.image instanceof File;
		const removeImage = !isNewFile && patch.image === null && hadImage;
		const optimisticImage = isNewFile
			? URL.createObjectURL(patch.image)
			: removeImage
				? null
				: target.image;

		patchPost(postId, {
			text: patch.text,
			isSpoiler: patch.isSpoiler,
			isAdultContent: patch.isAdultContent,
			image: optimisticImage,
			editedAt: new Date().toISOString(),
		});

		try {
			const res = await editPostRequest({
				postId,
				seriesId: effectiveSeriesId,
				volumeId: effectiveVolumeId,
				text: patch.text,
				isSpoiler: patch.isSpoiler,
				isAdultContent: patch.isAdultContent,
				image: isNewFile ? patch.image : null,
				removeImage,
			});
			if (isNewFile && optimisticImage) URL.revokeObjectURL(optimisticImage);
			patchPost(postId, {
				text: res.data.post.text,
				image: res.data.post.image,
				isSpoiler: res.data.post.isSpoiler,
				isAdultContent: res.data.post.isAdultContent,
				editedAt: res.data.post.editedAt,
			});
			setMessageType("Success");
			addMessage("Alterações salvas");
			return true;
		} catch (err) {
			if (isNewFile && optimisticImage) URL.revokeObjectURL(optimisticImage);
			patchPost(postId, target);
			addMessage(err.response?.data?.msg || "Erro ao salvar alterações");
			return false;
		}
	};

	const deletePost = async (
		postId,
		{
			applyRemoval,
			successText = "Comentário removido",
			errorText = "Erro ao remover comentário",
		} = {},
	) => {
		const rollback = applyRemoval ? applyRemoval() : null;
		try {
			await deletePostRequest(postId);
			setMessageType("Success");
			addMessage(successText);
			return true;
		} catch (err) {
			if (rollback) rollback();
			addMessage(err.response?.data?.msg || errorText);
			return false;
		}
	};

	return { editPost, deletePost };
}
