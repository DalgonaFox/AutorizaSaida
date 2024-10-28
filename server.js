// Extensões
var express = require('express');
var session = require('express-session');
var app = express();
const multer = require('multer');
const fs = require('fs');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require("nodemailer");

// Porta
const port = 8080;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    console.log(`Acesse pelo ip que eu mandar no zap + :${port}`);
});

// pasta public
app.use(express.static(__dirname + '/public'));

// pasta views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuração do banco de dados
const db = mysql.createConnection({
    host: 'srv1595.hstgr.io',
    user: 'u610580921_marianachaves',
    password: 'SesiSen@i2024',
    database: 'u610580921_tcc',
    ssl: { rejectUnauthorized: false }
});

// Conexão com o banco de dados
db.connect((error) => {
    if (error) {
        console.log("Erro ao conectar com o banco de dados:", error);
    } else {
        console.log("Conectado ao MySQL");
    }
});

// Sessão
app.use(session({
    secret: 'desespero',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Configurações do Express
app.use(bodyParser.urlencoded({ extended: true }));


// Rotas Gets
// É aqui que o inferno começa :)

// Manutenção
app.get("/manutencao", (req, res) => {
    res.render("manutencao");
});

// Login
app.get("/", (req, res) => {
    res.render("index", { errorMessage: null });
});


// Esqueceu a senha
app.post("/esquecerSenha", (req, res) => {
    if (!req.body.email) {
        return res.send('Por favor, preencha o campo');
    }

    console.log('post encontrado');
    const userMail = req.body.email;

    // Cria o transporte do email
    const transport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465, 
        secure: true,
        auth: {
            user: 'autorizasaida@gmail.com',
            pass: 'abuusatljbqjvcpw',
        }
    });

    // Envio do email
    transport.sendMail({
        from: 'Autoriza Saída <autorizasaida@gmail.com>',
        to: userMail,
        subject: 'Esqueceu a senha',
        html: '<h1>FOI O EMAIL???</h1>',
        text: 'FOI O EMAIL???'
    }, (error, info) => {
        if (error) {
            console.log('Erro ao enviar:', error);
            return res.status(500).send('Erro ao enviar o email.');
        }
        console.log('Email enviado!!');
        res.send('Email enviado com sucesso!');
    });
});


//Login reformado
app.post("/login", (req, res) => {
    const email = req.body.aluno;
    const senha = req.body.senha;

    const query = `
        SELECT nome_aluno AS nome, senha, primeiro_acesso, rm AS rm_aluno, 'aluno' AS tipo, email_aluno AS email_user FROM aluno WHERE email_aluno = ?
        UNION
        SELECT nome_gestor AS nome, senha, primeiro_acesso, nif AS nif_gestor, 'gestor' AS tipo, email_gestor AS email_user FROM gestor WHERE email_gestor = ?;
    `;

    db.query(query, [email, email], (error, results) => {
        if (error) {
            console.log("Erro ao executar a consulta no banco de dados:", error);
            return res.redirect("/Erro");
        }

        if (results.length > 0) {
            const senhaDB = results[0].senha;
            const primeiroAcesso = results[0].primeiro_acesso;
            const nome = results[0].nome;
            const tipo = results[0].tipo;
            const rm = results[0].rm_aluno;

            if (senha === senhaDB) {
                // Armazenar dados na sessão
                req.session.rm = rm; 
                req.session.nome = nome;
                req.session.email_user = email; 
                req.session.tipo = tipo;

                console.log("Dados da sessão após login:", req.session);

                if (primeiroAcesso) {
                    if (tipo === 'gestor') {
                        return res.redirect('/primeiroacessoGestao');
                    } else {
                        return res.redirect('/primeiroAcesso');
                    }
                } else {
                    if (tipo === 'gestor') {
                        return res.redirect("/homeGestao");
                    } else {
                        return res.redirect('/homeAluno');
                    }
                }
            } else {
                // Se a senha estiver incorreta, renderize a página de login com uma mensagem de erro
                return res.render('index', { errorMessage: 'Senha incorreta. Tente novamente.' });
            }
        } else {
            return res.render('index', {errorMessage: 'Aluno não cadastra.'});
        }
    });
});


// Aluno


//PrimeiroAcessoAluno
app.get("/primeiroAcesso", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    res.render("pages/aluno/primeiroAcesso");
});

app.post('/primeiroAcesso', (req, res) => {
    const { senhaAtual, nova_senha, confirmacaoSenha } = req.body;
    const email_aluno = req.session.email_user;

    if (!req.session.email_user) {
        return res.redirect('/');
    } 

    if (nova_senha.trim() !== confirmacaoSenha.trim()) {
        return res.send("A nova senha e a confirmação não coincidem.");
    }

    const query = 'SELECT senha FROM aluno WHERE email_aluno = ?';
    db.query(query, [email_aluno], (error, results) => {
        if (error) {
            console.log("Erro ao buscar senha no banco de dados:", error);
            return res.redirect("/Erro");
        }

        if (results.length > 0) {
            const senhaDB = results[0].senha;

            if (senhaAtual.trim() === senhaDB) {
                const queryUpdate = 'UPDATE aluno SET senha = ?, primeiro_acesso = false WHERE email_aluno = ?';
                db.query(queryUpdate, [nova_senha.trim(), email_aluno], (error) => {
                    if (error) {
                        console.log("Erro ao atualizar a senha:", error);
                        return res.redirect("/Erro");
                    }
                    console.log("Senha atualizada com sucesso!");
                    return res.redirect('/homeAluno');
                });
            } else {
                return res.send("Senha atual incorreta.");
            }
        } else {
            return res.send("Usuário não encontrado.");
        }
    });
});

// Navbar
//HomeAluno
app.get("/homeAluno", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    } else {
        console.log("Dados da sessão em /homeAluno:", req.session);
        const rm = req.session.rm;
        const total = `
        SELECT COUNT(cod_req) AS totalSaidas FROM requisicao where ciencia_gestor = 1 and rm = ?;
        `;
        const injustificadas = `
        SELECT COUNT(*) AS saidasInjustificadas
        FROM requisicao r
        LEFT JOIN justsaida js ON r.cod_req = js.cod_req
        WHERE js.cod_req IS NULL and js.rm = ?;
        `;
        const achargenero = `
        select cod_genero AS genero from aluno where rm = ?`;

        if (req.session.rm) {
            const nome_aluno = req.session.nome;

            db.query(total, rm, (err, results) => {
                if (err) {
                    console.error('Erro ao contar o total de saídas:', err);
                    return res.status(500).send('Erro ao contar o total de saídas.');
                }

                const totalSaidas = results[0].totalSaidas;
                console.log("Total de Saídas:", totalSaidas);

                db.query(injustificadas, rm, (err, results) => {
                    if (err) {
                        console.error('Erro ao contar as saídas injustificadas:', err);
                        return res.status(500).send('Erro ao contar as saídas injustificadas.');
                    }
                    const saidasInjustificadas = results[0].saidasInjustificadas;
                    console.log("Saídas Injustificadas:", saidasInjustificadas);

                    db.query(achargenero, rm, (err, results) => {
                        if (err) {
                            console.error('Erro ao encontrar o gênero:', err);
                            return res.status(500).send('Erro ao encontrar o gênero.');
                        }
                        const genero = results[0].genero;

                        res.render("pages/aluno/homeAluno", { nome_aluno, totalSaidas, saidasInjustificadas, genero });
                        console.log("Genero:", genero);
                    })

                });

            });
        } else {
            return res.redirect('/');
        }
    }
});

//HistoricoAluno
app.get('/historicoAluno', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    const rm = req.session.rm;

    const { ordenar, justificativa } = req.query;

    console.log("Parâmetros recebidos:", { ordenar, justificativa });

    let historicoQuery = `
        SELECT * FROM (
            SELECT 
                a.nome_aluno AS nome_aluno,
                a.rm AS rm,
                c.tipo_curso AS tipo_curso,
                r.data_saida AS data_saida,
                js.cod_req AS justificativa,
                'Saída Antecipada' AS tipo_historico,
                r.cod_req AS cod_historico
            FROM 
                requisicao r
            JOIN 
                aluno a ON r.rm = a.rm
            JOIN 
                curso c ON a.cod_curso = c.cod_curso
            LEFT JOIN
                justsaida js ON r.cod_req = js.cod_req
            WHERE 
                r.ciencia_gestor = TRUE

            UNION ALL

            SELECT 
                a.nome_aluno AS nome_aluno,
                a.rm AS rm,
                c.tipo_curso AS tipo_curso,
                r.data_saida AS data_saida,
                js.cod_req AS justificativa,
                'Justificativa de Saída' AS tipo_historico,
                js.cod_saida AS cod_historico
            FROM 
                justsaida js
            JOIN 
                requisicao r ON js.cod_req = r.cod_req
            JOIN 
                aluno a ON js.rm = a.rm
            JOIN 
                curso c ON a.cod_curso = c.cod_curso
            WHERE 
                js.ciencia_gestor = TRUE

            UNION ALL

            SELECT 
                a.nome_aluno AS nome_aluno,
                a.rm AS rm,
                c.tipo_curso AS tipo_curso,
                jf.data_emissao AS data_saida,
                jf.arquivo AS justificativa,
                'Justificativa de Falta' AS tipo_historico,
                jf.cod_falta AS cod_historico
            FROM 
                justfalta jf
            JOIN 
                aluno a ON jf.rm = a.rm
            JOIN 
                curso c ON a.cod_curso = c.cod_curso
            WHERE 
                jf.ciencia_gestor = TRUE
        ) AS historicos
        WHERE historicos.rm = ?
    `;

    let whereConditions = [];

    if (justificativa) {
        if (justificativa === "saida") {
            whereConditions.push("tipo_historico = 'Saída Antecipada'");
        } else if (justificativa === "falta") {
            whereConditions.push("tipo_historico = 'Justificativa de Falta'");
        } else if (justificativa === "justsaida") {
            whereConditions.push("tipo_historico = 'Justificativa de Saída'");
        }
    }

    if (whereConditions.length > 0) {
        historicoQuery += " AND (" + whereConditions.join(" OR ") + ")";
    }

    if (ordenar) {
        if (ordenar === "maisAntigo") {
            historicoQuery += " ORDER BY data_saida ASC";
        } else if (ordenar === "recente") {
            historicoQuery += " ORDER BY data_saida DESC";
        }
    } else {
        historicoQuery += " ORDER BY data_saida DESC";
    }

    console.log("Consulta SQL:", historicoQuery);

    db.query(historicoQuery, [rm], (err, results) => {
        if (err) {
            console.error('Erro ao buscar o histórico:', err);
            return res.status(500).send('Erro ao buscar o histórico.');
        } else {
            const totalHistoricos = results.length;
            res.render('pages/aluno/historicoAluno', { historico: results, totalHistoricos });
        }
    });
});



app.get('/detalhesHistorico/:id', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }

    const cod_historico = req.params.id;
    const tipo_historico = req.query.tipo;

    console.log('Tipo de pendência:', tipo_historico);

    // Verifique se tipo_historico é válido
    if (!tipo_historico || !['Saída Antecipada', 'Justificativa de Falta', 'Justificativa de Saída'].includes(tipo_historico)) {
        return res.status(400).send('Tipo de pendência inválido.');
    }

    let selectQuery;
    
    // Definir a query baseada no tipo de pendência
    if (tipo_historico === 'Saída Antecipada') {
        selectQuery = `
            SELECT r.cod_req AS cod_historico, a.nome_aluno, r.rm, c.nome_curso, t.nome_turma, r.data_saida, r.hora_saida, r.justificativa
            FROM requisicao r JOIN aluno a ON r.rm = a.rm JOIN curso c ON a.cod_curso = c.cod_curso JOIN turma t ON a.cod_turma = t.cod_turma
            WHERE r.cod_req = ?
        `;
    } else if (tipo_historico === 'Justificativa de Falta') {
        selectQuery = `
            SELECT f.cod_falta AS cod_historico, a.nome_aluno, f.rm, c.nome_curso, t.nome_turma, f.data_emissao AS data_saida, f.data_inicio, f.data_termino, f.observacao AS justificativa
            FROM justfalta f JOIN aluno a ON f.rm = a.rm JOIN curso c ON a.cod_curso = c.cod_curso JOIN turma t ON a.cod_turma = t.cod_turma
            WHERE f.cod_falta = ?
        `;
    } else if (tipo_historico === 'Justificativa de Saída') {
        selectQuery = `
            SELECT j.cod_saida AS cod_historico, a.nome_aluno, r.rm, c.nome_curso, t.nome_turma, r.data_saida, r.hora_saida, j.observacao AS justificativa
            FROM justsaida j
            JOIN requisicao r ON r.cod_req = j.cod_req
            JOIN aluno a ON r.rm = a.rm
            JOIN curso c ON a.cod_curso = c.cod_curso
            JOIN turma t ON a.cod_turma = t.cod_turma
            WHERE j.cod_saida = ?
        `;
    }

    // Executar a consulta ao banco de dados
    db.query(selectQuery, [cod_historico], (err, results) => {
        if (err) {
            console.error('Erro ao buscar pendência:', err);
            return res.status(500).send('Erro ao buscar pendência.');
        }

        if (results.length === 0) {
            return res.status(404).send('Nenhuma pendência encontrada.');
        }

        // Renderizar a página com os dados da pendência
        const historico = results[0];
        res.render('pages/aluno/detalhesHistorico', { historico, tipo_historico });
    });
});



//PerfilAluno
app.get("/perfilAluno", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    const email_aluno = req.session.email_user;
    const queryAluno = `
        SELECT 
            aluno.nome_aluno,
            aluno.data_nasc,
            aluno.rm,
            aluno.tel_aluno,
            aluno.cpf,
            aluno.email_aluno,
            aluno.cod_genero,
            aluno.cod_curso,
            genero.nome_genero,
            curso.nome_curso,         
            turma.nome_turma,       
            responsavel.nome_resp,
            responsavel.email_resp,
            responsavel.tel_resp,
            empresa.nome_empresa,
            empresa.email_empresa,
            empresa.tel_empresa
        FROM 
            aluno
        LEFT JOIN 
            inforesp ON aluno.rm = inforesp.rm
        LEFT JOIN 
            responsavel ON inforesp.cod_resp = responsavel.cod_resp
        LEFT JOIN 
            infotrabalho ON aluno.rm = infotrabalho.rm
        LEFT JOIN 
            empresa ON infotrabalho.cod_empresa = empresa.cod_empresa
        LEFT JOIN 
            curso ON aluno.cod_curso = curso.cod_curso
        LEFT JOIN 
            genero ON aluno.cod_genero = genero.cod_genero 
        LEFT JOIN 
            turma ON aluno.cod_turma = turma.cod_turma
        WHERE 
            aluno.email_aluno = ?;
    `;

    db.query(queryAluno, [email_aluno], (error, results) => {
        if (error) {
            console.log("Erro ao buscar os dados do aluno:", error);
            return res.status(500).send("Erro ao buscar os dados.");
        }

        if (results.length > 0) {
            const aluno = results[0];

            if (aluno.nome_resp) {
                console.log("Redirecionando para página de aluno menor");
                res.render("pages/aluno/perfilAlunomenor", {
                    nome_aluno: aluno.nome_aluno,
                    cod_curso: aluno.cod_curso,
                    cpf: aluno.cpf,
                    rm: aluno.rm,
                    tel_aluno: aluno.tel_aluno,
                    data_nasc: aluno.data_nasc,
                    genero: aluno.nome_genero,
                    email_aluno: aluno.email_aluno,
                    nome_curso: aluno.nome_curso,
                    nome_turma: aluno.nome_turma,
                    nome_resp: aluno.nome_resp,
                    email_resp: aluno.email_resp,
                    tel_resp: aluno.tel_resp
                });
            } else if (aluno.nome_empresa) {
                console.log("Redirecionando para página de aluno trabalhador");
                res.render("pages/aluno/perfilAlunoempresa", {
                    nome_aluno: aluno.nome_aluno,
                    cod_curso: aluno.cod_curso,
                    cpf: aluno.cpf,
                    rm: aluno.rm,
                    tel_aluno: aluno.tel_aluno,
                    data_nasc: aluno.data_nasc,
                    genero: aluno.nome_genero,
                    email_aluno: aluno.email_aluno,
                    nome_curso: aluno.nome_curso,
                    nome_turma: aluno.nome_turma,
                    nome_empresa: aluno.nome_empresa,
                    email_empresa: aluno.email_empresa,
                    tel_empresa: aluno.tel_empresa
                });
            } else {
                console.log("Redirecionando para página de aluno maior");
                res.render("pages/aluno/perfilAlunomaior", {
                    nome_aluno: aluno.nome_aluno,
                    cod_curso: aluno.cod_curso,
                    cpf: aluno.cpf,
                    rm: aluno.rm,
                    tel_aluno: aluno.tel_aluno,
                    data_nasc: aluno.data_nasc,
                    genero: aluno.nome_genero,
                    email_aluno: aluno.email_aluno,
                    nome_curso: aluno.nome_curso,
                    nome_turma: aluno.nome_turma
                });
            }
        } else {
            res.status(404).send("Aluno não encontrado.");
        }
    });
});

// Secundarias
//Baixar

exports.download = (req, res, next) => {
    console.log('fileController.download: started')
    const path = req.body.path
    const file = fs.createReadStream(path)
    const filename = (new Date()).toISOString()
    res.setHeader('Content-Disposition', 'attachment: filename="' + filename + '"')
    file.pipe(res)
}

app.get('/baixarpdf/:id', (req, res) => {
    const cod_historico = req.params.id;
    const tipo_historico = req.query.tipo;

    let query;
    if (tipo_historico === 'Saída') {
        query = `
            SELECT 
                arquivo
            FROM 
                justsaida
            WHERE 
                cod_req = ?
        `;
    } else if (tipo_historico === 'Falta') {
        query = `
            SELECT 
                arquivo
            FROM 
                justfalta
            WHERE 
                cod_falta = ?
        `;
    } else {
        return res.status(400).send('Tipo de historico inválido.');
    }

    db.query(query, [cod_historico], (err, results) => {
        if (err) {
            console.error('Erro ao buscar detalhes do Histórico:', err);
            return res.status(500).send('Erro ao buscar detalhes do Histórico.');
        }

        if (results.length === 0) {
            return res.status(404).send('Histórico não encontrado.');
        }

        const historicoDetalhes = results[0];

        res.render('pages/gestao/autorizaSaida', { historico: historicoDetalhes, tipo_historico });
    });
});

// Formularios

// Configurações do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
});

const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));

//JustificarSaidaAluno
app.get('/justificarSaidaAluno', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }

    const rm = req.session.rm;

    // Query corrigida para selecionar datas de saídas autorizadas, mas não justificadas
    const sql = `
        SELECT r.cod_req, r.data_saida AS data 
        FROM requisicao r 
        LEFT JOIN justsaida j ON r.cod_req = j.cod_req 
        WHERE r.ciencia_gestor = TRUE 
        AND j.cod_req IS NULL 
        AND r.rm = ?;

    `;

    db.query(sql, [rm], (err, results) => {
        if (err) {
            console.error('Erro ao buscar datas de saída:', err);
            return res.status(500).send('Erro ao buscar datas de saída');
        }

        console.log(results);
        res.render("pages/aluno/justificarSaidaAluno", { saida: results });
    });
});


app.post('/uploadSaida', upload.single('arquivo'), (req, res) => {
    const formType = req.body.formType;
    const observacao = req.body.observacoes;
    const cod_req = req.body.cod_req;
    const rm = req.session.rm;
    const ciencia_gestor = 0;
    const data_envio = new Date().toISOString().slice(0, 10);

    const arquivo = req.file ? req.file.path : null;

    if (!arquivo) {
        return res.status(400).send('Nenhum arquivo enviado.');
    }

    const values = [cod_req, rm, observacao, arquivo, ciencia_gestor, data_envio];
    const sql = 'INSERT INTO justsaida (cod_req, rm, observacao, arquivo, ciencia_gestor, data_envio) VALUES (?, ?, ?, ?, ?, ?)';

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Erro ao inserir dados no banco:', err);
            res.status(500).send('Erro ao processar o formulário.');
        } else {
            console.log('Formulário enviado com sucesso!');
            console.log(results)
            return res.redirect('/homeAluno');
        }
    });
});

//JustificarFaltaAluno
app.get('/justificarFaltaAluno', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    const rm = req.session.rm;
    const queryAluno = `SELECT cod_turma FROM aluno WHERE rm = ?`;

    db.query(queryAluno, [rm], (error, results) => {
        if (results.length > 0) {
            const aluno = results[0];
            console.log('Código da turma recuperado!');
            res.render("pages/aluno/justificarFaltaAluno", { cod_turma: aluno.cod_turma });
        } else {
            console.error('Erro ao recuperar o código da turma: ', error);
            res.status(500).send('Erro ao recuperar o código da turma.');
        }
    });
});

app.post('/uploadFalta', upload.single('arquivo'), (req, res) => {
    const formType = req.body.formType;
    const observacao = req.body.observacoes;
    const rm = req.session.rm;
    const data_emissao = req.body.data_emissao;
    const data_inicio = req.body.data_inicio;
    const data_termino = req.body.data_termino;
    const cod_turma = req.body.cod_turma;
    const ciencia_gestor = 0;
    const data_envio = moment().format("MMMM DD YYYY");
    const arquivo = req.file ? req.file.path : null;

    const values = [rm, cod_turma, data_emissao, data_inicio, data_termino, observacao, arquivo, ciencia_gestor, data_envio];
    const sql = 'INSERT INTO justfalta (rm, cod_turma, data_emissao, data_inicio, data_termino, observacao, arquivo, ciencia_gestor, data_envio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Erro ao inserir dados no banco:', err);
            res.status(500).send('Erro ao processar o formulário.');
        } else {
            console.log('Formulário enviado com sucesso!');
            console.log(results)
            return res.redirect('/homeAluno');
        }
    });
});

//RequisicãoSaida
app.post('/requisicao', (req, res) => {
    const rm = req.session.rm;
    const cod_turma = req.body.cod_turma;
    const dataObj = new Date();
    const data_saida = `${String(dataObj.getDate()).padStart(2, '0')}-${String(dataObj.getMonth() + 1).padStart(2, '0')}-${dataObj.getFullYear()}`;
    const hora_saida = req.body.hora_saida;
    const justificativa = req.body.justificativa;
    const ciencia_gestor = 0;
    

    const values = [rm, cod_turma, data_saida, hora_saida, justificativa, ciencia_gestor];
    const sql = 'INSERT INTO requisicao (rm, cod_turma, data_saida, hora_saida, justificativa, ciencia_gestor) VALUES (?, ?, ?, ?, ?, ?)';

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Erro ao inserir dados no banco:', err);
            res.status(500).send('Erro ao processar o formulário.');
        } else {
            console.log('Formulário enviado com sucesso!');
            console.log(results)
            return res.redirect('/homeAluno');
        }
    });
});

app.get('/requisicaoAluno', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    const rm = req.session.rm;
    const queryAluno = `SELECT cod_turma FROM aluno WHERE rm = ?`;

    db.query(queryAluno, [rm], (error, results) => {
        if (results.length > 0) {
            const aluno = results[0];
            console.log('Código da turma recuperado!');
            res.render("pages/aluno/requisicaoAluno", { cod_turma: aluno.cod_turma });
        } else {
            console.error('Erro ao recuperar o código da turma: ', error);
            res.status(500).send('Erro ao recuperar o código da turma.');
        }
    });
});

// MudarSenha do Aluno
app.get("/mudarSenhaAluno", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    res.render("pages/aluno/mudarSenhaAluno");
});

app.post('/mudarSenhaAluno', (req, res) => {
    const { senhaAtual, nova_senha, confirmacaoSenha } = req.body;
    const email_aluno = req.session.email_user;

    console.log("Requisição para mudar senha recebida");
    if (!req.session.email_user) {
        return res.redirect('/');
    } 

    if (nova_senha.trim() !== confirmacaoSenha.trim()) {
        return res.send("A nova senha e a confirmação não coincidem.");
    }


    console.log("Buscando senha atual no banco de dados...");
    const query = 'SELECT senha FROM aluno WHERE email_aluno = ?';
    db.query(query, [email_aluno], (error, results) => {
        if (error) {
            console.log("Erro ao buscar senha no banco de dados:", error);
            return res.send("Erro ao buscar senha no banco de dados");
        }

        if (results.length > 0) {
            const senhaDB = results[0].senha;

            console.log("Senha atual do banco de dados:", senhaDB);

            if (senhaAtual.trim() === senhaDB) {
                console.log("Senha atual validada. Atualizando senha...");

                const queryUpdate = 'UPDATE aluno SET senha = ? WHERE email_aluno = ?';
                db.query(queryUpdate, [nova_senha.trim(), email_aluno], (error) => {
                    if (error) {
                        console.log("Erro ao atualizar a senha:", error);
                        return res.send("Erro ao atualizar a senha");
                    }
                    console.log("Senha atualizada com sucesso!");
                    return res.redirect("/");
                });
            } else {
                return res.send("Senha atual incorreta.");
            }
        } else {
            return res.send("Usuário não encontrado.");
        }
    });
});

// Gestao

//PrimeiroAcessoGestao
app.get("/primeiroacessoGestao", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    res.render("pages/gestao/primeiroacessoGestao");
});

app.post('/primeiroacessoGestao', (req, res) => {
    const { senhaAtual, nova_senha, confirmacaoSenha } = req.body;
    const email_gestor = req.session.email_user; // Email do gestor armazenado na sessão

    if (!email_gestor) {
        return res.send("Usuário não autenticado. Faça login novamente.");
    }

    if (nova_senha.trim() !== confirmacaoSenha.trim()) {
        return res.send("A nova senha e a confirmação não coincidem.");
    }

    const query = 'SELECT senha FROM gestor WHERE email_gestor = ?';
    db.query(query, [email_gestor], (error, results) => {
        if (error) {
            console.log("Erro ao buscar senha no banco de dados:", error);
            return res.redirect("/Erro");
        }

        if (results.length > 0) {
            const senhaDB = results[0].senha;

            if (senhaAtual.trim() === senhaDB) {
                const queryUpdate = 'UPDATE gestor SET senha = ?, primeiro_acesso = false WHERE email_gestor = ?';
                db.query(queryUpdate, [nova_senha.trim(), email_gestor], (error) => {
                    if (error) {
                        console.log("Erro ao atualizar a senha:", error);
                        return res.redirect("/Erro");
                    }
                    console.log("Senha atualizada com sucesso!");
                    return res.redirect('/homeGestao');
                });
            } else {
                return res.send("Senha atual incorreta.");
            }
        } else {
            alert("Usuário não encontrado.");
        }

        console.log("E-mail do gestor na sessão:", email_gestor);

    });
});

// Navbar
//HomeGestao
app.get("/homeGestao", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }

    const email_gestor = req.session.email_user;
    const nome_gestao = req.session.nome;

    const total = `
    SELECT SUM(totalPendencias) AS totalPendencias
    FROM (
        SELECT COUNT(cod_req) AS totalPendencias FROM requisicao WHERE ciencia_gestor = 0
        UNION ALL
        SELECT COUNT(cod_saida) AS totalPendencias FROM justsaida WHERE ciencia_gestor = 0
        UNION ALL
        SELECT COUNT(cod_falta) AS totalPendencias FROM justfalta WHERE ciencia_gestor = 0
    ) AS pendenciasTotais;
    `;
                    // oii milenaa NUUU O TAMNAHO DO SELECT :)  
    const totalGrafico = `
        SELECT 
            SUM(total) AS total,
            SUM(CASE WHEN ciencia_gestor = 0 THEN total ELSE 0 END) AS pendenciasRestantes,
            SUM(CASE WHEN ciencia_gestor = 1 THEN total ELSE 0 END) AS pendenciasLidas
        FROM (
            SELECT COUNT(cod_req) AS total, ciencia_gestor 
            FROM requisicao 
            WHERE data_saida = CURDATE()
            GROUP BY ciencia_gestor
            UNION ALL
            SELECT COUNT(cod_saida) AS total, ciencia_gestor 
            FROM justsaida 
            WHERE data_envio = CURDATE()
            GROUP BY ciencia_gestor
            UNION ALL
            SELECT COUNT(cod_falta) AS total, ciencia_gestor 
            FROM justfalta 
            WHERE data_envio = CURDATE()
            GROUP BY ciencia_gestor
        ) AS pendenciasTotais;`

    const achargenero = `
    SELECT cod_genero AS genero FROM gestor WHERE email_gestor = ?`;

    db.query(total, (err, results) => {
        if (err) {
            console.error('Erro ao buscar pendências:', err);
            return res.status(500).send('Erro ao buscar pendências.');
        }
        const totalPendencias = results[0].totalPendencias;
        console.log("Pendências:", totalPendencias);

        db.query(achargenero, email_gestor, (err, results) => {
            if (err) {
                console.error('Erro ao encontrar o gênero:', err);
                return res.status(500).send('Erro ao encontrar o gênero.');
            } else {
                const genero = results[0].genero;

                db.query(totalGrafico, (err, results) => {
                    if (err) {
                        console.log(err)
                        res.send('Erro.')
                    } else {
                        const total = results[0].total;
                        console.log("Total:", total)
                        const successMessage = req.session.successMessage;
                        req.session.successMessage = null;

                        // Renderiza a view 'homeGestao.ejs' passando os dados
                        res.render("pages/gestao/homeGestao", { nome_gestao, totalPendencias, genero, successMessage, total});
                        console.log("Gênero:", genero);
                            }
                })

                
            }
        });
    });
});


//HistoricoGestao
app.get('/historicoGestao', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    const rm = req.session.rm;

    const { ordenar, justificativa } = req.query;

    console.log("Parâmetros recebidos:", { ordenar, justificativa });

    let historicoQuery = `
        SELECT * FROM (
            SELECT 
                a.nome_aluno AS nome_aluno,
                a.rm AS rm,
                c.tipo_curso AS tipo_curso,
                r.data_saida AS data_saida,
                js.cod_req AS justificativa,
                'Saída Antecipada' AS tipo_historico,
                r.cod_req AS cod_historico
            FROM 
                requisicao r
            JOIN 
                aluno a ON r.rm = a.rm
            JOIN 
                curso c ON a.cod_curso = c.cod_curso
            LEFT JOIN
                justsaida js ON r.cod_req = js.cod_req
            WHERE 
                r.ciencia_gestor = TRUE

            UNION ALL

            SELECT 
                a.nome_aluno AS nome_aluno,
                a.rm AS rm,
                c.tipo_curso AS tipo_curso,
                r.data_saida AS data_saida,
                js.cod_req AS justificativa,
                'Justificativa de Saída' AS tipo_historico,
                js.cod_saida AS cod_historico
            FROM 
                justsaida js
            JOIN 
                requisicao r ON js.cod_req = r.cod_req
            JOIN 
                aluno a ON js.rm = a.rm
            JOIN 
                curso c ON a.cod_curso = c.cod_curso
            WHERE 
                js.ciencia_gestor = TRUE

            UNION ALL

            SELECT 
                a.nome_aluno AS nome_aluno,
                a.rm AS rm,
                c.tipo_curso AS tipo_curso,
                jf.data_emissao AS data_saida,
                jf.arquivo AS justificativa,
                'Justificativa de Falta' AS tipo_historico,
                jf.cod_falta AS cod_historico
            FROM 
                justfalta jf
            JOIN 
                aluno a ON jf.rm = a.rm
            JOIN 
                curso c ON a.cod_curso = c.cod_curso
            WHERE 
                jf.ciencia_gestor = TRUE
        ) AS historicos
        WHERE 1 = 1
    `;

    let whereConditions = [];

    // Filtro de justificativa
    if (justificativa) {
        console.log("Aplicando filtro de justificativa:", justificativa); 
        if (justificativa === "saida") {
            whereConditions.push("tipo_historico = 'Saída Antecipada'");
        } else if (justificativa === "falta") {
            whereConditions.push("tipo_historico = 'Justificativa de Falta'");
        } else if (justificativa === "justsaida") {
            whereConditions.push("tipo_historico = 'Justificativa de Saída'");
        }
    }

    // Adicionar as condições de filtro, se houver
    if (whereConditions.length > 0) {
        historicoQuery += " AND (" + whereConditions.join(" OR ") + ")";
    }

    // Filtro de ordenação
    if (ordenar) {
        console.log("Aplicando ordenação:", ordenar);
        if (ordenar === "maisAntigo") {
            historicoQuery += " ORDER BY data_saida ASC";
        } else if (ordenar === "recente") {
            historicoQuery += " ORDER BY data_saida DESC";
        }
    } else {
        historicoQuery += " ORDER BY data_saida DESC";
    }

    console.log("Consulta SQL final:", historicoQuery); 

    // Executar a consulta ao banco de dados
    db.query(historicoQuery, [rm], (err, results) => {
        if (err) {
            console.error('Erro ao buscar o histórico:', err);
            return res.status(500).send('Erro ao buscar o histórico.');
        } else {
            const totalHistoricos = results.length;
            console.log("Resultados encontrados:", results); 
            res.render('pages/gestao/historicoGestao', { historico: results, totalHistoricos });
        }
    });
});



app.get("/dadosPendencias", (req, res) => {
    const totalQuery = `
        SELECT 
            SUM(total) AS total,
            SUM(CASE WHEN ciencia_gestor = 0 THEN total ELSE 0 END) AS pendenciasRestantes,
            SUM(CASE WHEN ciencia_gestor = 1 THEN total ELSE 0 END) AS pendenciasLidas
        FROM (
            SELECT COUNT(cod_req) AS total, ciencia_gestor 
            FROM requisicao 
            WHERE data_saida = CURDATE()
            GROUP BY ciencia_gestor
            UNION ALL
            SELECT COUNT(cod_saida) AS total, ciencia_gestor 
            FROM justsaida 
            WHERE data_envio = CURDATE()
            GROUP BY ciencia_gestor
            UNION ALL
            SELECT COUNT(cod_falta) AS total, ciencia_gestor 
            FROM justfalta 
            WHERE data_envio = CURDATE()
            GROUP BY ciencia_gestor
        ) AS pendenciasTotais;
    `;

    db.query(totalQuery, (err, results) => {
        if (err) {
            console.error('Erro ao buscar pendências:', err);
            return res.status(500).json({ error: 'Erro ao buscar pendências' });
        } else {
            console.log(results)
        }
        const data = {
            total: results[0].total,
            pendenciasRestantes: results[0].pendenciasRestantes,
            pendenciasLidas: results[0].pendenciasLidas
        };
        res.json(data);
    });
});



//Pendentes
app.get('/pendentes', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }

    const { ordenar, justificativa } = req.query;

    console.log("Parâmetros recebidos:", { ordenar, justificativa });

    // Encapsulando toda a consulta UNION ALL em uma subquery
    let pendenciasQuery = `
        SELECT * FROM (
            SELECT 
                a.nome_aluno AS nome_aluno,
                c.tipo_curso AS tipo_curso,
                r.data_saida AS data_saida,
                js.cod_req AS justificativa,
                'Saída Antecipada' AS tipo_pendencia,
                r.cod_req AS cod_pendencia
            FROM 
                requisicao r
            JOIN 
                aluno a ON r.rm = a.rm
            JOIN 
                curso c ON a.cod_curso = c.cod_curso
            LEFT JOIN
                justsaida js ON r.cod_req = js.cod_req
            WHERE 
                r.ciencia_gestor = FALSE

            UNION ALL

            SELECT 
                a.nome_aluno AS nome_aluno,
                c.tipo_curso AS tipo_curso,
                r.data_saida AS data_saida,
                js.cod_req AS justificativa,
                'Justificativa de Saída' AS tipo_pendencia,
                js.cod_saida AS cod_pendencia
            FROM 
                justsaida js
            JOIN 
                requisicao r ON js.cod_req = r.cod_req
            JOIN 
                aluno a ON js.rm = a.rm
            JOIN 
                curso c ON a.cod_curso = c.cod_curso
            WHERE 
                js.ciencia_gestor = FALSE

            UNION ALL

            SELECT 
                a.nome_aluno AS nome_aluno,
                c.tipo_curso AS tipo_curso,
                jf.data_emissao AS data_saida,
                jf.arquivo AS justificativa,
                'Justificativa de Falta' AS tipo_pendencia,
                jf.cod_falta AS cod_pendencia
            FROM 
                justfalta jf
            JOIN 
                aluno a ON jf.rm = a.rm
            JOIN 
                curso c ON a.cod_curso = c.cod_curso
            WHERE 
                jf.ciencia_gestor = FALSE
        ) AS pendencias
    `;

    // Condições para o filtro de justificativa
    let whereConditions = [];

    if (justificativa) {
        if (justificativa === "saida") {
            whereConditions.push("tipo_pendencia = 'Saída Antecipada'");
        } else if (justificativa === "falta") {
            whereConditions.push("tipo_pendencia = 'Justificativa de Falta'");
        } else if (justificativa === "justsaida") {
            whereConditions.push("tipo_pendencia = 'Justificativa de Saída'");
        }
    }

    if (whereConditions.length > 0) {
        pendenciasQuery += " WHERE " + whereConditions.join(" OR ");
    }

    if (ordenar) {
        if (ordenar === "maisAntigo") {
            pendenciasQuery += " ORDER BY data_saida ASC";
        } else if (ordenar === "recente") {
            pendenciasQuery += " ORDER BY data_saida DESC";
        }
    } else {
        pendenciasQuery += " ORDER BY data_saida DESC";
    }

    console.log("Consulta SQL:", pendenciasQuery);

    // Executa a consulta
    db.query(pendenciasQuery, (err, results) => {
        if (err) {
            console.error('Erro ao buscar pendências:', err);
            return res.status(500).send('Erro ao buscar pendências.');
        }

        // Calcula o total de pendências
        const totalPendencias = results.length;

        // Renderiza a view 'pendentes.ejs' passando os dados
        res.render('pages/gestao/pendentes', { pendencias: results, totalPendencias });
    });
});



// Autorização da pendência
app.get('/autorizaPendencia/:id', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }

    const cod_pendencia = req.params.id;
    const tipo_pendencia = req.query.tipo;

    console.log('Tipo de pendência:', tipo_pendencia);

    // Verifique se tipo_pendencia é válido
    if (!tipo_pendencia || !['Saída Antecipada', 'Justificativa de Falta', 'Justificativa de Saída'].includes(tipo_pendencia)) {
        return res.status(400).send('Tipo de pendência inválido.');
    }

    let selectQuery;
    
    // Definir a query baseada no tipo de pendência
    if (tipo_pendencia === 'Saída Antecipada') {
        selectQuery = `
            SELECT r.cod_req AS cod_pendencia, a.nome_aluno, r.rm, c.nome_curso, t.nome_turma, r.data_saida, r.hora_saida, r.justificativa
            FROM requisicao r JOIN aluno a ON r.rm = a.rm JOIN curso c ON a.cod_curso = c.cod_curso JOIN turma t ON a.cod_turma = t.cod_turma
            WHERE r.cod_req = ?
        `;
    } else if (tipo_pendencia === 'Justificativa de Falta') {
        selectQuery = `
            SELECT f.cod_falta AS cod_pendencia, a.nome_aluno, f.rm, c.nome_curso, t.nome_turma, f.data_emissao AS data_saida, f.data_inicio, f.data_termino, f.observacao AS justificativa
            FROM justfalta f JOIN aluno a ON f.rm = a.rm JOIN curso c ON a.cod_curso = c.cod_curso JOIN turma t ON a.cod_turma = t.cod_turma
            WHERE f.cod_falta = ?
        `;
    } else if (tipo_pendencia === 'Justificativa de Saída') {
        selectQuery = `
            SELECT j.cod_saida AS cod_pendencia, a.nome_aluno, r.rm, c.nome_curso, t.nome_turma, r.data_saida, r.hora_saida, j.observacao AS justificativa
            FROM justsaida j
            JOIN requisicao r ON r.cod_req = j.cod_req
            JOIN aluno a ON r.rm = a.rm
            JOIN curso c ON a.cod_curso = c.cod_curso
            JOIN turma t ON a.cod_turma = t.cod_turma
            WHERE j.cod_saida = ?
        `;
    }

    // Executar a consulta ao banco de dados
    db.query(selectQuery, [cod_pendencia], (err, results) => {
        if (err) {
            console.error('Erro ao buscar pendência:', err);
            return res.status(500).send('Erro ao buscar pendência.');
        }

        if (results.length === 0) {
            return res.status(404).send('Nenhuma pendência encontrada.');
        }

        // Renderizar a página com os dados da pendência
        const pendencia = results[0];
        res.render('pages/gestao/autorizaSaida', { pendencia, tipo_pendencia });
    });
});




// Autorizar a pendência
app.post('/autorizar-saida/:id', (req, res) => {
    const cod_pendencia = req.params.id;
    const tipo_pendencia = req.query.tipo;

    // Verifique se tipo_pendencia é válido
    if (!tipo_pendencia || !['Saída Antecipada', 'Justificativa de Falta', 'Justificativa de Saída'].includes(tipo_pendencia)) {
        return res.status(400).send('Tipo de pendência inválido.');
    }

    let updateQuery;
    if (tipo_pendencia === 'Saída Antecipada') {
        updateQuery = `UPDATE requisicao SET ciencia_gestor = TRUE WHERE cod_req = ?`;
    } else if (tipo_pendencia === 'Justificativa de Falta') {
        updateQuery = `UPDATE justfalta SET ciencia_gestor = TRUE WHERE cod_falta = ?`;
    } else if (tipo_pendencia === 'Justificativa de Saída') {
        updateQuery = `UPDATE justsaida SET ciencia_gestor = TRUE WHERE cod_saida = ?`;
    }

    db.query(updateQuery, [cod_pendencia], (err, results) => {
        if (err) {
            console.error('Erro ao autorizar pendência:', err);
            return res.status(500).send('Erro ao autorizar pendência.');
        }
        res.redirect('/pendentes');
    });
});



//Cursos
app.get('/cursos', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    db.query(`SELECT 
                c.cod_curso AS codCurso, 
                c.nome_curso, 
                c.tipo_curso, 
                COUNT(t.cod_curso) AS turmas
            FROM 
                curso c
            LEFT JOIN 
                turma t ON c.cod_curso = t.cod_curso
            GROUP BY 
                c.cod_curso, c.nome_curso, c.tipo_curso;`, (error, results) => {
        if (error) {
            console.log('Houve um erro ao procurar os cursos')
        } else {
            console.log('Cursos:', results);
            res.render('pages/gestao/cursos', { cursos: results })
        }
    })
});

//PerfilGestao
app.get("/perfilGestao", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    // Supondo que o 'email_gestao' foi armazenado na sessão durante o login
    const email_gestor = req.session.email_user;

    if (!email_gestor) {
        // Se o gestor não estiver logado ou a sessão expirou
        return res.redirect('/');
    }

    // Consulta para pegar os dados do gestor
    const query = `
SELECT
gestor.nome_gestor,
gestor.email_gestor,
gestor.tel_gestor,
gestor.nif,
gestor.cargo, 
gestor.cod_genero,
genero.nome_genero
FROM gestor 
LEFT JOIN 
genero ON gestor.cod_genero = genero.cod_genero
WHERE gestor.email_gestor = ?`;

    db.query(query, [email_gestor], (error, results) => {
        if (error) {
            console.log("Erro ao buscar os dados do gestor:", error);
            return res.status(500).send("Erro ao buscar os dados.");
        }

        if (results.length > 0) {
            const gestor = results[0]; // Pega o primeiro resultado da consulta

            // Renderiza a página e envia os dados do gestor para a view
            res.render("pages/gestao/perfilGestao", {
                nome_gestor: gestor.nome_gestor,
                email_gestor: gestor.email_gestor,
                tel_gestor: gestor.tel_gestor,
                nif: gestor.nif,
                cargo: gestor.cargo,
                genero: gestor.nome_genero
            });
        } else {
            // Caso não encontre o Gestor, redireciona ou exibe uma mensagem de erro
            res.status(404).send("Gestor não encontrado.");
        }
    });
})

//MudarSenha do Gestor
app.get("/mudarSenhaGestao", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    res.render("pages/gestao/mudarSenhaGestao");
});

app.post('/mudarSenhaGestao', (req, res) => {
    const { senhaAtual, nova_senha, confirmacaoSenha } = req.body;
    const email_gestor = req.session.email_user; // Email do gestor armazenado na sessão


    console.log("Requisição para mudar senha recebida");
    if (!email_gestor) {
        console.log("Usuário não autenticado.");
        return res.send("Usuário não autenticado. Faça login novamente.");
    }

    if (nova_senha.trim() !== confirmacaoSenha.trim()) {
        return res.send("A nova senha e a confirmação não coincidem.");
    }


    console.log("Buscando senha atual no banco de dados...");
    const query = 'SELECT senha FROM gestor WHERE email_gestor = ?';
    db.query(query, [email_gestor], (error, results) => {
        if (error) {
            console.log("Erro ao buscar senha no banco de dados:", error);
            return res.send("Erro ao buscar senha no banco de dados");
        }

        if (results.length > 0) {
            const senhaDB = results[0].senha;

            console.log("Senha atual do banco de dados:", senhaDB);

            if (senhaAtual.trim() === senhaDB) {
                console.log("Senha atual validada. Atualizando senha...");

                const queryUpdate = 'UPDATE gestor SET senha = ? WHERE email_gestor = ?';
                db.query(queryUpdate, [nova_senha.trim(), email_gestor], (error) => {
                    if (error) {
                        console.log("Erro ao atualizar a senha:", error);
                        return res.send("Erro ao atualizar a senha");
                    }
                    console.log("Senha atualizada com sucesso!");
                    return res.redirect("/");
                });
            } else {
                return res.send("Senha atual incorreta.");
            }
        } else {
            return res.send("Usuário não encontrado.");
        }
    });
});

//Turmas
app.get('/turma', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }

    const codCurso = req.query.codCurso;
    if (!codCurso) {
        return res.status(400).send("Código do curso não foi fornecido.");
    }

    console.log('cod_curso recebido:', codCurso);

    const query = `
      SELECT turma.nome_turma, turma.cod_turma, curso.nome_curso, curso.tipo_curso, curso.turno
      FROM turma
      JOIN curso ON turma.cod_curso = curso.cod_curso
      WHERE turma.cod_curso = ?
      ORDER BY turma.nome_turma ASC;
    `;

    db.query(query, [codCurso], (error, results) => {
        if (error) {
            console.log("Houve um erro ao procurar as turmas: ", error);
            return res.status(500).send("Erro ao buscar os dados.");
        }

        console.log('Resultados da consulta:', results);

        if (results.length > 0) {
            const turmas = results[0];
            res.render('pages/gestao/turma', {
                turmas: results,
                nome_curso: turmas.nome_curso,
                tipo_curso: turmas.tipo_curso,
                turno: turmas.turno,
                codCurso
            });
        } else {
            res.render('pages/gestao/turma', {
                turmas: [],
                tipo_curso: null,
                turno: null
            });
        }
    });
});


//Cadastros
//CadastroCurso
app.post('/cadastroCurso', (req, res) => {
    const { nome_curso, tipo_curso, turno } = req.body;

    // Validação dos campos
    if (!nome_curso || !tipo_curso || !turno) {
        console.log(nome_curso, tipo_curso, turno);
        return res.status(400).send('Todos os campos devem ser preenchidos corretamente!');
    }


    // Verifica se os valores de tipo_curso e turno são válidos
    if (tipo_curso === 'Selecione o Curso' || turno === 'Selecione o Turno') {
        console.log(nome_curso, tipo_curso, turno);
        return res.status(400).send('Por favor, selecione um curso e um turno válidos!');
    }

    // Se a validação passar, insira o novo curso
    db.query(
        `INSERT INTO curso (nome_curso, tipo_curso, turno) VALUES (?, ?, ?)`,
        [nome_curso, tipo_curso, turno],
        (error, results) => {
            if (error) {
                console.log('Erro ao cadastrar curso:', error);
                return res.status(500).send('Erro ao cadastrar curso');
            } else {
                console.log(`Curso ${nome_curso} cadastrado com sucesso.`);
                res.redirect('/cursos');  
            }
        }
    );
});



app.post('/cadastro1Turma', (req, res) => {
    const { nome_turma, cod_curso } = req.body;
    
    console.log("Nome da turma:", nome_turma);
    console.log("Código do curso:", cod_curso);

    if (!nome_turma || !cod_curso) {
        return res.status(400).send('Todos os campos devem ser preenchidos!');
    }

    db.query(`INSERT INTO turma (nome_turma, cod_curso) VALUES (?, ?)`, [nome_turma, cod_curso], (error, results) => {
        if (error) {
            res.status(500).send('Erro ao cadastrar turma');
            console.log(error);
        } else {
            console.log(`Turma ${nome_turma} cadastrada com sucesso.`);
            return res.redirect(`/cursos`);
        }
    });
});






//CadastroAluno
app.get('/cadastroAluno', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }

    db.query('SELECT * FROM genero', (error, genero) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Erro ao buscar genero');
        }

        db.query('SELECT * FROM curso', (error, cursos) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Erro ao buscar cursos');
            }

            db.query('SELECT * FROM turma', (error, turmas) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send('Erro ao buscar turmas');
                }
                res.render("pages/gestao/cadastroAluno", { cursos, turmas, genero });
            });
        });
    });
});

app.post('/cadastroAluno', (req, res) => {
    const {
        rm, data_nasc, nome_aluno, email_aluno, senha,
        cpf, tel_aluno, nome_resp, email_resp, tel_resp,
        nome_empresa, email_empresa, tel_empresa,
        cod_curso, cod_turma, tipo_aluno, cod_genero
    } = req.body;

    // Verifica se todos os campos obrigatórios estão preenchidos
    if (!rm || !data_nasc || !nome_aluno || !email_aluno || !senha || !cpf || !tel_aluno || !cod_curso || !cod_turma || !cod_genero) {
        return res.render('cadastroAluno', { errorMessage: 'Preencha todos os campos!' });
    }

    // Verifica a idade mínima para iniciar um curso no Senai
    const currentYear = new Date().getFullYear();
    const birthYear = new Date(data_nasc).getFullYear();
    const age = currentYear - birthYear;

    if (age < 14) {
        return res.status(400).send('O aluno deve ter pelo menos 14 anos de idade.');
    }

    // Insere os dados do aluno na tabela aluno
    db.query('INSERT INTO aluno (rm, nome_aluno, cpf, data_nasc, email_aluno, senha, tel_aluno, cod_curso, cod_turma, cod_genero) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [rm, nome_aluno, cpf, data_nasc, email_aluno, senha, tel_aluno, cod_curso, cod_turma, cod_genero],
        (error) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Erro ao cadastrar o aluno.');
            }

            // Verifica o tipo de aluno para inserir os dados do responsável ou da empresa
            if (tipo_aluno === 'responsavel') {
                if (!nome_resp || !email_resp || !tel_resp) {
                    return res.status(400).send('Por favor, preencha os campos do responsável.');
                }

                db.query('INSERT INTO responsavel (nome_resp, email_resp, tel_resp) VALUES (?, ?, ?)', [nome_resp, email_resp, tel_resp], (error, result) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).send('Erro ao cadastrar o responsável.');
                    }

                    const cod_resp = result.insertId;
                    db.query('INSERT INTO inforesp (rm, cod_resp) VALUES (?, ?)', [rm, cod_resp], (error) => {
                        if (error) {
                            console.error(error);
                            return res.status(500).send('Erro ao vincular o responsável ao aluno.');
                        }

                        // Define a mensagem de sucesso e redireciona
                        req.session.successMessage = `Aluno ${nome_aluno} cadastrado com sucesso com responsável.`;
                        return res.redirect('/homeGestao');
                    });
                });
            } else if (tipo_aluno === 'empresa') {
                if (!nome_empresa || !email_empresa || !tel_empresa) {
                    return res.status(400).send('Por favor, preencha os campos da empresa.');
                }

                db.query('SELECT cod_empresa FROM empresa WHERE nome_empresa = ?', [nome_empresa], (error, result) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).send('Erro ao buscar a empresa.');
                    }

                    let cod_empresa;

                    if (result.length > 0) {
                        cod_empresa = result[0].cod_empresa;
                        // Insere os dados de informação de trabalho
                        db.query('INSERT INTO infotrabalho (rm, cod_empresa) VALUES (?, ?)', [rm, cod_empresa], (error) => {
                            if (error) {
                                console.error(error);
                                return res.status(500).send('Erro ao vincular a empresa ao aluno.');
                            }
                            // Define a mensagem de sucesso e redireciona
                            req.session.successMessage = `Aluno ${nome_aluno} cadastrado com sucesso vinculado à empresa.`;
                            return res.redirect('/homeGestao');
                        });
                    } else {
                        db.query('INSERT INTO empresa (nome_empresa, email_empresa, tel_empresa) VALUES (?, ?, ?)', [nome_empresa, email_empresa, tel_empresa], (error, result) => {
                            if (error) {
                                console.error(error);
                                return res.status(500).send('Erro ao cadastrar a empresa.');
                            }

                            cod_empresa = result.insertId;

                            // Insere os dados de informação de trabalho
                            db.query('INSERT INTO infotrabalho (rm, cod_empresa) VALUES (?, ?)', [rm, cod_empresa], (error) => {
                                if (error) {
                                    console.error(error);
                                    return res.status(500).send('Erro ao vincular a empresa ao aluno.');
                                }
                                // Define a mensagem de sucesso e redireciona
                                req.session.successMessage = `Aluno ${nome_aluno} cadastrado com sucesso vinculado à empresa.`;
                                return res.redirect('/homeGestao');
                            });
                        });
                    }
                });
            } else {
                // Define a mensagem de sucesso e redireciona
                req.session.successMessage = `Aluno ${nome_aluno} cadastrado com sucesso.`;
                return res.redirect('/homeGestao');
            }
        }
    );
});


app.get('/turmas/:cursoId', (req, res) => {
    const cursoId = req.params.cursoId;

    db.query('SELECT * FROM turma WHERE cod_curso = ?', [cursoId], (error, results) => {
        if (error) {
            return res.status(500).send('Erro ao buscar turmas');
        }
        res.json(results); // Retorna as turmas como um JSON
    });
});



//CadastroTurma
app.get("/cadastroTurma", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }

    const codCurso = req.query.cod_curso;
    if (!codCurso) {
        return res.status(400).send("Código do curso não foi fornecido.");
    }

    console.log('Código do curso recebido na rota de cadastro de turma:', codCurso);

    res.render('pages/gestao/cadastroTurma', { codCurso });
});

app.post('/cadastroTurma', (req, res) => {
    const { nome_turma, codCurso } = req.body;

    console.log('Nome da turma:', nome_turma);
    console.log('Código do curso:', codCurso);

    db.query(
        'INSERT INTO turma (nome_turma, cod_curso) VALUES (?, ?)',
        [nome_turma, codCurso],
        (error, results) => {
            if (error) {
                console.error('Erro ao cadastrar turma:', error);
                return res.status(500).send('Erro ao cadastrar turma');
            } else { 
                console.log(`Turma ${nome_turma} cadastrada com sucesso no curso ${codCurso}.`);
                res.redirect(`/turma?codCurso=${codCurso}`);
        }
        }
    );
});



//ListaAlunos
app.get("/listaAlunos", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    const cod_turma = req.query.cod_turma;

    console.log("cod_turma:", cod_turma);

    let query = ` SELECT aluno.rm, aluno.nome_aluno, aluno.tel_aluno, turma.nome_turma, 
        COUNT(requisicao.cod_req) AS saidas_count
        FROM aluno 
        INNER JOIN turma ON aluno.cod_turma = turma.cod_turma
        LEFT JOIN requisicao ON aluno.rm = requisicao.rm AND requisicao.cod_turma = aluno.cod_turma`;
    const params = [];

    if (cod_turma) {
        query += ' WHERE aluno.cod_turma = ?'; // Filtrar pela turma
        params.push(cod_turma);
    }

    query += ' GROUP BY aluno.rm';

    db.query(query, params, (error, results) => {
        if (error) {
            console.log("Erro ao buscar alunos", error);
            return res.send("Erro ao buscar alunos");
        }

        res.render("pages/gestao/listaAlunos", { listaAlunos: results, cod_turma }); // Passar a lista de alunos
    });
});


//DetalhesAlunoGestao
app.get("/alunoGestao", (req, res) => {
    const rm_aluno = req.query.rm;

    // Consulta SQL com JOIN para pegar os dados do aluno e suas saídas
    const query = `
        SELECT 
            aluno.rm,
            aluno.nome_aluno,
            aluno.data_nasc,
            aluno.nome_aluno,
            aluno.tel_aluno,
            aluno.cpf,
            aluno.email_aluno,
            aluno.cod_curso,
            curso.nome_curso,         
            turma.nome_turma,       
            responsavel.nome_resp,
            responsavel.email_resp,
            responsavel.tel_resp,
            empresa.nome_empresa,
            empresa.email_empresa,
            empresa.tel_empresa
        FROM 
            aluno
        LEFT JOIN 
            inforesp ON aluno.rm = inforesp.rm
        LEFT JOIN 
            responsavel ON inforesp.cod_resp = responsavel.cod_resp
        LEFT JOIN 
            infotrabalho ON aluno.rm = infotrabalho.rm
        LEFT JOIN 
            empresa ON infotrabalho.cod_empresa = empresa.cod_empresa
        LEFT JOIN 
            curso ON aluno.cod_curso = curso.cod_curso 
        LEFT JOIN 
            turma ON aluno.cod_turma = turma.cod_turma
        WHERE 
            aluno.rm = ?;
    `;

    const querySaida = 'SELECT cod_req, data_saida, hora_saida FROM requisicao WHERE rm = ?';

    db.query(query, [rm_aluno], (error, results) => {
        if (error) {
            console.log("Erro ao buscar os dados do aluno:", error);
            return res.status(500).send("Erro ao buscar os dados.");
        }

        if (results.length > 0) {
            const aluno = results[0]; // Pega o primeiro resultado da consulta

            db.query(querySaida, [rm_aluno], (error, saidaResults) => {
                if (error) {
                    console.log("Erro ao buscar saídas:", error);
                    return res.status(500).send("Erro ao buscar as saídas.");
                }

                const saidas = saidaResults.length > 0 ? saidaResults : [];

            if (aluno.nome_resp) {
                res.render("pages/gestao/alunoMenor", {
                    nome_aluno: aluno.nome_aluno,
                    cod_curso: aluno.cod_curso,
                    cpf: aluno.cpf,
                    rm: aluno.rm,
                    tel_aluno: aluno.tel_aluno,
                    data_nasc: aluno.data_nasc,
                    email_aluno: aluno.email_aluno,
                    nome_curso: aluno.nome_curso,
                    nome_turma: aluno.nome_turma,
                    nome_resp: aluno.nome_resp,
                    email_resp: aluno.email_resp,
                    tel_resp: aluno.tel_resp,
                    saidas: saidas
                });
            } else if (aluno.nome_empresa) {
                res.render("pages/gestao/alunoEmpresa", {
                    nome_aluno: aluno.nome_aluno,
                    cod_curso: aluno.cod_curso,
                    cpf: aluno.cpf,
                    rm: aluno.rm,
                    tel_aluno: aluno.tel_aluno,
                    data_nasc: aluno.data_nasc,
                    email_aluno: aluno.email_aluno,
                    nome_curso: aluno.nome_curso,
                    nome_turma: aluno.nome_turma,
                    nome_empresa: aluno.nome_empresa,
                    email_empresa: aluno.email_empresa,
                    tel_empresa: aluno.tel_empresa,
                    saidas: saidas
                });
            } else {
                res.render("pages/gestao/alunoMaior", {
                    nome_aluno: aluno.nome_aluno,
                    cod_curso: aluno.cod_curso,
                    cpf: aluno.cpf,
                    rm: aluno.rm,
                    tel_aluno: aluno.tel_aluno,
                    data_nasc: aluno.data_nasc,
                    email_aluno: aluno.email_aluno,
                    nome_curso: aluno.nome_curso,
                    nome_turma: aluno.nome_turma,
                    saidas: saidas
                });
            
            }
        });
        } else {
            console.log("Nenhum aluno encontrado para o RM:", rm_aluno);
            res.status(404).send("Aluno não encontrado.");
        }
    
    });
});


app.get('/detalhesSaida/:id', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }

    const cod_historico = req.params.id;
    const tipo_historico = req.query.tipo;

    console.log('Tipo de pendência:', tipo_historico);

    // Verifique se tipo_historico é válido
    if (!tipo_historico || typeof tipo_historico !== 'string' || !['Saída Antecipada', 'Justificativa de Falta', 'Justificativa de Saída'].includes(tipo_historico)) {
        return res.status(400).send('Tipo de pendência inválido.');
    }

    let selectQuery;
    
    // Definir a query baseada no tipo de pendência
    if (tipo_historico === 'Saída Antecipada') {
        selectQuery = `
            SELECT r.cod_req AS cod_historico, a.nome_aluno, r.rm, c.nome_curso, t.nome_turma, r.data_saida, r.hora_saida, r.justificativa
            FROM requisicao r JOIN aluno a ON r.rm = a.rm JOIN curso c ON a.cod_curso = c.cod_curso JOIN turma t ON a.cod_turma = t.cod_turma
            WHERE r.cod_req = ?
        `;
    } else if (tipo_historico === 'Justificativa de Falta') {
        selectQuery = `
            SELECT f.cod_falta AS cod_historico, a.nome_aluno, f.rm, c.nome_curso, t.nome_turma, f.data_emissao AS data_saida, f.data_inicio, f.data_termino, f.observacao AS justificativa
            FROM justfalta f JOIN aluno a ON f.rm = a.rm JOIN curso c ON a.cod_curso = c.cod_curso JOIN turma t ON a.cod_turma = t.cod_turma
            WHERE f.cod_falta = ?
        `;
    } else if (tipo_historico === 'Justificativa de Saída') {
        selectQuery = `
            SELECT j.cod_saida AS cod_historico, a.nome_aluno, r.rm, c.nome_curso, t.nome_turma, r.data_saida, r.hora_saida, j.observacao AS justificativa
            FROM justsaida j
            JOIN requisicao r ON r.cod_req = j.cod_req
            JOIN aluno a ON r.rm = a.rm
            JOIN curso c ON a.cod_curso = c.cod_curso
            JOIN turma t ON a.cod_turma = t.cod_turma
            WHERE j.cod_saida = ?
        `;
    }

    // Executar a consulta ao banco de dados
    db.query(selectQuery, [cod_historico], (err, results) => {
        if (err) {
            console.error('Erro ao buscar pendência:', err);
            return res.status(500).send('Erro ao buscar pendência.');
        }

        if (results.length === 0) {
            return res.status(404).send('Nenhuma pendência encontrada.');
        }

        // Renderizar a página com os dados da pendência
        const historico = results[0];
        res.render('pages/gestao/detalhesSaida', { historico, tipo_historico });
    });
});

//Pesquisar
app.get('/pesquisar', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    const query = req.query.query || '';
    console.log('Consulta:', query);  // Verifique o valor da consulta

    const sqlAlunos = `SELECT aluno.rm, aluno.nome_aluno, aluno.tel_aluno, 
        COUNT(requisicao.cod_req) AS saidas_count 
        FROM aluno
        LEFT JOIN requisicao ON aluno.rm = requisicao.rm
        WHERE nome_aluno LIKE ?`;
    const sqlCursos = 'SELECT * FROM curso WHERE nome_curso LIKE ?';
    const sqlSituacao = 'COUNT (requisicao.cod_req) as saidas_count';

    db.query(sqlAlunos, [`%${query}%`], (err, alunos) => {
        if (err) throw err;

        db.query(sqlCursos, [`%${query}%`], (err, cursos) => {
            if (err) throw err;

            console.log('Alunos:', alunos);
            console.log('Cursos:', cursos);

            res.render("pages/gestao/pesquisaGestao", {
                query: query,
                alunos: alunos,
                cursos: cursos
            });
        });
    });
});

app.post('/pesquisaGestao', (req, res) => {
    const query = req.body.query.trim();

    if (!query) {
        return res.redirect('/pesquisaGestao?mensagem=O campo de pesquisa não pode estar vazio.');
    } else { res.redirect(`/pesquisaGestao?query=${encodeURIComponent(query)}`); }

});


//Sair do perfil
app.get('/sair', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Erro ao encerrar sessão:", err);
            return res.status(500).send("Erro ao encerrar sessão.");
        }
        res.redirect('/');
    });
});


// Sessão expirada
