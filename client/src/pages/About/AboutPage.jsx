import { Link } from "react-router-dom";
import "./AboutPage.css";
export default function AboutPage() {
	return (
		<div className="page-content">
			<div className="container">
				<article className="about-page">
					<h1>Sobre o My Manga Shelf</h1>
					<h2>O que é o My Manga Shelf?</h2>
					<p>
						O My Manga Shelf nasceu da necessidade de oferecer uma alternativa
						às complicadas planilhas ou anotações para organizar coleções de
						mangás
					</p>
					<p>
						Embora existam excelentes soluções semelhantes, como MyAnimeList e
						Anilist, nenhuma delas atendia completamente às nossas necessidades.
						Desejávamos uma ferramenta que nos permitisse marcar volumes de
						mangá, reconhecendo todas as diferentes edições de uma obra.
					</p>
					<p>
						Para isso, decidimos criar uma plataforma focada especificamente em
						mangás lançados fisicamente no Brasil.
					</p>
					<p>
						Hoje, disponibilizamos este projeto que foi concebido para resolver
						um problema comum e esperamos que muitas outras pessoas possam
						desfrutar desta ferramenta que desenvolvemos com tanto esforço.
					</p>

					<h2>Recursos Disponíveis na Versão Alpha</h2>
					<p>
						Na nossa emocionante versão alpha, embora nem todas as
						funcionalidades planejadas tenham sido implementadas ainda, você já
						pode:
					</p>
					<ul>
						<li>Criar sua própria conta pessoal</li>
						<li>Adicionar coleções à sua "Prateleira"</li>
						<li>Marcar os volumes que já fazem parte da sua coleção</li>
						<li>Descobrir quais volumes faltam para completar suas coleções</li>
						<li>
							Explorar diferentes obras e obter detalhes interessantes, como
							editora, autoria, tamanho e mais
						</li>
					</ul>
					<p>
						Estamos empolgados em disponibilizar essas funcionalidades para você
						nesta fase inicial. Como é uma versão alpha, pode ser que você
						encontre problemas ou erros pelo caminho. Caso isso aconteça,
						pedimos que nos ajude, detalhando o problema na aba de <Link to={"/feedback"}>feedback</Link>.
						Estaremos dedicados a corrigi-lo o mais rápido possível. E se você
						tiver alguma questão mais específica, entre em contato através da
						nossa página de <Link to={"/contacts"}>Contatos</Link>. Estamos aqui para ajudar!
					</p>
					<h2>Funcionalidades em desenvolvimento</h2>
					<p>
						Decidimos reduzir a quantidade de funcionalidades para lançar a
						versão alpha ao público, mas já estamos trabalhando para implementar
						as seguintes funcionalidades nas próximas versões:
					</p>
					<ul>
						<li>
							Melhorias no sistema de busca. Filtrar por gênero, editora,
							autor(a), etc.
						</li>
						<li>
							Sistema de notificações. Novos volumes, pré-vendas, anúncios, etc.
						</li>
						<li>Adicionar fotos de perfil</li>
						<li>Possibilidade de seguir outros usuários</li>
						<li>Perfis privados</li>
						<li>
							Adição de mangás adultos publicados no Brasil (Restrito para
							usuários logados e com permissão de acesso ao conteúdo)
						</li>
						<li>Sistema de review de volumes e coleções</li>
						<li>Tema escuro (dark theme)</li>
					</ul>
				</article>
			</div>
		</div>
	);
}
