import { Link } from "react-router-dom";
import "./AdultPageRedirect.css";
export default function AdultPageRedirect() {
	return (
		<div className="page-content">
			<div className="container">
				<div className="adult-block">
					<h1>Conteúdo + 18</h1>
					<p>
						Parece que você tentou acessar uma página com conteúdo adulto mesmo
						não tendo permissão para isso
					</p>
					<p>
						Para acessar esse tipo de conteúdo primeiramente você deve estar
						logando e então deve permitir conteúdos +18 na página de {" "}
						<Link to="/settings" className="adult-block--link">
						Configurações	
						</Link>{" "}
					</p>
					<p>
						Caso o erro persista nos mande detalhes na área de{" "}
						<Link to="/feedback" className="adult-block--link">
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
