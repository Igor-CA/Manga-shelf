import { Link } from "react-router-dom";
import "./AboutPage.css";
export default function AboutPage() {
	return (
		<div className="page-content">
			<div className="container">
				<article className="about-page">
					<h1>Sobre o Manga Shelf</h1>
					<h2>O que é o Manga Shelf?</h2>
					<p>
						O Manga Shelf nasceu da necessidade de uma alternativa
						mais prática e intuitiva para organizar coleções de
						mangás, sem depender de planilhas ou anotações manuais.
					</p>
					<p>
						Embora existam plataformas similares, como MyAnimeList e
						Anilist, nenhuma atendia totalmente às nossas
						necessidades. Queríamos um sistema que permitisse marcar
						volumes individualmente, reconhecendo diferentes edições
						de uma mesma obra.
					</p>
					<p>
						Foi assim que surgiu o Manga Shelf, uma plataforma
						dedicada exclusivamente a mangás lançados{" "}
						<strong>fisicamente</strong> no Brasil. Nosso objetivo é
						oferecer uma solução eficiente para colecionadores e fãs
						do formato.
					</p>
					<p>
						Hoje, disponibilizamos esse projeto com a esperança de
						que seja útil para muitas outras pessoas que
						compartilham dessa paixão.
					</p>

					<h2>Recursos Disponíveis na Versão Beta</h2>
					<p>
						Embora ainda estejamos expandindo o Manga Shelf, a
						versão Beta já conta com diversas funcionalidades:
					</p>
					<ul>
						<li>Criar uma conta pessoal</li>
						<li>Adicionar coleções à sua "Prateleira"</li>
						<li>Marcar os volumes que já possui</li>
						<li>Adicionar obras à uma lista de desejos</li>
						<li>
							Identificar quais volumes ainda faltam para
							completar suas coleções
						</li>
						<li>
							Consultar estatísticas sobre sua coleção, incluindo
							total de volumes, distribuição por gênero e editora
						</li>
						<li>
							Explorar diferentes obras e visualizar detalhes como
							editora, autoria e tamanho
						</li>
						<li>Seguir outros usuários</li>
						<li>
							Receber notificações sobre lançamentos de novos
							volumes
						</li>
					</ul>
					<p>
						Estamos empolgados em disponibilizar essas
						funcionalidades para você nesta fase inicial. Como é uma
						versão Beta, pode ser que você encontre problemas ou
						erros pelo caminho. Caso isso aconteça, pedimos que nos
						ajude, detalhando o problema na aba de{" "}
						<Link to={"/feedback"}>feedback</Link>. Estaremos
						dedicados a corrigi-lo o mais rápido possível. E se você
						tiver alguma questão mais específica, entre em contato
						através da nosso{" "}
						<a href={"mailto:mymangashelfs@gmail.com"}>email</a>.
						Estamos aqui para ajudar!
					</p>
					<h2>Funcionalidades em desenvolvimento</h2>
					<p>
						Para lançar o Manga Shelf mais rapidamente, algumas
						funcionalidades foram adiadas, mas já temos planejadas
						algumas ideias para as próximas atualizações:
					</p>
					<ul>
						<li>Perfis privados</li>
						<li>Sistema de review de volumes e coleções</li>
						<li>
							Postagens: usuários poderão criar publicações e
							interagir entre si
						</li>
						<li>
							Alertas de preços: você será notificado quando um
							volume da sua lista de faltantes atingir um desconto
							específico (ex: 30% de desconto)
						</li>
					</ul>
					<h2>Créditos especiais</h2>
					<p>
						Os dados utilizados no Manga Shelf, como imagens,
						sinopses e gêneros, foram coletados diretamente dos
						sites das editoras ou de fontes confiáveis, como {" "}
						<a
							href="https://blogbbm.com/"
							target="_blank"
							rel="noreferrer"
						>
							Biblioteca Brasileira de Mangas
						</a>
						,{" "}
						<a
							href="http://www.guiadosquadrinhos.com/"
							target="_blank"
							rel="noreferrer"
						>
							Guia dos quadrinhos
						</a>{" "}
						ou{" "}
						<a
							href="https://anilist.co/home"
							target="_blank"
							rel="noreferrer"
						>
							Anilist
						</a>{" "}
					</p>
					<p>
						Se você é o detentor dos direitos autorais de qualquer
						conteúdo exibido neste site e acredita que seu trabalho
						foi usado de maneira que constitui violação de direitos
						autorais, entre em contato conosco em{" "}
						<a href={"mailto:mymangashelfs@gmail.com"}>
							mymangashelfs@gmail.com.
						</a>{" "}
						Estamos dispostos a cooperar para remover ou creditar
						apropriadamente o conteúdo, conforme necessário.
					</p>
				</article>
			</div>
		</div>
	);
}
