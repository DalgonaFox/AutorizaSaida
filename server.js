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

const port = process.env.PORT || 3001;


const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

const db = mysql.createPool({
host: process.env.DB_HOST,
user: process.env.DB_USERNAME,
password: process.env.DB_PASSWORD,
database: process.env.DB_DBNAME,
waitForConnections: true,
connectionLimit: 10,
queueLimit: 0
});

// Pasta public
app.use(express.static(__dirname + '/public'));

// Pasta views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

// Manutenção
app.get("/manutencao", (req, res) => {
    res.render("manutencao");
});

// Login
app.get("/", (req, res) => {
    res.render("index", { errorMessage: null, successMessage: null, sendMessage: null });
}); // oi milena


// Esqueceu a senha
app.post("/esquecerSenha", (req, res) => {
    console.log('Requisição de recuperação de senha recebida');
    const userMail = req.body.email;

    const query = `
        SELECT 'aluno' AS ident FROM aluno WHERE email_aluno = ?
        UNION
        SELECT 'gestor' AS ident FROM gestor WHERE email_gestor = ?;
    `;

    db.query(query, [userMail, userMail], (error, results) => {
        if (error) {
            console.log("Erro ao executar a consulta no banco de dados:", error);
        }

        if (results.length === 0 || results[0].ident == null) {
            console.log("E-mail não cadastrado");
            return res.render('index', { errorMessage: 'Coloque um email válido!', successMessage: null, sendMessage: null });
        } else {
            const ident = results[0].ident;
            const tabela = ident === 'aluno' ? 'aluno' : 'gestor';
            const campoEmail = ident === 'aluno' ? 'email_aluno' : 'email_gestor';

            const transport = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'autorizasaida@gmail.com',
                    pass: 'abuusatljbqjvcpw',
                }
            });
            console.log('Transporte de e-mail criado');

            function gerarPassword() {
                return Math.random().toString(36).slice(-8);
            }
            let novaSenha = gerarPassword();

            const updateQuery = `
                UPDATE ${tabela} SET senha = ?, primeiro_acesso = true WHERE ${campoEmail} = ?
            `;

            db.query(updateQuery, [novaSenha, userMail], (updateError, updateResult) => {
                if (updateError) {
                    console.log("Erro ao atualizar senha:", updateError);
                } else {
                    transport.sendMail({
                        from: 'Autoriza Saída <autorizasaida@gmail.com>',
                        to: userMail,
                        subject: 'Recuperar a senha',
                        html: `<p>Olá, você pediu para recuperar a senha da sua conta. Aqui está a sua nova senha: ${novaSenha}</p>`,
                        text: `Olá, você pediu para recuperar a senha da sua conta. Aqui está a sua nova senha: ${novaSenha}`
                    }, (err, info) => {
                        if (err) {
                            console.log('Erro ao enviar e-mail:', err);
                        } else {
                            console.log('E-mail enviado com sucesso');
                            return res.render('index', { errorMessage: null, successMessage: 'E-mail enviado com sucesso!', sendMessage: null });
                        }
                    });
                }
            });
        }
    });
});

//Login
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
                return res.render('index', { errorMessage: 'Senha incorreta. Tente novamente.', successMessage: null });
            }
        } else {
            return res.render('index', { errorMessage: 'Aluno não cadastrado.', successMessage: null, sendMessage: null });
        }
    });
});


// Aluno

// PrimeiroAcessoAluno
app.get("/primeiroAcesso", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    res.render("pages/aluno/primeiroAcesso", { senhaMessage: null });
});

app.post('/primeiroAcesso', (req, res) => {
    const { senhaAtual, nova_senha, confirmacaoSenha } = req.body;
    const email_aluno = req.session.email_user;

    if (!req.session.email_user) {
        return res.redirect('/');
    }

    if (nova_senha.trim() !== confirmacaoSenha.trim()) {
        return res.render("pages/aluno/primeiroAcesso", { senhaMessage: "A nova senha e a confirmação não coincidem." });
    }

    const query = 'SELECT senha FROM aluno WHERE email_aluno = ?';
    db.query(query, [email_aluno], (error, results) => {
        if (error) {
            console.log("Erro ao buscar senha no banco de dados:", error);
            return res.render("pages/aluno/primeiroAcesso", { senhaMessage: "Erro ao buscar senha no banco de dados." });
        }

        if (results.length > 0) {
            const senhaDB = results[0].senha;

            if (senhaAtual.trim() === senhaDB) {
                const queryUpdate = 'UPDATE aluno SET senha = ?, primeiro_acesso = false WHERE email_aluno = ?';
                db.query(queryUpdate, [nova_senha.trim(), email_aluno], (error) => {
                    if (error) {
                        console.log("Erro ao atualizar a senha:", error);
                        return res.render("pages/aluno/primeiroAcesso", { senhaMessage: "Erro ao atualizar a senha." });
                    }
                    req.session.sendMessage = 'Senha atualizada com sucesso!';
                    return res.redirect('/homeAluno');
                });
            } else {
                return res.render("pages/aluno/primeiroAcesso", { senhaMessage: "Senha atual incorreta." });
            }
        } else {
            return res.render("pages/aluno/primeiroAcesso", { senhaMessage: "Usuário não encontrado." });
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
                        const sendMessage = req.session.sendMessage || null;
                        req.session.sendMessage = null;
                        res.render("pages/aluno/homeAluno", { nome_aluno, totalSaidas, saidasInjustificadas, genero, sendMessage });
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
app.get('/historicoAluno', async (req, res) => {
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
            res.status(500).send('Erro ao buscar o histórico.');
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

    if (!tipo_historico || !['Saída Antecipada', 'Justificativa de Falta', 'Justificativa de Saída'].includes(tipo_historico)) {
        return res.status(400).send('Tipo de pendência inválido.');
    }

    let selectQuery;

    if (tipo_historico === 'Saída Antecipada') {
        selectQuery = `
            SELECT r.cod_req AS cod_historico, a.nome_aluno, r.rm, c.nome_curso, t.nome_turma, r.data_saida, r.hora_saida, r.justificativa
            FROM requisicao r
            JOIN aluno a ON r.rm = a.rm
            JOIN curso c ON a.cod_curso = c.cod_curso
            JOIN turma t ON a.cod_turma = t.cod_turma
            WHERE r.cod_req = ?
        `;
    } else if (tipo_historico === 'Justificativa de Falta') {
        selectQuery = `
            SELECT f.cod_falta AS cod_historico, a.nome_aluno, f.rm, c.nome_curso, t.nome_turma, f.data_emissao AS data_saida, f.data_inicio, f.data_termino, f.observacao AS justificativa
            FROM justfalta f
            JOIN aluno a ON f.rm = a.rm
            JOIN curso c ON a.cod_curso = c.cod_curso
            JOIN turma t ON a.cod_turma = t.cod_turma
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

    db.query(selectQuery, [cod_historico], (err, results) => {
        if (err) {
            console.error('Erro ao buscar pendência:', err);
            return res.status(500).send('Erro ao buscar pendência.');
        }

        if (results.length === 0) {
            return res.status(404).send('Nenhuma pendência encontrada.');
        }

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

app.get('/uploadSaida', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    };
});

app.post('/uploadSaida', upload.single('arquivo'), (req, res) => {
    const formType = req.body.formType;
    const observacao = req.body.observacoes;
    const cod_req = req.body.cod_req;
    const rm = req.session.rm;
    const ciencia_gestor = 0;

    if (!req.file) {
        return res.status(400).send('Nenhum arquivo enviado.');
    }

    const arquivoPath = req.file.path;

    const queryDataSaida = 'SELECT data_saida FROM requisicao WHERE cod_req = ?';
    db.query(queryDataSaida, [cod_req], (err, results) => {
        if (err) {
            console.error('Erro ao buscar a data de saída:', err);
            return res.status(500).send('Erro ao buscar a data de saída.');
        }

        if (results.length === 0) {
            return res.render('/uploadSaida', { successMessage: 'Erro ao processar formulário, ou arquivo muito pesado' });
        }

        const data_envio = results[0].data_saida;

        fs.readFile(arquivoPath, (err, arquivoBuffer) => {
            if (err) {
                console.error('Erro ao ler o arquivo:', err);
                return res.status(500).send('Erro ao ler o arquivo.');
            }

            const values = [cod_req, rm, observacao, arquivoBuffer, ciencia_gestor, data_envio];
            const sql = 'INSERT INTO justsaida (cod_req, rm, observacao, arquivo, ciencia_gestor, data_envio) VALUES (?, ?, ?, ?, ?, ?)';


            db.query(sql, values, (err, results) => {
                if (err) {
                    console.error('Erro ao inserir dados no banco:', err);
                    res.status(500).send('Erro ao processar o formulário.');
                } else {
                    console.log('Formulário enviado com sucesso!');
                    req.session.sendMessage = 'Formulário enviado com sucesso!';
                    return res.redirect('/homeAluno');
                }
            });
        });
    });
});

//JustificarFaltaAluno
app.get('/justificarFaltaAluno', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    const rm = req.session.rm;
    const queryAluno = `SELECT cod_turma FROM aluno WHERE rm = ?`;
    const dataObj = new Date();
    const data_envio = `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}-${String(dataObj.getDate()).padStart(2, '0')}`;

    db.query(queryAluno, [rm], (error, results) => {
        if (results.length > 0) {
            const aluno = results[0];
            console.log('Código da turma recuperado!');
            res.render("pages/aluno/justificarFaltaAluno", { cod_turma: aluno.cod_turma, data_envio });
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
    const data_envio = req.body.data_envio;

    console.log('Dados recebidos do formulário:', {
        formType, observacao, rm, data_emissao, data_inicio, data_termino, cod_turma, ciencia_gestor, data_envio
    });

    if (!req.file) {
        console.error('Nenhum arquivo enviado.');
        return res.status(400).send('Nenhum arquivo enviado.');
    }

    const arquivoPath = req.file.path;
    console.log('Arquivo salvo temporariamente em:', arquivoPath);

    fs.readFile(arquivoPath, (err, arquivoBuffer) => {
        if (err) {
            console.error('Erro ao ler o arquivo:', err);
            return res.status(500).send('Erro ao ler o arquivo.');
        }

        const values = [rm, cod_turma, data_emissao, data_inicio, data_termino, observacao, arquivoBuffer, ciencia_gestor, data_envio];
        const sql = 'INSERT INTO justfalta (rm, cod_turma, data_emissao, data_inicio, data_termino, observacao, arquivo, ciencia_gestor, data_envio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

        console.log('Preparando para inserir dados no banco de dados:', values);

        db.query(sql, values, (err, results) => {
            console.error('Erro ao inserir dados no banco:', err)
            if (err) {
                console.error('Erro ao inserir dados no banco:', err);
                res.status(500).send('Erro ao processar o formulário.');
            } else {
                console.log('Formulário enviado com sucesso! Resultados:', results);

                fs.unlink(arquivoPath, (err) => {
                    if (err) console.error('Erro ao excluir o arquivo temporário:', err);
                    else console.log('Arquivo temporário excluído com sucesso.');
                });
                req.session.sendMessage = 'Formulário enviado com sucesso!';
                return res.redirect('/homeAluno');
            }
        });
    });
});



//RequisicãoSaida
app.post('/requisicao', (req, res) => {
    const rm = req.session.rm;
    const cod_turma = req.body.cod_turma;
    const data_saida = req.body.data_saida;
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
            req.session.sendMessage = 'Formulário enviado com sucesso! Você receberá um e-mail quando sua saída for autorizada.'
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

    const dataObj = new Date();
    const data_saida = `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}-${String(dataObj.getDate()).padStart(2, '0')}`;

    db.query(queryAluno, [rm], (error, results) => {
        if (error) {
            console.error('Erro ao recuperar o código da turma:', error);
            return res.status(500).send('Erro ao recuperar o código da turma.');
        }

        if (results.length > 0) {
            const aluno = results[0];
            console.log('Código da turma recuperado!');
            res.render("pages/aluno/requisicaoAluno", { cod_turma: aluno.cod_turma, data_saida });
            console.log(data_saida);
        } else {
            console.error('Nenhum resultado encontrado para o código da turma.');
            res.status(404).send('Nenhum código de turma encontrado para o aluno.');
        }
    });
});


// MudarSenha do Aluno
app.get("/mudarSenhaAluno", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    res.render("pages/aluno/mudarSenhaAluno", { senhaMessage: null });
});

app.post('/mudarSenhaAluno', (req, res) => {
    const { senhaAtual, nova_senha, confirmacaoSenha } = req.body;
    const email_aluno = req.session.email_user;

    if (!req.session.email_user) {
        return res.redirect('/');
    }

    if (nova_senha.trim() !== confirmacaoSenha.trim()) {
        return res.render("pages/aluno/mudarSenhaAluno", { senhaMessage: "A nova senha e a confirmação não coincidem." });
    }

    const query = 'SELECT senha FROM aluno WHERE email_aluno = ?';
    db.query(query, [email_aluno], (error, results) => {
        if (error) {
            console.log("Erro ao buscar senha no banco de dados:", error);
            return res.render("pages/aluno/mudarSenhaAluno", { senhaMessage: "Erro ao buscar senha no banco de dados." });
        }

        if (results.length > 0) {
            const senhaDB = results[0].senha;

            if (senhaAtual.trim() === senhaDB) {
                const queryUpdate = 'UPDATE aluno SET senha = ? WHERE email_aluno = ?';
                db.query(queryUpdate, [nova_senha.trim(), email_aluno], (error) => {
                    if (error) {
                        console.log("Erro ao atualizar a senha:", error);
                        return res.render("pages/aluno/mudarSenhaAluno", { senhaMessage: "Erro ao atualizar a senha." });
                    }
                    req.session.sendMessage = 'Senha atualizada com sucesso!';
                    return res.redirect('/homeAluno');
                });
            } else {
                return res.render("pages/aluno/mudarSenhaAluno", { senhaMessage: "Senha atual incorreta." });
            }
        } else {
            return res.render("pages/aluno/mudarSenhaAluno", { senhaMessage: "Usuário não encontrado." });
        }
    });
});

// Gestao

//PrimeiroAcessoGestao
app.get("/primeiroacessoGestao", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    res.render("pages/gestao/primeiroacessoGestao", { senhaMessage: null });
});

app.post('/primeiroacessoGestao', (req, res) => {
    const { senhaAtual, nova_senha, confirmacaoSenha } = req.body;
    const email_gestor = req.session.email_user;

    if (!req.session.email_user) {
        return res.redirect('/');
    }

    if (nova_senha.trim() !== confirmacaoSenha.trim()) {
        return res.render("pages/aluno/primeiroacessoGestao", { senhaMessage: "A nova senha e a confirmação não coincidem." });
    }

    const query = 'SELECT senha FROM gestor WHERE email_gestor = ?';
    db.query(query, [email_gestor], (error, results) => {
        if (error) {
            console.log("Erro ao buscar senha no banco de dados:", error);
            return res.render("pages/aluno/primeiroacessoGestao", { senhaMessage: "Erro ao buscar senha no banco de dados." });
        }

        if (results.length > 0) {
            const senhaDB = results[0].senha;

            if (senhaAtual.trim() === senhaDB) {
                const queryUpdate = 'UPDATE gestor SET senha = ?, primeiro_acesso = false WHERE email_gestor = ?';
                db.query(queryUpdate, [nova_senha.trim(), email_gestor], (error) => {
                    if (error) {
                        console.log("Erro ao atualizar a senha:", error);
                        return res.render("pages/aluno/primeiroacessoGestao", { senhaMessage: "Erro ao atualizar a senha." });
                    }
                    req.session.sendMessage = 'Senha atualizada com sucesso!';
                    return res.redirect('/homeGestao');
                });
            } else {
                return res.render("pages/aluno/primeiroacessoGestao", { senhaMessage: "Senha atual incorreta." });
            }
        } else {
            return res.render("pages/aluno/primeiroacessoGestao", { senhaMessage: "Usuário não encontrado." });
        }
    });
});

// Navbar
//HomeGestao
app.get("/homeGestao", async (req, res) => {
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
                        const successMessage = req.session.successMessage || null;
                        req.session.successMessage = null;
                        const sendMessage = req.session.sendMessage || null;
                        req.session.sendMessage = null;

                        res.render("pages/gestao/homeGestao", { nome_gestao, totalPendencias, genero, successMessage, sendMessage, total });
                        console.log("Gênero:", genero);
                    }
                })


            }
        });
    });
});


//HistoricoGestao
app.get('/historicoGestao', async (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    const rm = req.session.rm;
    try {
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

        if (whereConditions.length > 0) {
            historicoQuery += " AND (" + whereConditions.join(" OR ") + ")";
        }

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

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).send('Erro ao buscar histórico.');
    }
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

app.get("/periodoano", (req, res) => {
    const query = `
        SELECT 
            MONTH(data_saida) AS mes,
            COUNT(cod_req) AS totalSaidas
        FROM 
            requisicao
        WHERE 
            YEAR(data_saida) = YEAR(CURDATE()) AND ciencia_gestor = 1
        GROUP BY 
            MONTH(data_saida)
        ORDER BY 
            mes;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Erro ao buscar saídas por mês:", err);
            return res.status(500).json({ error: "Erro ao buscar saídas por mês" });
        }

        const data = {
            labels: Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' })), // Labels com nomes dos meses
            valores: Array(12).fill(0)
        };

        results.forEach(row => {
            data.valores[row.mes - 1] = row.totalSaidas;
        });

        res.json(data);
    });
});



app.get("/saidasaluno", (req, res) => {
    const rm = req.session.rm;
    const totalQuery = `
        SELECT
            15 AS total,
            COUNT(CASE WHEN ciencia_gestor = 1 THEN 1 END) AS saidasRealizadas,
            15 - COUNT(CASE WHEN ciencia_gestor = 1 THEN 1 END) AS saidasRestantes
        FROM requisicao
        WHERE rm = ?;
    `;


    db.query(totalQuery, rm, (err, results) => {
        if (err) {
            console.error('Erro ao buscar saídas:', err);
            return res.status(500).json({ error: 'Erro ao buscar saídas' });
        } else {
            console.log(results)
        }
        const data = {
            total: results[0].total,
            saidasRestantes: results[0].saidasRestantes,
            saidasRealizadas: results[0].saidasRealizadas
        };
        res.json(data);
    });
});

app.get("/saidascai", (req, res) => {
    const totalQuery = `
        SELECT 
            curso.nome_curso AS nomeCurso,
            COUNT(requisicao.cod_req) AS totalSaidas,
            ROW_NUMBER() OVER (ORDER BY COUNT(requisicao.cod_req) DESC) AS ranking
        FROM 
            requisicao
        JOIN 
            aluno ON requisicao.rm = aluno.rm
        JOIN 
            curso ON aluno.cod_curso = curso.cod_curso
        WHERE 
            curso.tipo_curso = 'CAI'
        GROUP BY 
            curso.nome_curso
        ORDER BY 
            totalSaidas DESC
        LIMIT 5;
    `;

    db.query(totalQuery, (err, results) => {
        if (err) {
            console.error('Erro ao buscar saídas:', err);
            return res.status(500).json({ error: 'Erro ao buscar saídas' });
        } else {
            console.log(results);
        }

        const data = {
            labels: results.map(row => row.nomeCurso),
            valores: results.map(row => row.totalSaidas),
        };

        res.json(data);
    });
});

app.get("/saidasfic", (req, res) => {
    const totalQuery = `
        SELECT 
            curso.nome_curso AS nomeCurso,
            COUNT(requisicao.cod_req) AS totalSaidas,
            ROW_NUMBER() OVER (ORDER BY COUNT(requisicao.cod_req) DESC) AS ranking
        FROM 
            requisicao
        JOIN 
            aluno ON requisicao.rm = aluno.rm
        JOIN 
            curso ON aluno.cod_curso = curso.cod_curso
        WHERE 
            curso.tipo_curso = 'FIC'
        GROUP BY 
            curso.nome_curso
        ORDER BY 
            totalSaidas DESC
        LIMIT 5;
    `;

    db.query(totalQuery, (err, results) => {
        if (err) {
            console.error('Erro ao buscar saídas:', err);
            return res.status(500).json({ error: 'Erro ao buscar saídas' });
        } else {
            console.log(results);
        }

        const data = {
            labels: results.map(row => row.nomeCurso),
            valores: results.map(row => row.totalSaidas),
        };

        res.json(data);
    });
});

app.get("/saidastecnico", (req, res) => {
    const totalQuery = `
        SELECT 
            curso.nome_curso AS nomeCurso,
            COUNT(requisicao.cod_req) AS totalSaidas,
            ROW_NUMBER() OVER (ORDER BY COUNT(requisicao.cod_req) DESC) AS ranking
        FROM 
            requisicao
        JOIN 
            aluno ON requisicao.rm = aluno.rm
        JOIN 
            curso ON aluno.cod_curso = curso.cod_curso
        WHERE 
            curso.tipo_curso = 'Técnico'
        GROUP BY 
            curso.nome_curso
        ORDER BY 
            totalSaidas DESC
        LIMIT 5;
    `;

    db.query(totalQuery, (err, results) => {
        if (err) {
            console.error('Erro ao buscar saídas:', err);
            return res.status(500).json({ error: 'Erro ao buscar saídas' });
        } else {
            console.log(results);
        }

        const data = {
            labels: results.map(row => row.nomeCurso),
            valores: results.map(row => row.totalSaidas),
        };

        res.json(data);
    });
});


//Pendentes
app.get('/pendentes', async (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    try {
        const { ordenar, justificativa } = req.query;

        console.log("Parâmetros recebidos:", { ordenar, justificativa });

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

        db.query(pendenciasQuery, (err, results) => {
            if (err) {
                console.error('Erro ao buscar pendências:', err);
                return res.status(500).send('Erro ao buscar pendências.');
            }

            const totalPendencias = results.length;

            res.render('pages/gestao/pendentes', { pendencias: results, totalPendencias });
        });

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).send('Erro ao buscar pendências.');
    }
});


// Autorização da pendência
app.get('/autorizaPendencia/:id', (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }

    const cod_pendencia = req.params.id;
    const tipo_pendencia = req.query.tipo;

    console.log('Tipo de pendência:', tipo_pendencia);

    if (!tipo_pendencia || !['Saída Antecipada', 'Justificativa de Falta', 'Justificativa de Saída'].includes(tipo_pendencia)) {
        return res.status(400).send('Tipo de pendência inválido.');
    }

    let selectQuery;

    if (tipo_pendencia === 'Saída Antecipada') {
        selectQuery = `
            SELECT r.cod_req AS cod_pendencia, a.nome_aluno, a.email_aluno as email, a.cod_genero, r.rm, c.nome_curso, t.nome_turma, r.data_saida, r.hora_saida, r.justificativa
            FROM requisicao r JOIN aluno a ON r.rm = a.rm JOIN curso c ON a.cod_curso = c.cod_curso JOIN turma t ON a.cod_turma = t.cod_turma
            WHERE r.cod_req = ?
        `;
    } else if (tipo_pendencia === 'Justificativa de Falta') {
        selectQuery = `
            SELECT f.cod_falta AS cod_pendencia, a.nome_aluno, a.email_aluno as email, a.cod_genero, f.rm, c.nome_curso, t.nome_turma, f.data_emissao AS data_saida, f.data_inicio as hora_saida, f.data_termino, f.observacao AS justificativa
            FROM justfalta f JOIN aluno a ON f.rm = a.rm JOIN curso c ON a.cod_curso = c.cod_curso JOIN turma t ON a.cod_turma = t.cod_turma
            WHERE f.cod_falta = ?
        `;
    } else if (tipo_pendencia === 'Justificativa de Saída') {
        selectQuery = `
            SELECT j.cod_saida AS cod_pendencia, a.nome_aluno, a.email_aluno as email, a.cod_genero, r.rm, c.nome_curso, t.nome_turma, r.data_saida, r.hora_saida, j.observacao AS justificativa
            FROM justsaida j
            JOIN requisicao r ON r.cod_req = j.cod_req
            JOIN aluno a ON r.rm = a.rm
            JOIN curso c ON a.cod_curso = c.cod_curso
            JOIN turma t ON a.cod_turma = t.cod_turma
            WHERE j.cod_saida = ?
        `;
    }

    db.query(selectQuery, [cod_pendencia], (err, results) => {
        if (err) {
            console.error('Erro ao buscar pendência:', err);
            return res.status(500).send('Erro ao buscar pendência.');
        }

        if (results.length === 0) {
            return res.status(404).send('Nenhuma pendência encontrada.');
        }

        const pendencia = results[0];
        console.log('Nome do aluno:', pendencia.nome_aluno);
        res.render('pages/gestao/autorizaSaida', { pendencia, tipo_pendencia, email: pendencia.email, nome: pendencia.nome_aluno, genero: pendencia.cod_genero, data: pendencia.data_saida, hora: pendencia.hora_saida });
    });
});


app.post('/autorizar-saida/:id', (req, res) => {
    const cod_pendencia = req.params.id;
    const tipo_pendencia = req.query.tipo;
    const email = req.body.email;
    const nome = req.body.nome;
    const genero = req.body.genero;

    if (!tipo_pendencia || !['Saída Antecipada', 'Justificativa de Falta', 'Justificativa de Saída'].includes(tipo_pendencia)) {
        return res.status(400).send('Tipo de pendência inválido.');
    }

    if (!email) {
        return res.send('e-mail não encontrado.');
    }
    if (!nome) {
        return res.send('nome não encontrado.');
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
        } else if (tipo_pendencia === 'Saída Antecipada') {
            let data = req.body.data;
            let hora = req.body.hora;

            if (!data) {
                return res.status(400).send('Data não encontrada.');
            }
            if (!hora) {
                return res.status(400).send('Hora não encontrada.');
            }

            let pronome;
            if (genero === '2') {
                pronome = "A aluna";
            } else {
                pronome = "O aluno";
            }

            const [year, month, day] = data.split('-');
            data = `${day}/${month}/${year}`;

            hora = hora.slice(0, 5);

            const transport = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'autorizasaida@gmail.com',
                    pass: 'abuusatljbqjvcpw',
                }
            });

            transport.sendMail({
                from: 'Autoriza Saída <autorizasaida@gmail.com>',
                to: email,
                subject: 'Saída Autorizada',
                html: `<p>${pronome} ${nome} tem autorização para sair antecipadamente na data ${data} às ${hora} horas.</p>`,
                text: `${pronome} ${nome} tem autorização para sair antecipadamente na data ${data} às ${hora} horas.`
            }, (err, info) => {
                if (err) {
                    console.error('Erro ao enviar e-mail:', err);
                    return res.status(500).send('Erro ao enviar e-mail.');
                } else {
                    console.log('E-mail enviado!');
                    res.redirect('/pendentes');
                }
            });
        } else {
            res.redirect('/pendentes');
        }
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
            const codCurso = results.length > 0 ? results[0].codCurso : null;
            res.render('pages/gestao/cursos', { cursos: results, codCurso });
        }
    })
});

//PerfilGestao
app.get("/perfilGestao", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    const email_gestor = req.session.email_user;

    if (!email_gestor) {
        return res.redirect('/');
    }

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
            const gestor = results[0];

            res.render("pages/gestao/perfilGestao", {
                nome_gestor: gestor.nome_gestor,
                email_gestor: gestor.email_gestor,
                tel_gestor: gestor.tel_gestor,
                nif: gestor.nif,
                cargo: gestor.cargo,
                genero: gestor.nome_genero
            });
        } else {
            res.status(404).send("Gestor não encontrado.");
        }
    });
})

//MudarSenha do Gestor
app.get("/mudarSenhaGestao", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    res.render("pages/gestao/mudarSenhaGestao", { senhaMessage: null });
});

app.post('/mudarSenhaGestao', (req, res) => {
    const { senhaAtual, nova_senha, confirmacaoSenha } = req.body;
    const email_gestor = req.session.email_user;
    if (!req.session.email_user) {
        return res.redirect('/');
    }

    if (nova_senha.trim() !== confirmacaoSenha.trim()) {
        return res.render("pages/gestao/mudarSenhaGestao", { senhaMessage: "A nova senha e a confirmação não coincidem." });
    }

    const query = 'SELECT senha FROM gestor WHERE email_gestor = ?';
    db.query(query, [email_gestor], (error, results) => {
        if (error) {
            console.log("Erro ao buscar senha no banco de dados:", error);
            return res.render("pages/gestao/mudarSenhaGestao", { senhaMessage: "Erro ao buscar senha no banco de dados." });
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
                        return res.render("pages/gestao/mudarSenhaGestao", { senhaMessage: "Erro ao atualizar a senha." });
                    }
                    req.session.sendMessage = 'Senha atualizada com sucesso!';
                    return res.redirect('/homeGestao');
                });
            } else {
                return res.render("pages/gestao/mudarSenhaGestao", { senhaMessage: "Senha atual incorreta." });
            }
        } else {
            return res.render("pages/gestao/mudarSenhaGestao", { senhaMessage: "Usuário não encontrado." });
        }
    });
});

// Turmas
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
      SELECT turma.nome_turma as nome_turma, turma.cod_turma, curso.nome_curso, curso.tipo_curso, curso.turno
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

        res.render('pages/gestao/turma', {
            turmas: results,
            codCurso: codCurso,
            nome_curso: results.length > 0 ? results[0].nome_curso : null,
            tipo_curso: results.length > 0 ? results[0].tipo_curso : null,
            turno: results.length > 0 ? results[0].turno : null
        });
    });
});



//Cadastros
//CadastroCurso
app.post('/cadastroCurso', (req, res) => {
    const { nome_curso, tipo_curso, turno } = req.body;

    if (!nome_curso || !tipo_curso || !turno) {
        console.log(nome_curso, tipo_curso, turno);
        return res.status(400).send('Todos os campos devem ser preenchidos corretamente!');
    }

    if (tipo_curso === 'Selecione o Curso' || turno === 'Selecione o Turno') {
        console.log(nome_curso, tipo_curso, turno);
        return res.status(400).send('Por favor, selecione um curso e um turno válidos!');
    }

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

app.post('/excluirCurso', (req, res) => {
    const { codCurso } = req.body;
    console.log('codCurso:', codCurso);

    const excluirJustFalta = `
        DELETE FROM justfalta
        WHERE rm IN (SELECT rm FROM aluno WHERE cod_curso = ?);
    `;

    const excluirJustSaida = `
        DELETE FROM justsaida
        WHERE rm IN (SELECT rm FROM aluno WHERE cod_curso = ?);
    `;

    const excluirRequisicao = `
        DELETE FROM requisicao
        WHERE rm IN (SELECT rm FROM aluno WHERE cod_curso = ?);
    `;

    const excluirInfoResp = `
        DELETE FROM inforesp
        WHERE rm IN (SELECT rm FROM aluno WHERE cod_curso = ?);
    `;

    const excluirInfoEmpresa = `
        DELETE FROM infotrabalho
        WHERE rm IN (SELECT rm FROM aluno WHERE cod_curso = ?);
    `;

    const excluirAluno = `
        DELETE FROM aluno
        WHERE cod_curso = ?;
    `;

    const excluirTurma = `
        DELETE FROM turma WHERE cod_curso = ?;
    `;

    const excluirCurso = `
        DELETE FROM curso WHERE cod_curso = ?;
    `;

    db.query(excluirJustFalta, [codCurso], (error, results) => {
        if (error) {
            console.log('Erro ao excluir justificativas de falta:', error);
            return res.status(500).send('Erro ao excluir justificativas de falta');
        }
        console.log('Justificativas de falta excluídas com sucesso.');

        db.query(excluirJustSaida, [codCurso], (error, results) => {
            if (error) {
                console.log('Erro ao excluir justificativas de saída:', error);
                return res.status(500).send('Erro ao excluir justificativas de saída');
            }
            console.log('Justificativas de saída excluídas com sucesso.');

            db.query(excluirRequisicao, [codCurso], (error, results) => {
                if (error) {
                    console.log('Erro ao excluir requisições:', error);
                    return res.status(500).send('Erro ao excluir requisições');
                }
                console.log('Requisições excluídas com sucesso.');

                db.query(excluirInfoResp, [codCurso], (error, results) => {
                    if (error) {
                        console.log('Erro ao excluir dados do responsável:', error);
                        return res.status(500).send('Erro ao excluir dados do responsável');
                    }
                    console.log('Dados do responsável excluídos com sucesso.');

                    db.query(excluirInfoEmpresa, [codCurso], (error, results) => {
                        if (error) {
                            console.log('Erro ao excluir dados da empresa:', error);
                            return res.status(500).send('Erro ao excluir dados da empresa');
                        }
                        console.log('Dados da empresa excluídos com sucesso.');

                        db.query(excluirAluno, [codCurso], (error, results) => {
                            if (error) {
                                console.log('Erro ao excluir aluno:', error);
                                return res.status(500).send('Erro ao excluir aluno');
                            }
                            console.log('Alunos excluídos com sucesso.');

                            db.query(excluirTurma, [codCurso], (error, results) => {
                                if (error) {
                                    console.log('Erro ao excluir turma:', error);
                                    return res.status(500).send('Erro ao excluir turma');
                                }
                                console.log('Turmas excluídas com sucesso.');

                                db.query(excluirCurso, [codCurso], (error, results) => {
                                    if (error) {
                                        console.log('Erro ao excluir curso:', error);
                                        return res.status(500).send('Erro ao excluir curso');
                                    }
                                    console.log('Curso excluído com sucesso.');
                                    res.redirect('/cursos');
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});



app.post('/excluirTurmas', (req, res) => {
    const { cod_turma } = req.body;
    console.log('cod_turma:', cod_turma);

    const excluirJustFalta = `
        DELETE FROM justfalta
        WHERE cod_turma = ?;
    `;

    const excluirJustSaida = `
        DELETE FROM justsaida
        WHERE rm IN (SELECT rm FROM aluno WHERE cod_turma = ?);
    `;

    const excluirRequisicao = `
        DELETE FROM requisicao
        WHERE rm IN (SELECT rm FROM aluno WHERE cod_turma = ?);
    `;

    const excluirInfoResp = `
        DELETE FROM inforesp
        WHERE rm IN (SELECT rm FROM aluno WHERE cod_turma = ?);
    `;

    const excluirInfoEmpresa = `
        DELETE FROM infotrabalho
        WHERE rm IN (SELECT rm FROM aluno WHERE cod_turma = ?);
    `;

    const excluirAluno = `
        DELETE FROM aluno
        WHERE cod_turma = ?;
    `;

    const excluirTurmas = `
        DELETE FROM turma WHERE cod_turma = ?;
    `;

    db.query(excluirJustFalta, [cod_turma], (error, results) => {
        if (error) {
            console.log('Erro ao excluir justificativas de falta:', error);
            return res.status(500).send('Erro ao excluir justificativas de falta');
        }
        console.log('Justificativas de falta excluídas com sucesso.');

        db.query(excluirJustSaida, [cod_turma], (error, results) => {
            if (error) {
                console.log('Erro ao excluir justificativas de saída:', error);
                return res.status(500).send('Erro ao excluir justificativas de saída');
            }
            console.log('Justificativas de saída excluídas com sucesso.');

            db.query(excluirRequisicao, [cod_turma], (error, results) => {
                if (error) {
                    console.log('Erro ao excluir requisições:', error);
                    return res.status(500).send('Erro ao excluir requisições');
                }
                console.log('Requisições excluídas com sucesso.');

                db.query(excluirInfoResp, [cod_turma], (error, results) => {
                    if (error) {
                        console.log('Erro ao excluir dados do responsável:', error);
                        return res.status(500).send('Erro ao excluir dados do responsável');
                    }
                    console.log('Dados do responsável excluídos com sucesso.');

                    db.query(excluirInfoEmpresa, [cod_turma], (error, results) => {
                        if (error) {
                            console.log('Erro ao excluir dados da empresa:', error);
                            return res.status(500).send('Erro ao excluir dados da empresa');
                        }
                        console.log('Dados da empresa excluídos com sucesso.');

                        db.query(excluirAluno, [cod_turma], (error, results) => {
                            if (error) {
                                console.log('Erro ao excluir aluno:', error);
                                return res.status(500).send('Erro ao excluir aluno');
                            }
                            console.log('Alunos excluídos com sucesso.');

                            db.query(excluirTurmas, [cod_turma], (error, results) => {
                                if (error) {
                                    console.log('Erro ao excluir turma:', error);
                                    return res.status(500).send('Erro ao excluir turma');
                                }
                                console.log('Turmas excluídas com sucesso.');
                                res.redirect('/cursos');

                            });
                        });
                    });
                });
            });
        });
    });
});

app.post('/excluirAluno', (req, res) => {
    const rm = req.body.rm;
    console.log(rm);

    const excluirJustFalta = `
        DELETE FROM justfalta
        WHERE rm = ?;
    `;

    const excluirJustSaida = `
        DELETE FROM justsaida
        WHERE rm IN (SELECT rm FROM aluno WHERE rm = ?);
    `;

    const excluirRequisicao = `
        DELETE FROM requisicao
        WHERE rm IN (SELECT rm FROM aluno WHERE rm = ?);
    `;

    const excluirInfoResp = `
        DELETE FROM inforesp
        WHERE rm IN (SELECT rm FROM aluno WHERE rm = ?);
    `;

    const excluirInfoEmpresa = `
        DELETE FROM infotrabalho
        WHERE rm IN (SELECT rm FROM aluno WHERE rm = ?);
    `;

    const excluirAluno = `
        DELETE FROM aluno
        WHERE rm = ?;
    `;

    db.query(excluirJustFalta, [rm], (error, results) => {
        if (error) {
            console.log('Erro ao excluir justificativas de falta:', error);
            return res.status(500).send('Erro ao excluir justificativas de falta');
        }
        console.log('Justificativas de falta excluídas com sucesso.');

        db.query(excluirJustSaida, [rm], (error, results) => {
            if (error) {
                console.log('Erro ao excluir justificativas de saída:', error);
                return res.status(500).send('Erro ao excluir justificativas de saída');
            }
            console.log('Justificativas de saída excluídas com sucesso.');

            db.query(excluirRequisicao, [rm], (error, results) => {
                if (error) {
                    console.log('Erro ao excluir requisições:', error);
                    return res.status(500).send('Erro ao excluir requisições');
                }
                console.log('Requisições excluídas com sucesso.');

                db.query(excluirInfoResp, [rm], (error, results) => {
                    if (error) {
                        console.log('Erro ao excluir dados do responsável:', error);
                        return res.status(500).send('Erro ao excluir dados do responsável');
                    }
                    console.log('Dados do responsável excluídos com sucesso.');

                    db.query(excluirInfoEmpresa, [rm], (error, results) => {
                        if (error) {
                            console.log('Erro ao excluir dados da empresa:', error);
                            return res.status(500).send('Erro ao excluir dados da empresa');
                        }
                        console.log('Dados da empresa excluídos com sucesso.');

                        db.query(excluirAluno, [rm], (error, results) => {
                            if (error) {
                                console.log('Erro ao excluir aluno:', error);
                                return res.status(500).send('Erro ao excluir aluno');
                            }
                            console.log('Aluno excluído com sucesso.');
                            res.redirect('/cursos');
                        });
                    });
                });
            });
        });
    });
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

app.post('/cadastroTurma', (req, res) => {
    const nome_turma = req.body.nome_turma;
    const cod_curso = req.body.codCurso;

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


app.get('/turmas/:cursoId', (req, res) => {
    const cursoId = req.params.cursoId;

    db.query('SELECT * FROM turma WHERE cod_curso = ?', [cursoId], (error, turmas) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Erro ao buscar turmas');
        }
        res.json(turmas);
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
        } else {
            console.log('generos encontrados com sucesso!')
            db.query('SELECT * FROM curso', (error, cursos) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send('Erro ao buscar cursos');
                } else {
                    console.log('cursos encontrados com sucesso!')
                    db.query('SELECT * FROM turma', (error, turmas) => {
                        if (error) {
                            console.error(error);
                            return res.status(500).send('Erro ao buscar turmas');
                        } else {
                            console.log('turmas encontrados com sucesso!')
                            res.render("pages/gestao/cadastroAluno", { cursos, turmas, genero });
                        }

                    });
                }
            });
        }
    });
});

app.post('/cadastroAluno', (req, res) => {
    const {
        rm, data_nasc, nome_aluno, email_aluno, senha,
        cpf, tel_aluno, nome_resp, email_resp, tel_resp,
        nome_empresa, email_empresa, tel_empresa,
        cod_curso, cod_turma, tipo_aluno, cod_genero
    } = req.body;

    if (!rm || !data_nasc || !nome_aluno || !email_aluno || !senha || !cpf || !tel_aluno || !cod_curso || !cod_turma || !cod_genero) {
        return res.render('cadastroAluno', { errorMessage: 'Preencha todos os campos!' });
    }

    const currentYear = new Date().getFullYear();
    const birthYear = new Date(data_nasc).getFullYear();
    const age = currentYear - birthYear;

    if (age < 14) {
        return res.status(400).send('O aluno deve ter pelo menos 14 anos de idade.');
    }


    try {
        db.query('INSERT INTO aluno (rm, nome_aluno, cpf, data_nasc, email_aluno, senha, tel_aluno, cod_curso, cod_turma, cod_genero) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [rm, nome_aluno, cpf, data_nasc, email_aluno, senha, tel_aluno, cod_curso, cod_turma, cod_genero],
            (error) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send('Erro ao cadastrar o aluno.');
                }

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
                            req.session.successMessage = `Aluno ${nome_aluno} cadastrado com sucesso com responsável.`;
                            return res.redirect('/homeGestao');
                        });
                    });
                } else if (tipo_aluno === 'empresa') {
                    if (!nome_empresa || !email_empresa || !tel_empresa) {
                        return res.status(400).send('Por favor, preencha os campos da empresa.');
                    }

                    let cod_empresa;
                    db.query('SELECT cod_empresa FROM empresa WHERE nome_empresa = ?', [nome_empresa], (error, result) => {
                        if (error) {
                            console.error(error);
                            return res.status(500).send('Erro ao buscar a empresa.');
                        }

                        if (result.length > 0) {
                            cod_empresa = result[0].cod_empresa;
                        } else {
                            db.query('INSERT INTO empresa (nome_empresa, email_empresa, tel_empresa) VALUES (?, ?, ?)', [nome_empresa, email_empresa, tel_empresa], (error, result) => {
                                if (error) {
                                    console.error(error);
                                    return res.status(500).send('Erro ao cadastrar a empresa.');
                                }
                                cod_empresa = result.insertId;
                            });
                        }

                        db.query('INSERT INTO infotrabalho (rm, cod_empresa) VALUES (?, ?)', [rm, cod_empresa], (error) => {
                            if (error) {
                                console.error(error);
                                return res.status(500).send('Erro ao vincular a empresa ao aluno.');
                            }
                            req.session.successMessage = `Aluno ${nome_aluno} cadastrado com sucesso vinculado à empresa.`;
                            return res.redirect('/homeGestao');
                        });
                    });
                } else {
                    req.session.successMessage = `Aluno ${nome_aluno} cadastrado com sucesso.`;
                    return res.redirect('/homeGestao');
                }
            }
        );
    } catch (error) {
        console.error(error);
        return res.status(500).send('Erro ao cadastrar o aluno.');
    }
});

//ListaAlunos
app.get("/listaAlunos", (req, res) => {
    if (!req.session.email_user) {
        return res.redirect('/');
    }
    const cod_turma = req.query.cod_turma;
    const situacao = req.query.situacao;

    let query = `
        SELECT 
            aluno.rm, 
            aluno.nome_aluno, 
            aluno.tel_aluno, 
            turma.nome_turma, 
            (SELECT COUNT(*) FROM requisicao WHERE requisicao.rm = aluno.rm AND requisicao.cod_turma = aluno.cod_turma) AS saidas_count
        FROM 
            aluno
        INNER JOIN 
            turma ON aluno.cod_turma = turma.cod_turma
        WHERE 
            turma.cod_turma = ?
    `;

    const params = [cod_turma];

    if (situacao) {
        query += ` AND (SELECT COUNT(*) FROM requisicao WHERE requisicao.rm = aluno.rm AND requisicao.cod_turma = aluno.cod_turma) ${situacao}`;
    }

    db.query(query, params, (error, results) => {
        if (error) {
            console.log("Erro ao buscar alunos", error);
            return res.send("Erro ao buscar alunos");
        }

        res.render("pages/gestao/listaAlunos", { listaAlunos: results, cod_turma });
    });
});


//DetalhesAlunoGestao
app.get("/alunoGestao", (req, res) => {
    const rm_aluno = req.query.rm;

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
            const aluno = results[0];

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

    if (!tipo_historico || typeof tipo_historico !== 'string' || !['Saída Antecipada', 'Justificativa de Falta', 'Justificativa de Saída'].includes(tipo_historico)) {
        return res.status(400).send('Tipo de pendência inválido.');
    }

    let selectQuery;

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

    db.query(selectQuery, [cod_historico], (err, results) => {
        if (err) {
            console.error('Erro ao buscar pendência:', err);
            return res.status(500).send('Erro ao buscar pendência.');
        }

        if (results.length === 0) {
            return res.status(404).send('Nenhuma pendência encontrada.');
        }

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
    console.log('Consulta:', query);

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


// Pesquisa
app.get('/pesquisa1', (req, res) => {
    const query = req.query.query;

    if (!query) {
        return res.status(400).json({ error: 'Parâmetro de pesquisa ausente' });
    }

    let sqlQuery;
    let params;

    if (!isNaN(query)) {
        sqlQuery = `
            SELECT nome_aluno, rm
            FROM aluno 
            WHERE rm = ?
            LIMIT 10
        `;
        params = [parseInt(query)];
    } else {
        sqlQuery = `
            SELECT nome_aluno, rm
            FROM aluno 
            WHERE nome_aluno LIKE ?
            LIMIT 10
        `;
        params = [`%${query}%`];
    }

    db.query(sqlQuery, params, (error, results) => {
        if (error) {
            console.error('Erro na pesquisa:', error);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        res.json(results);
    });
});

// Mover Aluno
app.post('/moverAlunoTurma/:rm', (req, res) => {
    const rm = req.body.rm;
    const cod_turma = req.body.cod_turma;

    db.query('SELECT cod_curso FROM turma WHERE cod_turma = ?', [cod_turma], (err, results) => {
        if (err) {
            return res.status(500).send('Erro ao verificar a turma.');
        }
        if (results.length === 0) {
            return res.status(404).send('Turma não encontrada.');
        }

        const cod_curso = results[0].cod_curso;

        db.query('SELECT * FROM aluno WHERE rm = ?', [rm], (err, results) => {
            if (err) {
                return res.status(500).send('Erro ao verificar aluno.');
            }
            if (results.length === 0) {
                return res.status(404).send('Aluno não encontrado.');
            } else {
                const atualizar = 'UPDATE aluno SET cod_turma = ?, cod_curso = ? WHERE rm = ?';
                db.query(atualizar, [cod_turma, cod_curso, rm], (updateErr) => {
                    if (updateErr) {
                        return res.status(500).json({ error: updateErr.message });
                    }
                    console.log(`Aluno ${results[0].nome_aluno} movido com sucesso para a turma ${cod_turma}`);
                    return res.redirect('/cursos');
                });
            }
        });
    });
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


// Para a tabela justsaida
app.get('/uploads/justsaida/:id', (req, res) => {
    const { id } = req.params;
    db.query("SELECT arquivo FROM justsaida WHERE cod_saida = ?", [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar o arquivo:", err);
            return res.status(500).send("Erro ao buscar o arquivo.");
        }
        if (!results.length) {
            console.log("Arquivo não encontrado para o ID:", id);
            return res.status(404).send("Arquivo não encontrado.");
        }

        const arquivoBuffer = results[0].arquivo;
        console.log("Tamanho do arquivo:", arquivoBuffer.length);

        res.setHeader('Content-Disposition', 'attachment; filename="just_saida_arquivo.pdf"');
        res.setHeader('Content-Type', 'application/pdf');
        res.end(arquivoBuffer);
    });
});

app.get('/uploads/justfalta/:id', (req, res) => {
    const { id } = req.params;
    db.query("SELECT arquivo FROM justfalta WHERE cod_falta = ?", [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar o arquivo:", err);
            return res.status(500).send("Erro ao buscar o arquivo.");
        }
        if (!results.length) {
            console.log("Arquivo não encontrado para o ID:", id);
            return res.status(404).send("Arquivo não encontrado.");
        }

        const arquivoBuffer = results[0].arquivo;
        console.log("Tamanho do arquivo:", arquivoBuffer.length);

        res.setHeader('Content-Disposition', 'attachment; filename="just_falta_arquivo.pdf"');
        res.setHeader('Content-Type', 'application/pdf');
        res.end(arquivoBuffer);
    });
});
