import { Link } from "react-router-dom";
import "./DonatePage.css";
import { useContext, useState } from "react";
import { FaRegCopy, FaCheck } from "react-icons/fa";
import { messageContext } from "../../contexts/messageStateProvider";
export default function DonatePage() {
	const { addMessage, setMessageType } = useContext(messageContext);

	const PIX_KEY = import.meta.env.REACT_APP_PIX_KEY;

	const QR_CODE_SRC = `${import.meta.env.REACT_APP_HOST_ORIGIN}/images/pix-qrcode.png`;

	const handleCopyPix = () => {
		navigator.clipboard.writeText(PIX_KEY);
		setMessageType("Success");
		addMessage("Pix copiado com sucesso");
	};
	return (
		<div className="page-content">
			<div className="container">
				<article className="donate-page">
					<h1>Apoie o Projeto</h1>
					<h2>Por que você deveria apoiar?</h2>
					<p>
						O MangaShelf é um site totalmente gratuito, sem anúncios ou fontes
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
					<p>
						Por fim, você pode nos ajudar enviando submissões para corrigir ou
						adicionar dados. Nosso objetivo é ter o banco de dados mais completo
						do Brasil. Viu um volume sem sinopse? Adicione a sinopse baseada no
						mangá que você tem em mãos. Encontrou uma obra com autor errado?
						Envie a correção. Isso faz com que as informações expostas no site
						fiquem mais completas para toda a comunidade.
					</p>
					<h3>Benefícios de Sugerir Mudanças e Ideias:</h3>
					<ul>
						<li>
							Contribuir para melhorias que tornarão a experiência de todos os
							usuários mais satisfatória.
						</li>
						<li>Fazer parte do desenvolvimento e evolução do MangaShelf.</li>
						<li>Ter suas sugestões consideradas para futuras atualizações.</li>
					</ul>

					<div className="donation-section">
						<h2>Escolha como doar</h2>

						<div className="donation-options">
							<div className="donation-card paypal-card">
								<h3>PayPal / Cartão</h3>
								<p className="donation-desc" style={{ textIndent: 0 }}>
									Doe com segurança via PayPal.
								</p>
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
										title="PayPal - A maneira fácil e segura de pagar online!"
										alt="Faça doações com o botão do PayPal"
									/>
								</form>
							</div>

							<div className="donation-card pix-card">
								<h3>Pix</h3>
								<p className="donation-desc" style={{ textIndent: 0 }}>
									Escaneie ou copie o código.
								</p>

								<div className="pix-container">
									<img
										src={QR_CODE_SRC}
										alt="QR Code Pix"
										className="pix-qrcode"
									/>

									<button onClick={handleCopyPix} className="copy-btn">
										<FaRegCopy /> Copiar Código Pix
									</button>
								</div>
							</div>
						</div>
					</div>
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
