import { Link } from "react-router-dom";
import "./DonatePage.css"
export default function DonatePage() {
	return (
		<div className="page-content">
			<div className="container">
				<article className="donate-page">
					<h1>Apoie o Projeto</h1>
					<h2>Por que você deveria apoiar?</h2>
					<p>
						O MyMangaShelf é um site totalmente gratuito, sem anúncios ou fontes
						de renda. Se você gosta do site e deseja mantê-lo vivo, pode apoiar
						com uma doação de qualquer quantia. Seu apoio será usado para manter
						o site no ar e cobrir os custos de desenvolvimento.
					</p>
					<p>
						Este projeto é independente e desenvolvido durante meu tempo livre.
						Continuarei atualizando e adicionando novas funcionalidades sempre
						que possível. Sua ajuda não só permite que o projeto continue, mas
						também me motiva a trabalhar mais para aperfeiçoá-lo e criar novas
						funcionalidades.
					</p>
					<h2>Outras Formas de Apoiar</h2>
					<p>
						Se não puder apoiar financeiramente, você pode ajudar divulgando
						nosso site para amigos e conhecidos. Sua divulgação já é de grande
						ajuda.
					</p>
					<p>
						Se não tiver a quem divulgar, também pode nos apoiar ajudando a
						melhorar nosso sistema. Na página de{" "}
						<Link to="/feedback">feedback</Link> você pode não apenas relatar
						problemas ou erros encontrados (bugs, dados incorretos em algum
						volume/coleção, etc.), mas também sugerir mudanças ou ideias (por
						exemplo, estatísticas sobre sua coleção, separação da coleção por
						status, melhorias no design, etc.). Embora não possamos garantir que
						implementaremos todas as ideias, faremos o possível para corrigir
						problemas e incorporar novas ideias ao longo do tempo.
					</p>
					<h3>Benefícios de Sugerir Mudanças e Ideias:</h3>
					<ul>
						<li>
							Contribuir para melhorias que tornarão a experiência de todos os
							usuários mais satisfatória.
						</li>
						<li>Fazer parte do desenvolvimento e evolução do MyMangaShelf.</li>
						<li>Ter suas sugestões consideradas para futuras atualizações.</li>
					</ul>
					<form
						action="https://www.paypal.com/donate"
						method="post"
						target="_blank"
                        className="donate-page__donation-button"
					>
						<input type="hidden" name="business" value="DQ53DQZDPMF7U" />
						<input type="hidden" name="no_recurring" value="0" />
						<input
							type="hidden"
							name="item_name"
							value="O dinheiro doado aqui vai ser utilizado para manter o site MyMangaShelf no ar e arcar com a desenvolimento do mesmo"
						/>
						<input type="hidden" name="currency_code" value="BRL" />
						<input
							type="image"
							src="https://www.paypalobjects.com/pt_BR/BR/i/btn/btn_donateCC_LG.gif"
							border="0"
							name="submit"
							title="PayPal - The safer, easier way to pay online!"
							alt="Faça doações com o botão do PayPal"
						/>
						<img
							alt=""
							border="0"
							src="https://www.paypal.com/pt_BR/i/scr/pixel.gif"
							width="1"
							height="1"
						/>
					</form>

					<p>
						Agradecemos profundamente o seu apoio, seja por meio de doações,
						compartilhamento ou feedback. Obrigado por fazer parte da
						comunidade.
					</p>
				</article>
			</div>
		</div>
	);
}
