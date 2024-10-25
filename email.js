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
    text: 'FOI O EMAIL???',
})
.then(() => console.log('Email enviado!!'))
.catch((erro) => console.log('Erro ao enviar:', erro));

//Mandar email para confirmar saída

  
