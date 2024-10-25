//Mandar email para recuperar senha
const nodemailer = require("nodemailer");
var userMail = document.getElementById(recuperarSenha);

//Cria o transporte do email
const transport = nodemailer.createTransport({
    //Usa os termos do Google
    host: 'smtp.gmail.com',
    port: 465 , 
    secure: true,
    auth: {
      //Email do remetente
      user: 'autorizasaida@gmail.com',
      //Senha do sistema de segurança da conta
      pass: 'abuusatljbqjvcpw',
    }
});

//Envio do email
transport.sendMail({
    from: 'Autoriza Saída <autorizasaida@gmail.com>',
    to: userMail,
    subject: 'Esqueceu a senha'
    html: '<h1>FOI O EMAIL???</h1>',
    text: 'FOI O EMAIL???'
})
.then(() => console.log('Email enviado!!'))
.catch((erro) => console.log('Erro ao enviar:', erro));

app.get("/autorizaPendencia", (req,res) => {

  const query = 'SELECT aluno.nome_aluno, aluno.email_aluno, responsavel.email_resp FROM aluno LEFT JOIN inforesp ON aluno.rm = inforesp.rm LEFT JOIN responsavel ON inforesp.cod_resp = responsavel.cod_respaluno LEFT JOIN inforesp ON aluno.rm = inforesp.rmLEFT JOIN responsavel ON inforesp.cod_resp = responsavel.cod_resp'

  db.query (query, [rm_aluno], (error, results) => {
    if (error) {
        console.log("Erro ao buscar os dados do aluno:", error);
        return res.status(500).send("Erro ao buscar os dados.");
    }
  
    if (aluno.nome_resp) {
      const destinatario = responsavel.email_resp
    } else if {
      const destinatario = aluno.email_aluno
    } else {
      console.log("Nenhum email foi encontrado para a confirmação");
      res.status(404).send("Email não enviado")
    }
  });
})

//Mandar email de confirmação de saída
transport.sendMail({
  from: 'Autoriza Saída <autorizasaida@gmail.com>',
  to: 'buenodasilva4@gmail.com',
  subject:'Pode sair',
  html:'<h1>Tá podendo</h1>',
  text:'O aluno está liberado para saída'
})
.then(() => console.log('Email enviado!!'))
.catch((erro) => console.log('Erro ao enviar:', erro));