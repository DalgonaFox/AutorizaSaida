create database tcc;
use tcc;

create table  aluno (
rm int not null primary key,
data_nasc date not null,
nome varchar (100) not null,
nome_resp varchar (100) not null,
email_resp varchar (255) null,
email_aluno varchar  (255) null,
senha varchar (8) not null,
tel_resp int null,
cpf int not null
);

alter table aluno
modify cpf varchar(11);


 create table turma (
 cod_turma int not null primary key,
 rm int not null,
 cod_curso int not null,
 nome_turma varchar (20) not null,
 foreign key (rm) references aluno (rm)

 );
 
create table curso (
cod_curso int not null primary key,
tipo varchar (3) not null,
nome_curso varchar (100) not null,
cod_turma int not null,
foreign key(cod_turma) references turma (cod_turma)
);

create table gestor (
nif int not null primary key,
tipo varchar (20) not null,
nome varchar (100) not null,
senha varchar (8) not null
);

--/////////////////////////
create table atestado (
cod_atestado int not null primary key,
data_inicio date not null,
data_termino date not null,
data_emissao date not null
);

create table saida (
cod_saida int not null primary key,
rm int not null,
foreign key (rm) references aluno (rm),
data_hora_saida datetime not null,
ciencia_gestor boolean,
justif varchar (200) not null,
nif int not null,
foreign key (nif) references gestor (nif),
cod_atestado int null,
foreign key (cod_atestado) references atestado (cod_atestado)
);

create table justif (
cod_justif int not null primary key,
data_justif date not null,
nif int not null,
foreign key (nif) references gestor (nif),
cod_atestado int not null,
foreign key (cod_atestado) references atestado (cod_atestado)
);

alter table turma
add constraint foreign key (cod_curso)
references curso (cod_curso);

/* PÁGINA DE PRIMEIRO ACESSO ALUNO */ 
SELECT senha FROM aluno WHERE email = %s,
UPDATE aluno SET senha = %s WHERE email = %s,

/*PERFIL ALUNO (SELECT POR QUADRINHO)*/
SELECT curso FROM alunos WHERE id = ?
SELECT cpf FROM alunos WHERE id = ?
SELECT  rm FROM alunos WHERE id = ?
SELECT telefone FROM alunos WHERE id = ?
SELECT turma FROM alunos WHERE id = ?
SELECT data_nasc FROM alunos WHERE id = ?
SELECT nome FROM alunos WHERE id = ?
SELECT nome_resp FROM alunos WHERE id = ?
SELECT email_aluno FROM alunos WHERE id = ?
SELECT email_resp FROM alunos WHERE id = ?
SELECT tel_resp FROM alunos WHERE id = ?

/*Histórico Aluno*/ 
SELECT 

