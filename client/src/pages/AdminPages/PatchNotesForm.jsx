import axios from "axios";
import { useContext } from "react";
import { useState } from "react";
import { messageContext } from "../../contexts/messageStateProvider";

export default function PatchNotesForm() {
	const [notes, setNotes] = useState("");
	const { addMessage, setMessageType } = useContext(messageContext);
	const handleNotesChange = (e) => {
		const { value } = e.target;
		setNotes(value);
	};
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			let notesList = [];
			if (notes && typeof notes === "string") {
				notesList = notes
					.split("\n")
					.map((line) => line.trim())
					.filter((line) => line !== "");
			}
			const response = await axios.post(
				`${import.meta.env.REACT_APP_HOST_ORIGIN}/admin/add-patch-note`,
				{ updatesList: notesList },
					{
						withCredentials: true,
						headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
					},
			);
			setMessageType("Success");
			addMessage(response.data.msg);
			setNotes("");
			window.scrollTo(0, 0);
		} catch (error) {
			addMessage("Erro ao enviar sugestão.");
		}
	};
	return (
		<form className="settings-group" onSubmit={handleSubmit}>
			<label htmlFor="username" className="input_label">
				<h2 className="settings-group__title" id="patch-notes">
					Enviar patch notes
				</h2>
				<p className="input_obs">
					Obs: Separe usando enter, é possível usar **texto** para negrito e
					[[texto|linkTexto]] para links
				</p>
				<textarea
					className="input"
					name="patchNotes"
					id="patchNotes"
					required
					rows={8}
					value={notes}
					onChange={handleNotesChange}
				/>
			</label>
			<button className="button" type="submit">
				Enviar patch note
			</button>
		</form>
	);
}
