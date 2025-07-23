import {
	faBook,
	faChartLine,
	faCheck,
	faList,
	faMagnifyingGlass,
	faUsers,
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
			{!user && (
				<div className="home">
					<h1>Bem vindo ao Manga Shelf!</h1>
					<p className="home__main-description">
						Chega de planilhas confusas e anotações perdidas! Organize sua
						coleção de mangás de forma simples e eficiente com o Manga Shelf —
						agora em versão beta.
					</p>
					<div className="home__features-container">
						<div className="home__feature">
							<div className="home__icon__container">
								<FontAwesomeIcon className="home__icon" icon={faBook} />
							</div>
							<div>
								<h2 className="feature__title">Geresncie suas coleções:</h2>
								<p className="feature__description">
									Adicione mangás à sua prateleira e mantenha-se atualizado
									sobre o estado de cada série.
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
									Registre os volumes já adquiridos, incluindo edições
									especiais, e saiba exatamente o que está faltando.
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
									Descubra exatamente quais volumes precisa comprar para
									completar suas coleções.
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
						<div className="home__feature">
							<div className="home__icon__container">
								<FontAwesomeIcon
									className="home__icon"
									icon={faChartLine}
								/>
							</div>
							<div>
								<h2 className="feature__title">Veja suas estatísticas:</h2>
								<p className="feature__description">
									Descubra seus gêneros favoritos, a editora com mais volumes na
									sua coleção, quantas obras você já tem e muito mais com as
									estatísticas do seu perfil.
								</p>
							</div>
						</div>
						<div className="home__feature">
							<div className="home__icon__container">
								<FontAwesomeIcon
									className="home__icon"
									icon={faUsers}
								/>
							</div>
							<div>
								<h2 className="feature__title">
									Conecte-se com outros colecionadores:
								</h2>
								<p className="feature__description">
									Siga outros usuários, acompanhe suas coleções e descubra o que
									eles ainda não têm. Assim fica fácil escolher o presente
									perfeito para aquele amigo fã de mangás!
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
				</div>
			)}
			<BrowsePage></BrowsePage>
		</div>
	);
}
