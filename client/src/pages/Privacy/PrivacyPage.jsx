import { Link } from "react-router-dom";
import "./PrivacyPage.css";
import usePageMeta from "../../utils/usePageMeta";

export default function PrivacyPage() {
	usePageMeta(
		"Política de Privacidade",
		"Saiba quais dados o MangaShelf coleta, como eles são usados e armazenados, e quais são os seus direitos sobre essas informações.",
	);
	return (
		<div className="page-content">
			<div className="container">
				<section className="privacy">
					<h1>Política de Privacidade</h1>
					<p className="privacy__updated">
						Última atualização: 24 de julho de 2026
					</p>
					<p>
						Esta Política de Privacidade explica como o Manga Shelf coleta,
						utiliza, armazena, compartilha e protege as suas informações quando
						você usa o nosso site, e quais são os seus direitos em relação a
						esses dados. Ela foi elaborada com base na Lei Geral de Proteção de
						Dados (Lei nº 13.709/2018, a LGPD), já que o Manga Shelf é voltado ao
						público brasileiro. Ao criar uma conta ou utilizar o site, você
						declara estar ciente das práticas descritas aqui. Coletamos apenas os
						dados necessários para o funcionamento do serviço.
					</p>

					<h2>1. Escopo</h2>
					<p>
						Esta política se aplica ao site Manga Shelf e aos serviços oferecidos
						por ele. Ela não se aplica a sites, serviços ou aplicativos de
						terceiros que possam estar acessíveis por meio de links no nosso site
						(como páginas de editoras, redes sociais, Anilist, PayPal, entre
						outros). Cada um desses serviços possui a sua própria política de
						privacidade, pela qual não somos responsáveis, e recomendamos que
						você a consulte.
					</p>

					<h2>2. Quem é o responsável pelos seus dados</h2>
					<p>
						O Manga Shelf é um projeto independente, mantido sem fins lucrativos
						durante o tempo livre de seu criador. Para os fins da LGPD, o
						responsável pelo tratamento dos dados (controlador) pode ser
						contatado pelo email{" "}
						<a href={"mailto:mymangashelfs@gmail.com"}>
							mymangashelfs@gmail.com
						</a>
						, inclusive para o exercício dos seus direitos ou para questões
						relativas à proteção de dados. Esse mesmo canal funciona como ponto de
						contato para assuntos de
						privacidade.
					</p>

					<h2>3. Dados que coletamos</h2>
					<p>
						Coletamos apenas os dados necessários para oferecer as
						funcionalidades do site, organizados nas seguintes categorias:
					</p>
					<h3>3.1. Dados que você nos fornece</h3>
					<ul>
						<li>
							<strong>Dados de conta:</strong> nome de usuário, endereço de email
							e senha. As senhas são armazenadas de forma criptografada (hash) e
							nunca em texto puro.
						</li>
						<li>
							<strong>Dados da sua coleção:</strong> as obras e volumes que você
							adiciona à sua prateleira e lista de desejos, o estado de leitura,
							anotações pessoais, preços de compra, datas de aquisição e demais
							informações que você registra.
						</li>
						<li>
							<strong>Conteúdo publicado por você:</strong> avaliações (notas),
							reviews, comentários, respostas, fotos da sua coleção, submissões de
							correção ao catálogo e denúncias que você envia.
						</li>
						<li>
							<strong>Imagens:</strong> foto de perfil, banner, fotos da coleção,
							imagens anexadas a comentários e imagens enviadas como evidência em
							submissões.
						</li>
						<li>
							<strong>Preferências e configurações:</strong> suas preferências de
							notificação, se você optou por visualizar conteúdo adulto (+18) e a
							data em que aceitou os Termos de Serviço e esta política.
						</li>
					</ul>
					<h3>3.2. Dados coletados automaticamente</h3>
					<ul>
						<li>
							<strong>Cookies de sessão:</strong> usados para manter você
							autenticado enquanto navega (veja a seção sobre Cookies).
						</li>
						<li>
							<strong>Dados técnicos e de acesso:</strong> como endereço IP, tipo
							de navegador e registros de acesso (logs). Esses dados são
							utilizados para manter a segurança e a estabilidade do serviço,
							diagnosticar erros e prevenir abusos, spam e fraudes.
						</li>
					</ul>
					<h3>3.3. Dados recebidos de terceiros</h3>
					<ul>
						<li>
							<strong>Login com o Google:</strong> caso opte por entrar com sua
							conta Google, recebemos seu nome e endereço de email através do
							serviço de autenticação do Google, apenas para identificar e criar
							a sua conta.
						</li>
					</ul>

					<h2>4. Base legal para o tratamento</h2>
					<p>
						Nos termos da LGPD, tratamos os seus dados com fundamento nas
						seguintes bases legais:
					</p>
					<ul>
						<li>
							<strong>Execução de contrato:</strong> para criar e manter a sua
							conta e oferecer as funcionalidades que você solicita ao usar o
							site;
						</li>
						<li>
							<strong>Consentimento:</strong> quando você opta por funcionalidades
							específicas, como visualizar conteúdo adulto (+18) ou receber
							determinadas notificações;
						</li>
						<li>
							<strong>Legítimo interesse:</strong> para manter a segurança do
							site, prevenir abusos e fraudes, moderar conteúdo e melhorar o
							serviço, sempre respeitando os seus direitos e expectativas;
						</li>
						<li>
							<strong>Cumprimento de obrigação legal:</strong> quando precisarmos
							tratar ou conservar dados para cumprir a lei ou atender a
							autoridades competentes.
						</li>
					</ul>

					<h2>5. Como usamos os seus dados</h2>
					<p>Utilizamos os dados coletados para:</p>
					<ul>
						<li>Criar e manter a sua conta e a sua coleção pessoal;</li>
						<li>
							Exibir as funcionalidades do site, como estatísticas, volumes
							faltantes e obras relacionadas;
						</li>
						<li>
							Permitir a interação entre usuários, como seguir perfis, comentar,
							avaliar e publicar reviews;
						</li>
						<li>
							Enviar notificações sobre lançamentos, atividade social e avisos do
							site, de acordo com as suas preferências;
						</li>
						<li>
							Enviar emails essenciais, como redefinição de senha e comunicados
							importantes;
						</li>
						<li>
							Moderar conteúdo, aplicar os Termos de Serviço e manter um ambiente
							seguro;
						</li>
						<li>
							Manter a segurança, prevenir abusos e fraudes e garantir a
							estabilidade do site;
						</li>
						<li>
							Melhorar o site, corrigir erros e desenvolver novas
							funcionalidades.
						</li>
					</ul>
					<p>
						<strong>
							Não vendemos os seus dados pessoais nem os utilizamos para
							publicidade de terceiros.
						</strong>
					</p>

					<h2>6. Conteúdo público</h2>
					<p>
						Parte das informações que você registra é <strong>pública</strong> por
						natureza dentro do site. Seu nome de usuário, sua coleção, suas
						avaliações, reviews, comentários e fotos de coleção marcadas como
						visíveis podem ser vistos por outros usuários e por visitantes não
						cadastrados. Seu endereço de email, sua senha e suas configurações
						pessoais nunca são exibidos publicamente. Tenha atenção ao publicar
						informações que não deseja tornar públicas.
					</p>

					<h2>7. Cookies e tecnologias semelhantes</h2>
					<p>
						Utilizamos um cookie de sessão essencial para manter você autenticado
						enquanto navega. Esse cookie é necessário para o funcionamento do
						login e não é usado para rastreamento publicitário nem para criar
						perfis de comportamento. Também podemos utilizar serviços de proteção
						contra abuso (como o reCAPTCHA do Google) em formulários de cadastro e
						envio, que podem definir cookies próprios conforme as políticas do
						Google. Você pode gerenciar ou bloquear cookies nas configurações do
						seu navegador, mas isso pode impedir o funcionamento do login e de
						outras funcionalidades.
					</p>

					<h2>8. Compartilhamento e divulgação</h2>
					<p>
						Não compartilhamos os seus dados pessoais com terceiros, exceto nas
						situações abaixo:
					</p>
					<ul>
						<li>
							<strong>Prestadores de serviço</strong> necessários para o
							funcionamento do site, como o <strong>Google</strong> (login e
							reCAPTCHA), o <strong>PayPal</strong> (caso você opte por fazer uma
							doação; nesse caso, o pagamento é processado inteiramente na
							plataforma do PayPal e não recebemos os dados do seu cartão) e o
							nosso{" "}
							<strong>provedor de email</strong> (para envio das mensagens do
							site);
						</li>
						<li>
							<strong>Cumprimento de obrigações legais</strong> ou atendimento a
							solicitações de autoridades competentes, quando exigido por lei;
						</li>
						<li>
							<strong>Proteção de direitos</strong>, para prevenir fraudes, abusos
							ou atividades ilegais e proteger a segurança dos usuários e do site.
						</li>
					</ul>
					<p>
						Cada prestador de serviço trata os dados de acordo com a sua própria
						política de privacidade.
					</p>

					<h2>9. Transferência internacional de dados</h2>
					<p>
						Alguns dos prestadores de serviço que utilizamos (como Google e
						PayPal) podem processar e armazenar dados em servidores localizados
						fora do Brasil. Nesses casos, os dados podem estar sujeitos às leis do
						país onde são processados. Ao utilizar o site, você está ciente de que
						esses serviços podem realizar esse tratamento conforme as suas
						próprias políticas.
					</p>

					<h2>10. Armazenamento e segurança</h2>
					<p>
						Adotamos medidas técnicas e organizacionais razoáveis para proteger os
						seus dados, incluindo o armazenamento de senhas de forma criptografada
						e a realização de backups periódicos do banco de dados. No entanto,
						nenhum sistema é completamente seguro. Embora nos esforcemos para
						proteger as suas informações, não podemos garantir segurança absoluta
						contra acesso não autorizado, perda ou uso indevido.
					</p>

					<h2>11. Retenção e exclusão de dados</h2>
					<p>
						Mantemos os seus dados enquanto a sua conta estiver ativa. Você pode
						solicitar a exclusão da sua conta e dos seus dados pessoais a qualquer
						momento entrando em contato pelo email indicado nesta política.
						Observe que alguns registros podem ser mantidos mesmo após a exclusão
						de um conteúdo ou de uma conta, quando isso for necessário para
						cumprir obrigações legais, resolver disputas ou fazer cumprir os
						nossos termos. Por exemplo, registros de denúncias e de ações de
						moderação são preservados como parte do histórico de segurança da
						plataforma.
					</p>

					<h2>12. Os seus direitos</h2>
					<p>
						De acordo com a LGPD, você tem, entre outros, o direito de:
					</p>
					<ul>
						<li>Confirmar a existência de tratamento dos seus dados;</li>
						<li>Acessar os seus dados;</li>
						<li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
						<li>
							Solicitar a anonimização, o bloqueio ou a eliminação de dados
							desnecessários ou tratados em desconformidade com a lei;
						</li>
						<li>Solicitar a exclusão dos seus dados e da sua conta;</li>
						<li>
							Obter informações sobre com quem os seus dados são compartilhados;
						</li>
						<li>
							Revogar o consentimento, quando o tratamento se basear nele.
						</li>
					</ul>
					<p>
						Grande parte desses dados pode ser gerenciada diretamente nas
						configurações da sua conta. Para exercer qualquer um desses direitos
						ou tirar dúvidas, entre em contato pelo email{" "}
						<a href={"mailto:mymangashelfs@gmail.com"}>
							mymangashelfs@gmail.com
						</a>
						. Poderemos solicitar informações para confirmar a sua identidade
						antes de atender ao pedido.
					</p>

					<h2>13. Moderação automatizada</h2>
					<p>
						Para manter um ambiente seguro, algumas ações de moderação podem
						ocorrer de forma automática. Por exemplo, um conteúdo pode ser
						ocultado ou reclassificado (como spoiler ou conteúdo adulto) quando
						recebe denúncias suficientes de outros usuários. Essas medidas são
						automáticas e temporárias e não substituem uma análise humana. Caso
						você entenda que um conteúdo seu foi afetado indevidamente, pode
						solicitar a revisão da decisão entrando em contato conosco.
					</p>

					<h2>14. Crianças e adolescentes</h2>
					<p>
						O Manga Shelf não se destina a crianças e não coletamos
						intencionalmente dados de menores de idade sem o consentimento e a
						supervisão de um responsável legal. Determinados conteúdos são
						classificados como adultos (+18) e só são exibidos a usuários que
						optaram expressamente por visualizá-los. Se você é responsável por um
						menor e acredita que ele nos forneceu dados sem a devida autorização,
						entre em contato para que possamos removê-los.
					</p>

					<h2>15. Alterações nesta política</h2>
					<p>
						Podemos atualizar esta Política de Privacidade periodicamente para
						refletir mudanças no site ou na legislação. Sempre que houver
						alterações relevantes, atualizaremos a data no topo desta página. O
						uso contínuo do site após as alterações constitui a aceitação da
						política revisada.
					</p>

					<h2>16. Contato</h2>
					<p>
						Se você tiver qualquer dúvida sobre esta Política de Privacidade ou
						sobre o tratamento dos seus dados, entre em contato conosco pelo email{" "}
						<a href={"mailto:mymangashelfs@gmail.com"}>
							mymangashelfs@gmail.com
						</a>
						. Você também pode consultar os nossos{" "}
						<Link to={"/tos"}>Termos de Serviço</Link>.
					</p>
				</section>
			</div>
		</div>
	);
}
