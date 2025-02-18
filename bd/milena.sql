drop database tcc;
CREATE DATABASE tcc;
USE tcc;

#Cursos
create table curso (
cod_curso int primary key auto_increment,
nome_curso varchar (255) not null,
tipo_curso varchar (255) not null,
turno varchar (255) not null
);

#Turmas
create table turma (
 cod_turma int primary key auto_increment,
 nome_turma varchar (20) not null UNIQUE,
 cod_curso int not null,
 constraint foreign key (cod_curso) references curso (cod_curso)
 );
 
 create table genero (
 cod_genero int primary key not null,
 nome_genero varchar (18) not null UNIQUE
 );
 

#Aluno
create table aluno (
rm int (4) primary key, 
nome_aluno varchar (255) not null,
cpf  varchar (11) not null UNIQUE,
data_nasc date not null,
email_aluno varchar (255) not null UNIQUE,
senha varchar (15) not null,
tel_aluno varchar (11) not null UNIQUE,
primeiro_acesso boolean default true,
cod_genero int not null,
constraint foreign key (cod_genero) references genero (cod_genero),
cod_curso int not null,
constraint foreign key (cod_curso) references curso (cod_curso),
cod_turma int not null,
constraint foreign key (cod_turma) references turma (cod_turma)
);

create table responsavel (
cod_resp int primary key auto_increment,
nome_resp varchar (255) not null,
email_resp varchar (255) not null UNIQUE,
tel_resp varchar (11) not null UNIQUE
);

create table empresa (
cod_empresa int primary key auto_increment,
nome_empresa varchar (255) not null,
email_empresa varchar (255) not null UNIQUE,
tel_empresa varchar (11) not null UNIQUE
);

create table inforesp (
cod_inforesp int primary key auto_increment,
rm int (4) not null,
constraint foreign key (rm) references aluno (rm),
cod_resp int not null,
constraint foreign key (cod_resp) references responsavel (cod_resp)
);

create table infotrabalho (
cod_trabalho int primary key auto_increment,
rm int (4) not null,
constraint foreign key (rm) references aluno (rm),
cod_empresa int not null,
constraint foreign key (cod_empresa) references empresa (cod_empresa)
);

#Gestão
create table gestor(
nif int primary key,
nome_gestor varchar (250) not null,
email_gestor varchar(255) not null UNIQUE,
senha varchar (15) not null,
tel_gestor varchar (11) not null UNIQUE,
cargo varchar(255) not null,
primeiro_acesso boolean default true,
cod_genero int not null,
constraint foreign key (cod_genero) references genero (cod_genero)
);

#Outros
create table requisicao (
cod_req int primary key auto_increment,
rm int not null,
constraint foreign key (rm) references aluno (rm),
cod_turma int not null,
constraint foreign key (cod_turma) references turma (cod_turma),
data_saida date not null,
hora_saida time not null,
justificativa varchar (255) not null,
ciencia_gestor boolean not null
);

create table justsaida (
cod_saida int primary key auto_increment,
cod_req int not null,
constraint foreign key (cod_req) references requisicao (cod_req),
rm int not null,
constraint foreign key (rm) references aluno (rm),
observacao varchar (255) not null,
arquivo longblob not null,
ciencia_gestor boolean not null,
data_envio date not null
);

create table justfalta (
cod_falta int primary key auto_increment,
rm int not null,
constraint foreign key (rm) references aluno (rm),
cod_turma int not null,
constraint foreign key (cod_turma) references turma (cod_turma),
data_emissao date not null,
data_inicio date not null,
data_termino date not null,
observacao varchar (255) not null,
arquivo longblob not null,
ciencia_gestor boolean not null,
data_envio date not null
);




#///////////////////////////
INSERT INTO genero (cod_genero, nome_genero) values
(1, 'Masculino'),
(2, 'Feminino'),
(3, 'Prefiro não dizer');
 
INSERT INTO responsavel (nome_resp, email_resp, tel_resp) VALUES 
('Ana Costa', 'ana.costa@mail.com', '21987654321'),
('José Silva', 'jose.silva@mail.com', '21987654322'),
('Lucas Almeida', 'lucas.almeida@mail.com', '21987654323'),
('Fernanda Oliveira', 'fernanda.oliveira@mail.com', '21987654324'),
('Carlos Pereira', 'carlos.pereira@mail.com', '21987654325'),
('Juliana Ferreira', 'juliana.ferreira@mail.com', '21987654326'),
('Roberto Souza', 'roberto.souza@mail.com', '21987654327'),
('Mariana Lima', 'mariana.lima@mail.com', '21987654328'),
('Ricardo Mendes', 'ricardo.mendes@mail.com', '21987654329'),
('Patricia Rocha', 'patricia.rocha@mail.com', '21987654330');

INSERT INTO empresa (nome_empresa, email_empresa, tel_empresa) VALUES 
('Tech Solutions', 'contato@techsolutions.com', '2133322233'),
('Advocacia Silva', 'contato@advocaciasilva.com', '2133322234'),
('InovaTech', 'contato@inovatech.com', '2133322235'),
('Consultoria Oliveira', 'contato@consultoriaoliveira.com', '2133322236'),
('Desenvolve TI', 'contato@desenvolveti.com', '2133322237'),
('Global Solutions', 'contato@globalsolutions.com', '2133322238'),
('Segurança Total', 'contato@segurancatotal.com', '2133322239'),
('Finance Corp', 'contato@financecorp.com', '2133322240'),
('Logística Avançada', 'contato@logisticaavancada.com', '2133322241'),
('Indústria Forte', 'contato@industriaforte.com', '2133322242');

INSERT INTO gestor (nif, nome_gestor, email_gestor, senha, tel_gestor, cargo, cod_genero) VALUES 
(101, 'João Souza', 'joao.souza@mail.com', 'gestor123', '21977777777', 'Coordenador', 1),
(102, 'Luciana Lima', 'luciana.lima@mail.com', 'gestor123', '21966666666', 'Diretora', 2),
(103, 'Washington Paiva', 'wpaiva@docente.senai.br', 'gestor123', '11999999999', 'Professor', 1),
(104, 'GestorTeste', 'gestorteste@mail.com', 'gestor123', '11922838213', 'Teste', 1);

INSERT INTO curso (cod_curso, nome_curso, tipo_curso, turno) VALUES
(10, 'Logística', 'Técnico', 'Manhã'),
(11, 'Eletroeletrônica', 'Técnico', 'Manhã'),
(12, 'Mecânica', 'Técnico', 'Manhã'),
(13, 'Assistente Administrativo', 'CAI', 'Tarde'),
(14, 'Assistente Administrativo', 'CAI', 'Noite'),
(15, 'Auxiliar de Operação Ferroviária', 'CAI', 'Noite'),
(16, 'Eletricista de Manutenção Eletroeletrônica', 'CAI', 'Noite'),
(17, 'Manobrador Ferroviário', 'CAI', 'Manhã'),
(18, 'Mecânico de Manutenção', 'CAI', 'Noite'),
(19, 'Mecânico de Usinagem', 'CAI', 'Manhã'),
(20, 'Operador de Processos Químicos', 'CAI', 'Manhã'),
(21, 'Soldador', 'CAI', 'Noite'),
(22, 'Fundamentos do Python 1', 'FIC', 'Noite'),
(23, 'Auxiliar de Suprimentos', 'FIC', 'Tarde'),
(24, 'Microsoft Power BI', 'FIC', 'Noite'),
(25, 'Análise e Desenvolvimento de Sistemas', 'Técnico', 'Noite');

INSERT INTO turma (cod_turma, nome_turma, cod_curso) VALUES
(1, 'TS1', 21),
(2, 'TAA1', 13),
(3, 'TA1', 14),
(4, 'TAOF1', 15),
(5, 'TAS1', 23),
(6, 'TDS1', 25),
(7, 'TEE1', 11),
(8, 'TEME1', 16),
(9, 'TFP1', 22),
(10, 'TL1', 10),
(11, 'TMF1', 17),
(12, 'TMM1', 12),
(13, 'TMU1', 19),
(14, 'TOPQ1', 20),
(15, 'TPBI1', 24);

INSERT INTO aluno (rm, nome_aluno, cpf, data_nasc, email_aluno, senha, tel_aluno, primeiro_acesso, cod_genero, cod_curso, cod_turma) VALUES
(1001, 'Mariana Chaves', '47474474499', '2007-04-27', 'mariana.marcondesfc@gmail.com', 'senha123', '119456137', 1, 2, 25, 6),
(1002, 'Sabrina Vilela Raimundo', '47414424898', '2007-05-24', 'sabrinavilela007@gmail.com', 'senha123', '1195684863', 1, 2, 25, 6),
(1003, 'João Pedro Bueno', '47424279787', '2006-08-10', 'buenodasilva@gmail.com', 'senha123', '1198754321', 1, 2, 25, 6),
(1004, 'Milena Oliveira', '56782395623', '2006-11-03', 'mila.olisantos@gmail.com', 'senha123', '11923461234', 1, 2, 25, 6),
(1005, 'Isadora Bezerra de Oliveira', '4098754321', '2007-07-10', 'isadora.oliveira5@aluno.senai.br', 'senha123', '11923426754', 1, 2, 25, 6),
(1006, 'Laura Rodrigues Marinho', '58295737193', '2006-11-07', 'laura.marinho12@aluno.senai.br', 'senha123', '11923456754', 1, 2, 25, 6),
(1007, 'Eduardo Irineu', '40987123476', '2006-08-01', 'eduardo.irineu@aluno.senai.br', 'senha123', '11909876543', 1, 2, 25, 6),
(1008, 'Washington Paiva', '91293872649', '1984-10-15', 'washingtonpaiva@senai.br', 'senha123', '11988826337', 0, 1, 25, 6),
(1009, 'AlunoTeste', '00000000000', '2000-10-15', 'alunoteste@mail.com', 'senha123', '11982226337', 0, 1, 25, 6);

INSERT INTO inforesp (rm, cod_resp) VALUES 
(1001, 1),
(1002, 2),
(1003, 3),
(1004, 4),
(1005, 4);

INSERT INTO infotrabalho (rm, cod_empresa) VALUES 
(1006, 5),
(1007, 6);