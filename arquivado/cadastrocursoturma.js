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

