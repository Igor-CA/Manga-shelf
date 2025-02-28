import {
	faBook,
	faCheck,
	faList,
	faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import "./Home.css";
import BrowsePage from "../BrowsePage/BrowsePage";
import { useContext } from "react";
import { UserContext } from "../../components/userProvider";

export default function Home() {
	const { user } = useContext(UserContext);
	return (
		<div className="page-content">
			{!user && <div className="home">
				<h1>Bem vindo ao Manga Shelf!</h1>
				<p className="home__main-description">
					Chega de anotações perdidas e planilhas chatas! Descubra uma maneira
					prática e divertida de gerenciar sua coleção de mangás na versão alpha
					do Manga Shelf.
				</p>
				<div className="home__features-container">
					<div className="home__feature">
						<div className="home__icon__container">
							<FontAwesomeIcon className="home__icon" icon={faBook} />
						</div>
						<div>
							<h2 className="feature__title">Acompanhe coleções:</h2>
							<p className="feature__description">
								Adicione mangás à sua prateleira e mantenha-se atualizado sobre
								o estado de cada série.
							</p>
						</div>
					</div>
					<div className="home__feature">
						<div className="home__icon__container">
							<FontAwesomeIcon className="home__icon" icon={faCheck} />
						</div>
						<div>
							<h2 className="feature__title">Marque seus volumes:</h2>
							<p className="feature__description">
								Mantenha o controle sobre os volumes que você já possui. Marque
								os volumes que estão em suas mãos, acompanhe edições especiais e
								saiba instantaneamente quais estão faltando
							</p>
						</div>
					</div>
					<div className="home__feature">
						<div className="home__icon__container">
							<FontAwesomeIcon className="home__icon" icon={faList} />
						</div>
						<div>
							<h2 className="feature__title">Veja o que te falta:</h2>
							<p className="feature__description">
								Descubra exatamente quais volumes precisa comprar para completar
								suas coleções.
							</p>
						</div>
					</div>
					<div className="home__feature">
						<div className="home__icon__container">
							<FontAwesomeIcon
								className="home__icon"
								icon={faMagnifyingGlass}
							/>
						</div>
						<div>
							<h2 className="feature__title">Explore novos titulos:</h2>
							<p className="feature__description">
								Encontre diferentes obras e obtenha detalhes como autores,
								editora, formato, sinopse e mais de cada coleção/volume.
							</p>
						</div>
					</div>
				</div>
				<div className="call-to-action-container">
					<Link to={"/signup"} className="call-to-action">
						Junte-se agora
					</Link>
					<Link to={"/about"} className="call-to-action">
						Saiba mais
					</Link>
				</div>
			</div>}
			<BrowsePage></BrowsePage>
		</div>
	);
}
