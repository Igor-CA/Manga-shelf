import "./ToSPage.css"
export default function ToSPage() {
	return (
		<div className="page-content">
            <div className="container">
                <section className="tos">
                    <h1>Termos de Serviço</h1>
                    <p>
                        Ao utilizar este site, você concorda em cumprir e estar vinculado aos
                        seguintes termos e condições de uso:
                    </p>
                    <ol>
                        <li>
                            <strong>Aceitação dos Termos:</strong> Você reconhece que leu,
                            entendeu e concorda em cumprir estes termos e todas as leis e
                            regulamentos aplicáveis. Se você não concorda com estes termos, por
                            favor, não use este site.
                        </li>
                        <li>
                            <strong>Uso do Site:</strong> Você concorda em usar este site apenas
                            para fins legais e de acordo com todas as leis e regulamentos
                            aplicáveis.
                        </li>
                        <li>
                            <strong>Conduta do Usuário:</strong> Você concorda em não se envolver
                            em atividades proibidas, incluindo, mas não se limitando a, hacking,
                            spam, ou a publicação de conteúdo ilegal, prejudicial, difamatório,
                            assediador ou que promova ódio, violência ou discriminação de
                            qualquer natureza (por raça, etnia, nacionalidade, religião, gênero,
                            orientação sexual, deficiência ou qualquer outra característica).
                        </li>
                        <li>
                            <strong>Conteúdo do Usuário:</strong> O Manga Shelf permite que
                            usuários publiquem conteúdo, como comentários, avaliações (reviews) e
                            imagens. Você é o único responsável pelo conteúdo que publica e
                            garante possuir os direitos necessários para compartilhá-lo. Ao
                            enviar conteúdo, você concorda em classificá-lo corretamente:
                            marcando como conteúdo adulto (+18) qualquer imagem imprópria para
                            menores e como spoiler qualquer conteúdo que revele partes
                            importantes de uma obra. A classificação incorreta ou ausente
                            constitui violação destes termos.
                        </li>
                        <li>
                            <strong>Moderação e Denúncias:</strong> Para manter um ambiente
                            seguro, o Manga Shelf disponibiliza ferramentas para que usuários
                            denunciem conteúdo que considerem impróprio (por ódio ou abuso,
                            conteúdo adulto não classificado, ou spoiler não marcado).
                            Reservamo-nos o direito de ocultar, remover ou reclassificar conteúdo
                            denunciado ou que viole estes termos, bem como de suspender contas
                            reincidentes. As denúncias e as ações tomadas são registradas. A
                            ocultação de um conteúdo enquanto ele é analisado não constitui
                            julgamento definitivo.
                        </li>
                        <li>
                            <strong>Propriedade Intelectual:</strong> Reconhecemos que não
                            possuímos os direitos autorais de todo o conteúdo presente neste site,
                            incluindo texto, gráficos, e imagens. Esse conteúdo pode ser de
                            propriedade de terceiros, como editores, autores e outros, e é
                            protegido por leis de direitos autorais e outras leis de propriedade
                            intelectual. Se você é o detentor dos direitos autorais de qualquer
                            conteúdo exibido neste site e acredita que seu trabalho foi usado de
                            maneira que constitui violação de direitos autorais, entre em contato
                            conosco em{" "}
                            <a
                                href={"mailto:mymangashelfs@gmail.com"}
                                className="autentication-form__link"
                            >
                                mymangashelfs@gmail.com.
                            </a>{" "}
                            Estamos dispostos a cooperar para remover ou creditar apropriadamente
                            o conteúdo, conforme necessário.
                        </li>
                        <li>
                            <strong>Isenção de Responsabilidade:</strong> Este site é fornecido
                            "como está", e a Manga Shelf não faz representações ou garantias,
                            expressas ou implícitas, sobre a precisão, integridade ou
                            disponibilidade do conteúdo.
                        </li>
                        <li>
                            <strong>Limitação de Responsabilidade:</strong> Em nenhum caso a
                            Manga Shelf será responsável por danos diretos, indiretos, especiais
                            ou consequenciais decorrentes ou relacionados ao uso ou
                            impossibilidade de uso deste site.
                        </li>
                        <li>
                            <strong>Alterações nos Termos:</strong> A Manga Shelf se reserva o
                            direito de alterar estes termos a qualquer momento sem aviso prévio. O
                            uso contínuo do site após quaisquer alterações constitui a aceitação
                            dos novos termos.
                        </li>
                        <li>
                            <strong>Lei Aplicável:</strong> Este acordo será regido e interpretado
                            de acordo com as leis do Brasil.
                        </li>
                        <li>
                            <strong>Informações de Contato:</strong> Se você tiver alguma dúvida
                            ou preocupação sobre estes termos, entre em contato conosco em nosso
                            email:{" "}
                            <a
                                href={"mailto:mymangashelfs@gmail.com"}
                                className="autentication-form__link"
                            >
                                mymangashelfs@gmail.com
                            </a>
                            .
                        </li>
                    </ol>
                    <p>
                        Ao usar este site, você reconhece que leu e entendeu estes termos e
                        concorda em estar vinculado a eles.
                    </p>
                </section>
            </div>
        </div>
	);
}
