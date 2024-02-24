# MangaShelf

## EN 
### [Demo](https://mangashelf.com.br/)
## Description:

This project is a web application that simplifies the management of manga collections and also helps people find key information about manga (This applies only to manga published physically in Brazil). Users can create an account, add collections to their "shelf," mark owned volumes of each collection, identify missing volumes for their collection, and more. Even without accounts, people can still search for titles and see key information like authors, Brazilian publishers, and the number of published volumes.

This project consists of a single-page application (SPA) written in React and React Router to handle client-side navigation. Each page connects to a RESTful API written using Express.js, responsible for returning data from a MongoDB database.

### Key Features:

* **User Authentication:** Users can create an account, log in, and, if necessary, reset their passwords.
* **Browse trough titles:** Any visitor can browse through titles available in Brazil and find some information about them.
* **Manage their collection:** Logged-in users can add titles to their collections and stay up to date on the status of each series.
* **Mark volumes:** Logged-in users can mark volumes that they already own, making it easy to identify which volumes are missing in their collection.

### Technologies Used:
* **MongoDB:** A NoSQL database used to store user information.
* **Express.js:** A Node.js application framework for building the API and handling requests.
* **React:** A JavaScript library for creating the user interface.
* **Node.js:** A JavaScript runtime environment on the server-side.

### Acknowledgments:
This project is inspired by [TV Show Time](https://www.tvtime.com/), which has similar features but for TV shows. The UI/UX is heavily inspired by [aniList](https://anilist.co/), an application to track, share, and discover anime and manga. Their site is amazing, and "MangaShelf" originally came from the desire to have a similar platform but for physical manga published in Brazil.

### Notes:

The website was originally built to solve a problem that I had. Because I thought other people could benefit from my solution, I made it publicly available. Because of that, the website is built for a Brazilian audience and as such does not provide translations for English speakers. The database used on the website is built using scraped data from Brazilian publishers of each collection. I do not own any image rights of any title, and I only used data publicly available on the web. If any rights owners want me to remove the content, please get in touch with me so we can resolve it peacefully.
## PT-BR

### [Demonstração](https://mangashelf.com.br/)
### Descrição:
Este projeto é uma aplicação web que simplifica a gestão de coleções de mangá e também ajuda as pessoas a encontrarem informações-chave sobre mangás publicados fisicamente no Brasil. Os usuários podem criar uma conta, adicionar coleções à sua "estante", marcar volumes de cada coleção que possuem, identificar volumes faltantes para sua coleção e muito mais. Mesmo sem contas, as pessoas ainda podem pesquisar por títulos e ver informações-chave como autores, editoras brasileiras e o número de volumes publicados.

Este projeto consiste em uma aplicação de página única (SPA) escrita em React e React Router para lidar com a navegação do lado do cliente. Cada página se conecta a uma API RESTful escrita usando Express.js, responsável por retornar dados de um banco de dados MongoDB.

### Recursos Principais:

* **Autenticação de Usuário:** Os visitantes podem criar uma conta, fazer login e, se necessário, redefinir suas senhas.
* **Navegar pelos Títulos:** Qualquer visitante pode navegar pelos títulos disponíveis no Brasil e encontrar algumas informações sobre eles
* **Gerenciar sua coleção:** Usuários logados podem adicionar títulos às suas coleções e se manter atualizados sobre o status de cada série.
* **Marcar volumes:** Usuários logados podem marcar volumes que já possuem, facilitando a identificação dos volumes que faltam em sua coleção.

### Tecnologias Utilizadas:
* **MongoDB:** Banco de dados NoSQL utilizado para armazenar informações do usuário.
* **Express.js:** Framework de aplicativo Node.js para construir a API e manipular solicitações.
* **React:** Biblioteca JavaScript para criar a interface do usuário.
* **Node.js:** Ambiente de tempo de execução JavaScript do lado do servidor.
### Agradecimentos:
Este projeto é inspirado no [TV Show Time](https://www.tvtime.com/), que possui características semelhantes, mas para programas de TV. O UI/UX é fortemente inspirado no  [aniList](https://anilist.co/), um aplicativo para rastrear, compartilhar e descobrir anime e mangá. Seu site é incrível, e "MangaShelf" originalmente surgiu do desejo de ter uma plataforma semelhante, mas para mangás físicos publicados no Brasil.
