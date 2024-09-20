
/*link de acesso ao localhost*/
/*10.107.10.54:8080*/

// Extensões
var express = require('express');
var session = require('express-session'); // Adicione esta linha
var app = express();
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const port = process.env.PORT || 3001;
//const bcrypt = require('bcrypt');

                                                                                                                        //NAO PODE DAR CTRL Z
// Configuração do middleware de sessão
app.use(session({
    secret: 'desespero', // Substitua por um segredo aleatório
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Define como `true` se estiver usando HTTPS
}));
// porta

// pasta public
app.use(express.static(__dirname + '/public'));

// pasta views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuração do banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'mila',
    password: '2002',
    database: 'tcc'
});

// Conexão com o banco de dados
db.connect((error) => {
    if (error) {
        console.log("Erro ao conectar com o banco de dados:", error);
    } else {
        console.log("Conectado ao MySQL");
    }
});

// Configurações do Express
app.use(bodyParser.urlencoded({ extended: true }));


// Rotas Gets
app.get("/homeAluno", (req, res) => {
    console.log("Dados da sessão em /homeAluno:", req.session);

    if (req.session.rm) {
        const nome_aluno = req.session.nome;
        res.render("pages/aluno/homeAluno", { nome_aluno });
    } else {
        res.redirect("/login");
    }
});



// Manutenção                                                                                                       //NAO PODE DAR CTRL Z
app.get("/manutencao", (req, res) => {
    res.render("manutencao");
});

// Login
app.get("/", (req, res) => {
    res.render("index");
});

// Aluno
// Navbar
app.set('view engine', 'ejs');

// Rota para a página do histórico do aluno
app.get("/historicoAluno", (req, res) => {
    console.log("Dados da sessão em /historicoAluno:", req.session);

    const rm = req.session.rm; // Obtém o RM da sessão
    // Consultas SQL atualizadas
    const queryJustFalta = "SELECT * FROM justfalta WHERE rm = ?";
    const queryJustSaida = "SELECT * FROM justsaida WHERE rm = ?";

    
    db.query(queryJustFalta, [rm], (errorFalta, resultadosFalta) => {
        if (errorFalta) {
            console.log("Erro ao buscar faltas:", errorFalta);
            return res.redirect("/Erro.html");
        }

        db.query(queryJustSaida, [rm], (errorSaida, resultadosSaida) => {
            if (errorSaida) {
                console.log("Erro ao buscar saídas:", errorSaida);
                return res.redirect("/Erro.html");
            }

            // Combine os resultados e envie para a view
            const historico = resultadosFalta.concat(resultadosSaida);
            res.render("pages/aluno/historicoAluno", { historico });
        });
    });
});



  
  

app.get("/perfilAlunomenor", (req, res) => {
    // Supondo que o 'email_aluno' foi armazenado na sessão durante o login 
    const email_aluno = req.session.email_user;

    if (!email_aluno) {
        // Se o aluno não estiver logado ou a sessão expirou
        return res.redirect('/');
    }

    // Consulta para pegar os dados do aluno
    const query = `SELECT 
    aluno.nome_aluno,
    aluno.data_nasc,
    aluno.rm,
    aluno.tel_aluno,
    aluno.cpf,
    aluno.email_aluno,
    aluno.cod_curso,
    responsavel.email_resp,
    responsavel.tel_resp,
    responsavel.nome_resp
FROM 
    aluno
INNER JOIN 
    inforesp ON aluno.rm = inforesp.rm
INNER JOIN 
    responsavel ON inforesp.cod_resp = responsavel.cod_resp
WHERE 
    aluno.email_aluno = ?;
`; 

    db.query(query, [email_aluno], (error, results) => {
        if (error) {
            console.log("Erro ao buscar os dados do aluno:", error);
            return res.status(500).send("Erro ao buscar os dados.");
        }

        if (results.length > 0) {
            const aluno = results[0]; // Pega o primeiro resultado da consulta

            // Renderiza a página e envia os dados do aluno para a view
            res.render("pages/aluno/perfilAlunomenor", {
                nome_aluno: aluno.nome_aluno,
                cod_curso: aluno.cod_curso,
                cpf: aluno.cpf,
                rm: aluno.rm,
                tel_aluno: aluno.tel_aluno,
                data_nasc: aluno.data_nasc,
                email_aluno: aluno.email_aluno,
                email_resp: aluno.email_resp,
                nome_resp: aluno.nome_resp,
                tel_resp: aluno.tel_resp
            });
        } else {
            // Caso não encontre o aluno, redireciona ou exibe uma mensagem de erro
            res.status(404).send("Aluno não encontrado.");
        }
    });
});



app.get("/perfilAlunomaior", (req, res) => {
    // Supondo que o 'email_aluno' foi armazenado na sessão durante o login 
    const email_aluno = req.session.email_user;

    if (!email_aluno) {
        // Se o aluno não estiver logado ou a sessão expirou
        return res.redirect('/');
    }

    // Consulta para pegar os dados do aluno
    const query = `SELECT nome_aluno, cod_curso, cpf, tel_aluno, data_nasc, email_aluno FROM aluno WHERE email_aluno = ?`;

    db.query(query, [email_aluno], (error, results) => {
        if (error) {
            console.log("Erro ao buscar os dados do aluno:", error);
            return res.status(500).send("Erro ao buscar os dados.");
        }

        if (results.length > 0) {
            const aluno = results[0]; // Pega o primeiro resultado da consulta

            // Renderiza a página e envia os dados do aluno para a view
            res.render("pages/aluno/perfilAlunomenor", {
                nome_aluno: aluno.nome_aluno,
                cod_curso: aluno.cod_curso,
                cpf: aluno.cpf,
                rm: aluno.rm,
                tel_aluno: aluno.tel_aluno,
                data_nasc: aluno.data_nasc,
                email_aluno: aluno.email_aluno
            });
        } else {
            // Caso não encontre o aluno, redireciona ou exibe uma mensagem de erro
            res.status(404).send("Aluno não encontrado.");
        }
    });
});

// Formularios
app.get("/justificarFaltaAluno", (req, res) => {
    res.render("pages/aluno/justificarFaltaAluno");
});

app.get("/justificarSaidaAluno", (req, res) => {
    res.render("pages/aluno/justificarSaidaAluno");
});

app.get("/requisicaoAluno", (req, res) => {
    res.render("pages/aluno/requisicaoAluno");
});
                                                                                                                    //NAO PODE DAR CTRL Z
// Mudança de Senha
app.get("/mudarSenha", (req, res) => {
    res.render("pages/aluno/mudarSenha");
});

app.get("/primeiroAcesso", (req, res) => {
    res.render("pages/aluno/primeiroAcesso");
});

// Gestao 
// Navbar
app.get('/cursos', (req, res) => {
    db.query('select cod_curso, nome_curso, tipo_curso from curso', (error, results) => {
        if (error) {
            console.log('Houve um erro ao procurar os cursos')
        } else {
            console.log('Cursos:', results);
            res.render('pages/gestao/cursos', { cursos: results})
        }
    })
});

app.get("/historicoGestao", (req, res) => {
    res.render("pages/gestao/historicoGestao");
});

app.get("/homeGestao", (req, res) => {
    const nome_gestao = req.session.nome;
    res.render("pages/gestao/homeGestao", { nome_gestao }); 
});

app.get('/pendencias', (req, res) => {
    try {
      const pendenciasQuery = `
        SELECT 
            a.nome_aluno AS "Nome do Aluno",
            c.tipo_curso AS "Modalidade",
            CASE
                WHEN s.cod_saida IS NOT NULL THEN 'Saída Antecipada'
                WHEN f.cod_falta IS NOT NULL THEN 'Justificativa de Falta'
                WHEN j.cod_justificativa IS NOT NULL THEN 'Justificativa de Saída'
                ELSE 'Sem pendências'
            END AS "Tipo de Pendência",
            CASE
                WHEN s.cod_saida IS NOT NULL THEN s.data_hora_saida
                WHEN f.cod_falta IS NOT NULL THEN f.data_falta
                WHEN j.cod_justificativa IS NOT NULL THEN j.data_justificativa
            END AS "Data",
            COUNT(CASE WHEN s.ciencia_gestor = false THEN 1 ELSE NULL END) AS "Total de Pendências"
        FROM 
            aluno_menor a
        LEFT JOIN 
            curso c ON a.cod_curso = c.cod_curso
        LEFT JOIN 
            saida s ON a.rm = s.rm
        LEFT JOIN 
            falta f ON s.cod_saida = f.cod_saida
        LEFT JOIN 
            justificativa j ON s.cod_saida = j.cod_saida
        GROUP BY 
            a.nome_aluno, c.tipo_curso, s.cod_saida, f.cod_falta, j.cod_justificativa, s.ciencia_gestor
        HAVING 
            COUNT(CASE WHEN s.ciencia_gestor = false THEN 1 ELSE NULL END) > 0 
            OR COUNT(f.cod_falta) > 0 
            OR COUNT(j.cod_justificativa) > 0;
      `;
  
      const [pendencias] = db.promise().query(pendenciasQuery);
      res.json(pendencias);
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao buscar pendências.');
    }
  });
  

app.get("/perfilGestao", (req, res) => {
// Supondo que o 'email_gestao' foi armazenado na sessão durante o login
    const email_gestor = req.session.email_user;

    if (!email_gestor) {
    // Se o gestor não estiver logado ou a sessão expirou
        return res.redirect('/');
}

// Consulta para pegar os dados do gestor
const query = `SELECT nome_gestor, email_gestor, tel_gestor, nif, cargo
FROM gestor WHERE email_gestor = ?`;

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
cargo: gestor.cargo
});
} else {
// Caso não encontre o Gestor, redireciona ou exibe uma mensagem de erro
res.status(404).send("Gestor não encontrado.");
}
});
})

// Secundarias
app.get('/turma', (req, res) => {
    const codCurso = req.query.cod_curso;
    console.log('cod_curso recebido:', codCurso); // Verifique se está imprimindo o valor

    const query = `
      SELECT turma.nome_turma, curso.nome_curso
      FROM turma
      JOIN curso ON turma.cod_curso = curso.cod_curso
      WHERE turma.cod_curso = ?
      ORDER BY turma.nome_turma ASC;
    `;

    db.query(query, [codCurso], (error, results) => {
        if (error) {
            console.log("Houve um erro ao procurar as turmas: ", error);
            return res.status(500).send("Erro ao buscar os dados.");
        } else{
            const turmas = results[0];
            console.log('Resultados da consulta:', results); // Verifique os dados retornados
            res.render('pages/gestao/turma', { turmas: results, nome_curso: turmas.nome_curso });  
        }
    });
});

app.get("/cadastroCurso", (req, res) => {
    res.render("pages/gestao/cadastroCurso");
});

app.get("/cadastroAluno", (req, res) => {
    res.render("pages/gestao/cadastroAluno");
});

app.get("/listaAlunos", (req, res) => {
    res.render("pages/gestao/listaAlunos");
});
                                                                                                                     //NAO PODE DAR CTRL Z
app.get("/alunoGestao", (req, res) => {
    res.render("pages/gestao/alunoGestao");
});

app.get("/autorizaSaida", (req, res) => {
    res.render("pages/gestao/autorizaSaida");
});

app.get("/detalhesSaida", (req, res) => {
    res.render("pages/gestao/detalhesSaida");
});

// Mudança de Senha
app.get("/mudarSenha", (req, res) => {
    res.render("pages/gestao/mudarSenha");
});

app.get("/primeiroacessoGestao", (req, res) => {
    res.render("pages/gestao/primeiroacessoGestao");
});


app.get('/pesquisar', (req, res) => {
    const query = req.query.query || '';
    console.log('Consulta:', query);  // Verifique o valor da consulta

    const sqlAlunos = 'SELECT * FROM aluno WHERE nome_aluno LIKE ?';
    const sqlCursos = 'SELECT * FROM curso WHERE nome_curso LIKE ?';

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




     
//Login reformado
app.post("/login", (req, res) => {
    const email = req.body.aluno; // Pode ser email de aluno ou gestor
    const senha = req.body.senha;

    const query = `
        SELECT nome_aluno AS nome, senha, primeiro_acesso, rm AS rm_aluno, 'aluno' AS tipo, email_aluno AS email_user FROM aluno WHERE email_aluno = ?
        UNION
        SELECT nome_gestor AS nome, senha, primeiro_acesso, nif AS nif_gestor, 'gestor' AS tipo, email_gestor AS email_user FROM gestor WHERE email_gestor = ?;
    `;

    db.query(query, [email, email], (error, results) => {
        if (error) {
            console.log("Erro ao executar a consulta no banco de dados:", error);
            return res.redirect("/Erro.html");
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
                return res.send("Senha Errada!");
            }
        } else {
            return res.redirect("/Cadastrar.html");
        }
    });
});




//Primeiro Acesso Estamos em fase de testes AAAAAAAAAAAA blz
app.post('/primeiroAcesso', (req, res) => {
    const { senhaAtual, nova_senha, confirmacaoSenha } = req.body;
    const email_aluno = req.session.email_user; // Email do aluno armazenado na sessão

    if (!email_aluno) {
        return res.send("Usuário não autenticado. Faça login novamente.");
    }

    if (nova_senha.trim() !== confirmacaoSenha.trim()) {
        return res.send("A nova senha e a confirmação não coincidem.");
    }

    const query = 'SELECT senha FROM aluno WHERE email_aluno = ?';
    db.query(query, [email_aluno], (error, results) => {
        if (error) {
            console.log("Erro ao buscar senha no banco de dados:", error);
            return res.redirect("/Erro.html");
        }

        if (results.length > 0) {
            const senhaDB = results[0].senha;

            if (senhaAtual.trim() === senhaDB) {
                const queryUpdate = 'UPDATE aluno SET senha = ?, primeiro_acesso = false WHERE email_aluno = ?';
                db.query(queryUpdate, [nova_senha.trim(), email_aluno], (error) => {
                    if (error) {
                        console.log("Erro ao atualizar a senha:", error);
                        return res.redirect("/Erro.html");
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


// Código para primeiro acesso dos gestores
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
            return res.redirect("/Erro.html");
        }

        if (results.length > 0) {
            const senhaDB = results[0].senha;

            if (senhaAtual.trim() === senhaDB) {
                const queryUpdate = 'UPDATE gestor SET senha = ?, primeiro_acesso = false WHERE email_gestor = ?';
                db.query(queryUpdate, [nova_senha.trim(), email_gestor], (error) => {
                    if (error) {
                        console.log("Erro ao atualizar a senha:", error);
                        return res.redirect("/Erro.html");
                    }
                    console.log("Senha atualizada com sucesso!");
                    return res.redirect('/homeGestao');
                });
            } else {
                return res.send("Senha atual incorreta.");
            }
        } else {
            return res.send("Usuário não encontrado.");
        }

        console.log("E-mail do gestor na sessão:", email_gestor);

    });
});


//Gente, o gestor voltou a dar problema, não sei o que fazer





// Cadastros
app.post('/cadastroAluno', (req, res) => {
    const { rm, data_nasc, nome_aluno, email_aluno, senha, cpf, tel_aluno, nome_resp, tel_resp, email_resp } = req.body;

    // Verifique se todos os campos estão preenchidos (validação básica)
    if (!rm || !data_nasc || !nome_aluno || !email_aluno || !senha || !cpf || !tel_aluno || !nome_resp || !tel_resp || !email_resp) {
        return res.status(400).send('Por favor, preencha todos os campos.');
    }

    db.query(
        'INSERT INTO aluno_menor (rm, data_nasc, nome_aluno, email_aluno, senha, cpf, tel_aluno, nome_resp, tel_resp, email_resp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [rm, data_nasc, nome_aluno, email_aluno, senha, cpf, tel_aluno, nome_resp, tel_resp, email_resp], 
        (error, result) => {
          if (error) {
            res.status(500).send('Erro ao cadastrar o aluno');
          } else {
            res.send(`Aluno ${nome_aluno} cadastrado com sucesso.`);
          }
        } 
      );
});

app.post('/cadastroCurso', (req, res) => {
    const {nome_curso, tipo_curso, turma_curso} = req.body;
    
    // Verifique se todos os campos estão preenchidos (validação básica)
    if (!nome_curso || !tipo_curso || !turma_curso) {
        return res.status(400).send('Por favor, preencha todos os campos.');
    }
    
    db.query(
        'INSERT INTO curso ( cod_curso, nome_curso, tipo_curso, turma_curso) VALUES (?, ?, ?, ?)', 
        [nome_curso, tipo_curso, turma_curso], 
        (error, result) => {
          if (error) {
            res.status(500).send('Erro ao cadastrar curso');
          } else {
            res.send(`Curso ${nome_curso} cadastrado com sucesso.`);
          }
        } 
      );
      
});

app.post('/pesquisaGestao', (req, res) => {
    const query = req.body.query.trim();
    
    if (!query) {
        return res.redirect('/pesquisaGestao?mensagem=O campo de pesquisa não pode estar vazio.');
    } else {res.redirect(`/pesquisaGestao?query=${encodeURIComponent(query)}`);}

});

