import { useState, useContext, useEffect } from "react";
import { UserContext } from "../../contexts/userProvider";
import { messageContext } from "../../contexts/messageStateProvider";
import SideNavbar from "../../components/navbars/SideNavbar";
import axios from "axios";
import "../Settings/Settings.css";
import { useNavigate, useParams } from "react-router-dom";
import { useFilterHandler } from "../../utils/useFiltersHandler";
import { getChangedValues } from "../../utils/getChangedValues";

const navbarOptions = [
	{ label: "Informações Gerais", id: "general" },
	{ label: "Especificações Físicas", id: "specs" },
	{ label: "Publicação Original", id: "original-run" },
];

const INITIAL_STATE = {
	title: "",
	synonyms: [],
	authors: [],
	summary: [],
	publisher: "",
	demographic: "Shounen",
	type: "manga",
	status: "",
	dates: { publishedAt: "", finishedAt: "" },
	specs: {
		format: "",
		paper: "",
		cover: "",
		volumesInFormat: 1,
		dimensions: { width: 0, height: 0 },
	},
	originalRun: {
		publisher: "",
		country: "",
		totalVolumes: 0,
		totalChapters: 0,
	},
};
export default function SeriesSubmissionPage() {
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

	const fetchFiltersUrl = `${
		import.meta.env.REACT_APP_HOST_ORIGIN
	}/api/data/series/filters`;
	const { publishersList, typesList, countryList } =
		useFilterHandler(fetchFiltersUrl);

	useEffect(() => {
		const fetchSeriesData = async () => {
			setLoading(true);
			try {
				const response = await axios.get(
					`${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/series/${id}`,
					{
						withCredentials: true,
						headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
					},
				);
				const dbData = response.data;
				const processedData = {
					...dbData,
					summary: dbData.summary ? dbData.summary.join("\n") : "",
					authors: dbData.authors ? dbData.authors.join(", ") : "",
					specs: {
						format: dbData.specs?.format || "",
						paper: dbData.specs?.paper || "",
						cover: dbData.specs?.cover || "",
						volumesInFormat: dbData.specs?.volumesInFormat || "",

						dimensions: {
							width: dbData.specs?.dimensions?.width || 0,
							height: dbData.specs?.dimensions?.height || 0,
						},
					},

					originalRun: {
						publisher: dbData.originalRun?.publisher || "",
						country: dbData.originalRun?.country || "",
						totalVolumes: dbData.originalRun?.totalVolumes || 0,
						totalChapters: dbData.originalRun?.totalChapters || 0,
					},

					dates: {
						publishedAt: formatDateForInput(dbData.dates?.publishedAt),
						finishedAt: formatDateForInput(dbData.dates?.finishedAt),
					},
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

	const handleNestedChange = (section, field, value) => {
		setFormData((prev) => ({
			...prev,
			[section]: {
				...prev[section],
				[field]: value,
			},
		}));
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

		if (payload.authors && typeof payload.authors === "string") {
			payload.authors = payload.authors
				.split(",")
				.map((a) => a.trim())
				.filter((a) => a !== "");
		}

		try {
			await axios.post(
				`${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/submission`,
				{
					targetModel: "Series",
					targetId: id, 
					payload: payload, 
					user: user._id,
					notes: notes,
				},
				{ withCredentials: true },
			);
			setMessageType("Success");
			addMessage("Sugestão enviada para aprovação!");
            navigate(`/series/${id}`)
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
					<GeneralInfoSection
						data={formData}
						onChange={handleChange}
						typesList={typesList}
						publishersList={publishersList}
					/>

					<SpecsSection
						data={formData.specs}
						onNestedChange={(field, val) =>
							handleNestedChange("specs", field, val)
						}
					/>

					<OriginalRunSection
						data={formData.originalRun}
						onNestedChange={(field, val) =>
							handleNestedChange("originalRun", field, val)
						}
						countryList={countryList}
					/>

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

function GeneralInfoSection({ data, onChange, typesList, publishersList }) {
	return (
		<div className="settings-group">
			<h2 className="settings-group__title" id="general">
				Informações Gerais
			</h2>

			<label className="input_label">
				Título
				<input
					className="input"
					name="title"
					value={data.title}
					onChange={onChange}
				/>
			</label>

			<label className="input_label">
				Autores (separe por vírgula)
				<input
					className="input"
					name="authors"
					placeholder="Ex: Akira Toriyama, Eiichiro Oda"
					value={data.authors}
					onChange={onChange}
				/>
			</label>

			<label htmlFor="publisher" className="filter__label">
				Editora (Brasil)
				<select
					name="publisher"
					id="publisher"
					className="input"
					onChange={onChange}
					value={data.publisher || ""}
				>
					{publishersList?.map((publisher, id) => (
						<option value={publisher} key={id}>
							{publisher}
						</option>
					))}
				</select>
			</label>
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

			<div style={{ display: "flex", gap: "1rem" }}>
				<label className="input_label" style={{ flex: 1 }}>
					Demografia
					<select
						className="input"
						name="demographic"
						value={data.demographic}
						onChange={onChange}
					>
						<option value={"Shounen"}>Shounen</option>
						<option value={"Shoujo"}>Shoujo</option>
						<option value={"Seinen"}>Seinen</option>
						<option value={"Josei"}>Josei</option>
						<option value={"Kodomo"}>Kodomo (Infantil)</option>
					</select>
				</label>

				<label className="input_label" style={{ flex: 1 }}>
					Tipo
					<select
						className="input"
						name="type"
						value={data.type}
						onChange={onChange}
					>
						{typesList?.map((type, id) => (
							<option value={type} key={id}>
								{type}
							</option>
						))}
					</select>
				</label>
			</div>
		</div>
	);
}

function SpecsSection({ data, onNestedChange }) {
	return (
		<div className="settings-group">
			<h2 className="settings-group__title" id="specs">
				Especificações Físicas
			</h2>

			<label className="input_label">
				Formato
				<input
					className="input"
					name="format"
					placeholder="Ex: Tankobon, Kazenban, Tanko, Meio tanko, 2 em 1, 3 em 1, edição de luxo etc"
					value={data.format}
					onChange={(e) => onNestedChange("format", e.target.value)}
				/>
			</label>

			<label className="input_label">
				Tipo de Papel
				<input
					className="input"
					name="paper"
					placeholder="Ex: Pólen Soft, Offset"
					value={data.paper}
					onChange={(e) => onNestedChange("paper", e.target.value)}
				/>
			</label>
			<label className="input_label">
				Tipo de capa
				<input
					className="input"
					name="cover"
					placeholder="Ex: Capa dura, Capa cartão, Capa cartão com orelhas, Capa cartão com sobrecapa"
					value={data.cover}
					onChange={(e) => onNestedChange("cover", e.target.value)}
				/>
			</label>
			<label className="input_label">
				Volumes por exemplar
				<input
					type="number"
					name="volumesInFormat"
					className="input"
					placeholder="Ex: Obras 2 em 1 = 2, obras 3 em 1 = 3, algumas obras são 1.5 em 1..."
					value={data.volumesInFormat}
					onChange={(e) => onNestedChange("volumesInFormat", e.target.value)}
				/>
			</label>

			<div style={{ display: "flex", gap: "1rem" }}>
				<label className="input_label">
					Largura (cm)
					<input
						type="number"
						className="input"
						value={data.dimensions?.width}
						step="0.1"
						name="width"
						onChange={(e) =>
							onNestedChange("dimensions", {
								...data.dimensions,
								width: e.target.value,
							})
						}
					/>
				</label>
				<label className="input_label">
					Altura (cm)
					<input
						type="number"
						className="input"
						value={data.dimensions?.height}
						step="0.1"
						name="height"
						onChange={(e) =>
							onNestedChange("dimensions", {
								...data.dimensions,
								height: e.target.value,
							})
						}
					/>
				</label>
			</div>
		</div>
	);
}

function OriginalRunSection({ data, onNestedChange, countryList }) {
	return (
		<div className="settings-group">
			<h2 className="settings-group__title" id="original-run">
				Publicação Original
			</h2>

			<label className="input_label">
				Editora Original (Japão/Coréia)
				<input
					className="input"
					name="originalPublisher"
					value={data.publisher}
					onChange={(e) => onNestedChange("publisher", e.target.value)}
				/>
			</label>

			<label className="input_label" style={{ flex: 1 }}>
				País de Origem
				<select
					className="input"
					name="country"
					value={data.country}
					onChange={(e) => onNestedChange("country", e.target.value)}
				>
					{countryList?.map((country, id) => (
						<option value={country} key={id}>
							{country}
						</option>
					))}
				</select>
			</label>

			<label className="input_label">
				Total de Volumes (Original)
				<input
					type="number"
					name="totalVolumes"
					className="input"
					value={data.totalVolumes}
					onChange={(e) => onNestedChange("totalVolumes", e.target.value)}
				/>
			</label>
			<label className="input_label">
				Total de capítulos (Original)
				<input
					type="number"
					name="totalChapters"
					className="input"
					value={data.totalChapters}
					onChange={(e) => onNestedChange("totalChapters", e.target.value)}
				/>
			</label>
		</div>
	);
}
