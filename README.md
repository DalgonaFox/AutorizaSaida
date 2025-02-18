# AutorizaSaída
Um sistema para requisição de saída antecipada de alunos e inserção de atestado médico, com gerenciamento de turmas e cursos.

## Sobre o Projeto
O JustificaSaida é um sistema web que facilita a solicitação e aprovação de saídas antecipadas de alunos em escolas. Ele permite que alunos façam pedidos de saída, enviem justificativas (como atestados médicos) e que os administradores analisem e aprovem as requisições.

## Funcionalidades
1. Cadastro e login de usuários (alunos e administradores)
2. Envio e gerenciamento de justificativas de saída antecipada
3. Download de atestados enviados pelos alunos
4. Painel administrativo para gerenciar requisições

## Requisitos
Antes de rodar o projeto, certifique-se de ter instalado:
- Node.js 18+;
- MySQL Workbench;
- XAMPP;
- Git Bash;
- Algum editor de código (Recomendo o Visual Studio Code).

## Instalação

1. Clonando o Repositório
Use os seguintes comandos no Git Bash, já dentro da pasta onde você deseja clonar o projeto:
> git clone https://github.com/DalgonaFox/AutorizaSaida.git

2. Instalando Dependências
Abra seu editor de código e abra a pasta onde o projeto está.
Use o comando a seguir no seu terminal (Pode ser tanto pelo editor de código como pelo prompt de comando):
> npm install express express-session multer fs mysql2 body-parser path nodemailer

3. Configurando o Banco de Dados
- Ligue o XAMPP, e habilite o MySQL na porta 3306.
- Crie uma conexão no MySQL Workbench chamado AutorizaSaida. Defina o username como root, sem senha e deixe o hostname como locahost.
- Abra o arquivo "milena.sql" na pasta "bd" desse projeto, e execute (no botão de raio, no topo).

4. Rodando o Projeto
No terminal, use o comando a seguir (certifique-se de estar dentro da pasta do projeto):
> node server.js
Abra o sistema pelo link "localhost:8080" em seu navegador.

## Como Usar
- Aluno: Faça login com o e-mail 'alunoteste@mail.com' e a senha 'senha123' e envie uma solicitação de saída, por exemplo.
- Administrador: Acesse o painel de gestão com o e-mail 'gestorteste@mail.com' e a senha 'gestor123', veja as requisições e aprove ou rejeite.
> Sugestão: No perfil do gestor, cadastre um aluno com o seu e-mail. Teste entrar nesse usuário criado como aluno, envie formulários e depois autorize com o gestor. Você receberá um e-mail de que sua saída foi autorizada! Você também pode tentar trocar sua senha, e irá receber um e-mail com uma senha aleatória para você alterar ao logar novamente!

## Tecnologias
O projeto foi desenvolvido com as seguintes tecnologias:
- Frontend: HTML, CSS, Bootstrap, EJS;
- Backend: Node.js, Express.js, MySQL;
- Banco de Dados: MySQL.

## Contato
Caso tenha dúvidas ou sugestões, entre em contato:
- Email: mila.olisantos@gmail.com
- GitHub: [DalgonaFox](https://github.com/DalgonaFox)
- LinkedIn: [Milena Oliveira Santos](https://www.linkedin.com/in/milena-oliveira-santos-432611278/).