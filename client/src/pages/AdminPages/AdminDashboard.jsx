import { useState, useEffect, useContext } from "react";
import axios from "axios";
import SideNavbar from "../../components/navbars/SideNavbar"; // Reusing your layout
import "./AdminDashboard.css";
import "../Settings/Settings.css";
import SubmissionCard from "./SubmissionCard";
import PatchNotesForm from "./PatchNotesForm";

const navbarOptions = [
	{ label: "Submissões Pendentes", id: "pending" },
	{ label: "Enviar Patch notes", id: "patch-notes" },
];

export default function AdminDashboard() {
	const [submissions, setSubmissions] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchSubmissions();
	}, []);

	const fetchSubmissions = async () => {
		try {
			const response = await axios.get(
				`${import.meta.env.REACT_APP_HOST_ORIGIN}/admin/submissions`,
				{
					withCredentials: true,
					headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				},
			);
			setSubmissions(response.data);
			setLoading(false);
		} catch (error) {
			console.error("Erro ao buscar submissões", error);
			setLoading(false);
		}
	};

	const handleProcess = (submissionId) => {
		setSubmissions((prev) => prev.filter((sub) => sub._id !== submissionId));
	};

	return (
		<div className="container page-content settings-page">
			<SideNavbar title="Painel Admin" options={navbarOptions} />
			<div className="settings-container">
				<div className="settings-group">
					<h2 className="settings-group__title" id="pending">
						Fila de Aprovação ({submissions.length})
					</h2>
					<br />

					{loading ? (
						<div className="loading">Carregando fila...</div>
					) : submissions.length === 0 ? (
						<div className="empty-state">
							<p>Nenhuma submissão pendente</p>
						</div>
					) : (
						<div className="cards-list">
							{submissions.map((sub) => (
								<SubmissionCard
									key={sub._id}
									submission={sub}
									onProcess={handleProcess}
								/>
							))}
						</div>
					)}
				</div>
				<PatchNotesForm></PatchNotesForm>
			</div>
		</div>
	);
}
