import { IoIosClose } from "react-icons/io";
import { useContext, useRef } from "react";
import axios from "axios";
import ImageCropper from "./ImageCropper";
import "./ImageModal.css";
import { messageContext } from "./messageStateProvider";
import { UserContext } from "../contexts/userProvider";

function dataURLtoFile(dataurl, filename) {
	const dataArray = dataurl.split(",");
	const mime = dataArray[0].match(/:(.*?);/)[1];
	const bitString = atob(dataArray[dataArray.length - 1]);
	let stringSize = bitString.length;
	const u8dataArray = new Uint8Array(stringSize);
	while (stringSize--) {
		u8dataArray[stringSize] = bitString.charCodeAt(stringSize);
	}
	return new File([u8dataArray], filename, { type: mime });
}

export default function ImageModal({ closeModal, apiUrl, aspectRatio=1 }) {
	const avatarUrl = useRef("");
	const { user } = useContext(UserContext);
	const { addMessage, setMessageType } = useContext(messageContext);
	const uploadImage = async () => {
		try {
			const formData = new FormData();
			const image = dataURLtoFile(avatarUrl.current, "imageFile.webp");
			formData.append("file", image);
			await axios({
				method: "PUT",
				withCredentials: true,
				url: apiUrl,
				data: formData,
				headers: {
					"Content-Type": "multipart/form-data",
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
			});
			addMessage("Sua foto de perfil foi alterada com sucesso");
			setMessageType("Success");
			window.location.href = `/user/${user.username}`;
		} catch (error) {
			const customErrorMessage = error.response.data.msg;
			addMessage(customErrorMessage);
		}
	};

	const updateAvatar = (imgSrc) => {
		avatarUrl.current = imgSrc;
		uploadImage();
	};
	return (
		<div className="modal__page">
			<div className="modal__background"></div>
			<div className="modal__center">
				<div className="modal__container">
					<div className="modal__content">
						<button
							type="button"
							className="modal__button"
							onClick={closeModal}
						>
							<span className="sr-only">Fechar aba</span>
							<IoIosClose />
						</button>
						<ImageCropper updateAvatar={updateAvatar} closeModal={closeModal} aspectRatio={aspectRatio} />
					</div>
				</div>
			</div>
		</div>
	);
}
