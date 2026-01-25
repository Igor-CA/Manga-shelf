import { useState, useContext, useEffect } from "react";
import { UserContext } from "../../contexts/userProvider";
import { messageContext } from "../../contexts/messageStateProvider";
import SideNavbar from "../../components/navbars/SideNavbar";
import axios from "axios";
import "../Settings/Settings.css";
import { useNavigate, useParams } from "react-router-dom";
import { getChangedValues } from "../../utils/getChangedValues";

const navbarOptions = [{ label: "Informações Gerais", id: "general" }];

const INITIAL_STATE = {
	serie: {},
	number: 0,
	ISBN: "",
	pagesNumber: 0,
	date: new Date(),
	summary: [],
	defaultPrice: "0",
	freebies: [],
	chapters: "",
};
export default function VolumeSubmissionPage() {
	const { id } = useParams();
	const { user } = useContext(UserContext);
	const navigate = useNavigate();
	const { addMessage, setMessageType } = useContext(messageContext);

	const [formData, setFormData] = useState(INITIAL_STATE);
	const [loading, setLoading] = useState(true);
	const [notes, setNotes] = useState("");
	const [initialData, setInitialData] = useState(null);

	const formatDateForInput = (isoDate) => {
		if (!isoDate) return "";
		return isoDate.split("T")[0];
	};

	useEffect(() => {
		const fetchSeriesData = async () => {
			setLoading(true);
			try {
				const response = await axios.get(
					`${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/volume/${id}`,
					{
						withCredentials: true,
						headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
					},
				);
				const dbData = response.data;
				const processedData = {
					...dbData,
					summary: dbData.summary ? dbData.summary.join("\n") : "",
					freebies: dbData.freebies ? dbData.freebies.join(", ") : "",
					date: formatDateForInput(dbData.date),
				};
				setFormData(processedData);
				setInitialData(processedData);
			} catch (error) {
				addMessage("Erro ao carregar dados da obra.");
			} finally {
				setLoading(false);
			}
		};

		if (id) fetchSeriesData();
	}, [id]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleNotesChange = (e) => {
		const { value } = e.target;
		setNotes(value);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const rawPayload = getChangedValues(formData, initialData);

		if (!rawPayload || Object.keys(rawPayload).length === 0) {
			addMessage("Nenhuma alteração foi realizada.");
			return;
		}
		const payload = { ...rawPayload };

		if (payload.summary && typeof payload.summary === "string") {
			payload.summary = payload.summary
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line !== "");
		}

		if (payload.freebies && typeof payload.freebies === "string") {
			payload.freebies = payload.freebies
				.split(",")
				.map((a) => a.trim())
				.filter((a) => a !== "");
		}

		try {
			await axios.post(
				`${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/submission`,
				{
					targetModel: "Volume",
					targetId: id,
					payload: payload,
					user: user._id,
					notes: notes,
				},
				{ withCredentials: true },
			);
			setMessageType("Success");
			addMessage("Sugestão enviada para aprovação!");
			navigate(`/volume/${id}`);
		} catch (error) {
			addMessage("Erro ao enviar sugestão.");
		}
	};
	const handleInvalid = (e) => {
		e.preventDefault();
		const input = e.target;

		let customErrorMessage = "";

		if (input.validity.valueMissing) {
			customErrorMessage = `O campo de "Notas e fontes" é obrigatório`;
		}

		addMessage(customErrorMessage);
	};

	return (
		<div className="container page-content settings-page">
			<SideNavbar title={"Editar obra"} options={navbarOptions} />
			{!loading ? (
				<form className="settings-container" onSubmit={handleSubmit}>
					<SourceSection
						notes={notes}
						onInvalid={handleInvalid}
						onChange={handleNotesChange}
					/>
					<GeneralInfoSection data={formData} onChange={handleChange} />

					<button className="button" type="submit">
						Enviar Submissão
					</button>
				</form>
			) : (
				<div className="settings-container">
					<div
						className="settings-group"
						style={{
							minHeight: "60vh",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "2rem",
						}}
					>
						<strong>Carregando informações</strong>
					</div>
				</div>
			)}
		</div>
	);
}

function SourceSection({ notes, onChange, onInvalid }) {
	return (
		<div className="settings-group">
			<label htmlFor="username" className="input_label">
				<p> Notas e fontes da submissão</p>
				<p className="input_obs">
					Obs: Ao preencher ou editar algum dos campos abaixo pedimos para que
					insira de onde tirou essa informação. Pode ser por meio do site da
					editora, sites como My Anime List ou guia dos quadrinhos, links de
					lojas ou até mesmo por meio de uma foto no instagram mostrando o mangá
					com a devida informação. Apenas precisamos de uma fonte para validar e
					aprovar a informação
				</p>
				<textarea
					className="input"
					name="srcNotes"
					id="srcNotes"
					required
					rows={8}
					value={notes}
					onInvalid={onInvalid}
					onChange={onChange}
				/>
			</label>
		</div>
	);
}

function GeneralInfoSection({ data, onChange }) {
	return (
		<div className="settings-group">
			<h2 className="settings-group__title" id="general">
				Informações Gerais
			</h2>
			<div className="input_label">Obra: {data.serie.title}</div>
			<div className="input_label">Volume: {data.number}</div>

			<label className="input_label">
				Sinopse (separe parágrafos com Enter)
				<textarea
					className="input"
					name="summary"
					id="summary"
					rows={8}
					value={data.summary}
					onChange={onChange}
				/>
			</label>
			<label className="input_label">
				Número de páginas
				<input
					type="number"
					name="pagesNumber"
					className="input"
					value={data.pagesNumber}
					onChange={onChange}
				/>
			</label>
			<label className="input_label">
				Data de Publicação
				<input
					type="date"
					name="date"
					className="input"
					value={data.date || ""}
					onChange={onChange}
				/>
			</label>
			<label className="input_label">
				ISBN
				<input
					className="input"
					name="ISBN"
					value={data.ISBN}
					placeholder="XXXXXXXXXXXXX"
					onChange={onChange}
				/>
			</label>
			<label className="input_label">
				Preço de capa
				<input
					type="number"
					className="input"
					value={parseFloat(data.defaultPrice || 0)}
					step="0.01"
					name="defaultPrice"
					onChange={onChange}
				/>
			</label>
			<label className="input_label">
				Brindes (separe por vírgula)
				<input
					className="input"
					name="freebies"
					placeholder="Ex: Marca página, cartão postal, pôster"
					value={data.freebies}
					onChange={onChange}
				/>
			</label>
			<label className="input_label">
				Capítulos
				<p className="input_obs">
					Obs: Coloque no formato: Capítulo inicial - Capitulo Final. <br />
					Ex: 1 - 8, 52 - 57, 30 - 35 + extras
				</p>
				<input
					className="input"
					name="chapters"
					placeholder="Ex:1 - 8, 52 - 57, 30 - 35 + extras"
					value={data.chapters}
					onChange={onChange}
				/>
			</label>
		</div>
	);
}
