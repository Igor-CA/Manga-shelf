import "./NotFound.css";
import { Link } from "react-router-dom";
export default function NotFound() {
	return (
		<div className="page-content">
			<div className="container">
				<div className="not-found">
					<h1>404</h1>
					<p>Parece que você tentou acessar uma página não existente</p>
					<p>Verifique o endereço do link e tente novamente</p>
					<p>
						Caso o erro persista nos mande detalhes na área de{" "}
						<Link to="/feedback" className="not-found--link">
							feedback
						</Link>{" "}
						e tentaremos resolver o quanto antes
					</p>
					<div className="call-to-action-container">
						<Link to={"/"} className="call-to-action">
							Volte para a pagina principal
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
