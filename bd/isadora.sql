CREATE DATABASE justificaSaida;
USE justificaSaida;

create table aluno_menor (
rm int primary key,
data_nasc date not null,
nome_aluno varchar (255) not null,
email_aluno varchar(255) not null,
senha varchar (8) not null,
cpf  varchar (11) not null,
tel_aluno int not null,
nome_resp varchar (255) not null,
tel_resp int not null,
email_resp varchar (100) not null,
primeiro_acesso boolean default true
);

create table aluno_menor_trabalha (
rm int primary key,
data_nasc date not null,
nome_aluno varchar (255) not null,
email_aluno varchar(255) not null,
senha varchar (8) not null,
cpf  varchar (11) not null,
tel_aluno int not null,
nome_resp varchar (255) not null,
tel_resp int not null,
email_resp varchar (100) not null,
nome_empresa varchar (255) not null,
email_empresa varchar (255) not null,
primeiro_acesso boolean default true
);

create table aluno_maior_trabalha (
rm int primary key,
data_nasc date not null,
nome_aluno varchar (255) not null,
email_aluno varchar(255) not null,
senha varchar (8) not null,
cpf  varchar (11) not null,
tel_aluno int not null,
nome_empresa varchar (255) not null,
email_empresa varchar (255) not null,
primeiro_acesso boolean default true
);

create table aluno_maior (
rm int primary key,
data_nasc date not null,
nome_aluno varchar (255) not null,
email_aluno varchar(255) not null,
senha varchar (8) not null,
cpf  varchar (11) not null,
tel_aluno int not null,
primeiro_acesso boolean default true
);

create table gestor(
email_gestor varchar(255) not null,
tel_gestor int not null,
nif int primary key not null,
cargo varchar(255) not null,
primeiro_acesso boolean default true,
senha varchar (8) not null
);

create table saida (
cod_saida int primary key auto_increment,
rm int not null,
data_hora_saida datetime not null,
ciencia_gestor boolean not null,
nif int not null,
cod_atestado int not null
);

create table falta (
cod_falta int primary key auto_increment,
data_falta date not null
);

create table justificativa (
cod_justificativa int primary key auto_increment,
data_justificativa date not null,
cod_atestado int not null,
nif int not null
);

create table curso (
cod_curso int primary key auto_increment,
nome_curso varchar (255) not null,
tipo_curso varchar (255) not null,
turma_curso int not null
);


ALTER TABLE aluno_menor ADD cod_curso int not null;
ALTER TABLE aluno_menor_trabalha ADD cod_curso int not null;
ALTER TABLE aluno_maior ADD cod_curso int not null;
ALTER TABLE aluno_maior_trabalha ADD cod_curso int not null;

alter table justificativa
add column cod_saida int not null,
add constraint foreign key (cod_saida)
references saida (cod_saida);

alter table falta
add column cod_saida int not null;

alter table aluno_menor
add constraint foreign key (cod_curso)
references curso (cod_curso);

alter table aluno_menor_trabalha
add constraint foreign key (cod_curso)
references curso (cod_curso);

alter table aluno_maior
add constraint foreign key (cod_curso)
references curso (cod_curso);

alter table aluno_maior_trabalha
add constraint foreign key (cod_curso)
references curso (cod_curso);


INSERT INTO curso (cod_curso, nome_curso, tipo_curso, turma_curso)
VALUES
(1, 'Desenvolvimento de Sistemas', 'Técnico', 101),
(2, 'Mecânica', 'Técnico', 102),
(3, 'Panificação', 'Técnico', 103),
(4, 'Elétrica', 'Técnico', 104),
(5, 'Eletroeletronica', 'Técnico', 105),
(6, 'Eletromecanica', 'Técnico', 106),
(7, 'Logística', 'Técnico', 107),
(8, 'Mecatrônica', 'Técnico', 108),
(9, 'Metalurgia', 'Técnico', 109),
(10, 'Torno', 'Técnico', 110);


INSERT INTO curso (cod_curso, nome_curso, tipo_curso, turma_curso)
VALUES
(11, 'Desenvolvimento de Sistemas', 'Técnico', 111);

INSERT INTO aluno_menor (rm, data_nasc, nome_aluno, email_aluno, senha, cpf, tel_aluno, nome_resp, tel_resp, email_resp, cod_curso, primeiro_acesso)
VALUES
(1001, '2010-04-15', 'João Silva', 'joao.silva@mail.com', 'senha123', '12345678901', 11987654321, 'Maria Silva', 11987654322, 'maria.silva@mail.com', 1, true),
(1002, '2009-08-23', 'Ana Pereira', 'ana.pereira@mail.com', 'senha456', '10987654321', 11987654323, 'Carlos Pereira', 11987654324, 'carlos.pereira@mail.com', 2, true),
(1003, '2011-01-10', 'Lucas Santos', 'lucas.santos@mail.com', 'senha789', '98765432101', 11987654325, 'Fernanda Santos', 11987654326, 'fernanda.santos@mail.com', 3, true),
(1004, '2009-12-12', 'Mariana Oliveira', 'mariana.oliveira@mail.com', 'senha101', '19876543210', 11987654327, 'Paulo Oliveira', 11987654328, 'paulo.oliveira@mail.com', 4, true),
(1005, '2010-07-19', 'Pedro Costa', 'pedro.costa@mail.com', 'senha202', '23456789012', 11987654329, 'Ana Costa', 11987654330, 'ana.costa@mail.com', 5, true),
(1006, '2009-06-25', 'Beatriz Lima', 'beatriz.lima@mail.com', 'senha303', '34567890123', 11987654331, 'José Lima', 11987654332, 'jose.lima@mail.com', 6, true),
(1007, '2011-09-30', 'Gabriel Almeida', 'gabriel.almeida@mail.com', 'senha404', '45678901234', 11987654333, 'Patrícia Almeida', 11987654334, 'patricia.almeida@mail.com', 7, true),
(1008, '2010-11-11', 'Isabela Ferreira', 'isabela.ferreira@mail.com', 'senha505', '56789012345', 11987654335, 'Rafael Ferreira', 11987654336, 'rafael.ferreira@mail.com', 8, true),
(1009, '2009-03-05', 'Ricardo Rocha', 'ricardo.rocha@mail.com', 'senha606', '67890123456', 11987654337, 'Sandra Rocha', 11987654338, 'sandra.rocha@mail.com', 9, true),
(1010, '2010-02-20', 'Sofia Mendes', 'sofia.mendes@mail.com', 'senha707', '78901234567', 11987654339, 'Marcos Mendes', 11987654340, 'marcos.mendes@mail.com', 10, true);

INSERT INTO aluno_menor_trabalha (rm, data_nasc, nome_aluno, email_aluno, senha, cpf, tel_aluno, nome_resp, tel_resp, email_resp, nome_empresa, email_empresa, cod_curso, primeiro_acesso)
VALUES
(1011, '2009-04-22', 'Larissa Sousa', 'larissa.sousa@mail.com', 'senha808', '89012345678', 11987654341, 'Roberto Sousa', 11987654342, 'roberto.sousa@mail.com', 'TechEmpresa', 'rh@supermercadox.com', 1, true),
(1012, '2010-10-13', 'Thiago Gomes', 'thiago.gomes@mail.com', 'senha909', '90123456789', 11987654343, 'Luciana Gomes', 11987654344, 'luciana.gomes@mail.com', 'TechCars', 'contato@lojay.com', 2, true),
(1013, '2009-12-25', 'Carolina Ribeiro', 'carolina.ribeiro@mail.com', 'senha010', '01234567890', 11987654345, 'Eduardo Ribeiro', 11987654346, 'eduardo.ribeiro@mail.com', 'PadariasForno', 'adm@escritorioz.com', 3, true),
(1014, '2011-02-18', 'Felipe Costa', 'felipe.costa@mail.com', 'senha111', '12345098765', 11987654347, 'Marta Costa', 11987654348, 'marta.costa@mail.com', 'Luzenergia', 'rh@empresaA.com', 4, true),
(1015, '2010-09-23', 'Giovana Neves', 'giovana.neves@mail.com', 'senha212', '23456098765', 11987654349, 'Jorge Neves', 11987654350, 'jorge.neves@mail.com', 'Enel', 'contato@comerciob.com', 5, true),
(1016, '2009-06-14', 'Rafael Martins', 'rafael.martins@mail.com', 'senha313', '34567098765', 11987654351, 'Cláudia Martins', 11987654352, 'claudia.martins@mail.com', 'Fiocompany', 'oficina@c.com', 6, true),
(1017, '2010-07-07', 'Júlia Cardoso', 'julia.cardoso@mail.com', 'senha414', '45678098765', 11987654353, 'Fernando Cardoso', 11987654354, 'fernando.cardoso@mail.com', 'Correios', 'rh@empresaD.com', 7, true),
(1018, '2009-08-08', 'Matheus Teixeira', 'matheus.teixeira@mail.com', 'senha515', '56789098765', 11987654355, 'Raquel Teixeira', 11987654356, 'raquel.teixeira@mail.com', 'Maquinashoje', 'contato@supermercadoe.com', 8, true),
(1019, '2011-11-19', 'Livia Fernandes', 'livia.fernandes@mail.com', 'senha616', '67890109876', 11987654357, 'Ricardo Fernandes', 11987654358, 'ricardo.fernandes@mail.com', 'Ferroecia', 'contato@lojaf.com', 9, true),
(1020, '2010-12-12', 'Bruno Carvalho', 'bruno.carvalho@mail.com', 'senha717', '78901219876', 11987654359, 'Márcia Carvalho', 11987654360, 'marcia.carvalho@mail.com', 'PeçasTorneadas.cia', 'adm@escritoriog.com', 10, true);


INSERT INTO aluno_maior (rm, data_nasc, nome_aluno, email_aluno, senha, cpf, tel_aluno, cod_curso, primeiro_acesso)
VALUES
(1021, '2003-05-12', 'Amanda Lima', 'amanda.lima@mail.com', 'senha818', '89012309876', 11987654361, 1, true),
(1022, '2002-09-10', 'Gustavo Torres', 'gustavo.torres@mail.com', 'senha919', '90123409876', 11987654362, 2, true),
(1023, '2001-01-30', 'Fernanda Souza', 'fernanda.souza@mail.com', 'senha020', '01234509876', 11987654363, 3, true),
(1024, '2004-12-15', 'Leonardo Alves', 'leonardo.alves@mail.com', 'senha121', '12345098765', 11987654364, 4, true),
(1025, '2005-07-25', 'Camila Costa', 'camila.costa@mail.com', 'senha222', '23456098765', 11987654365, 5, true),
(1026, '2000-10-02', 'Eduardo Cunha', 'eduardo.cunha@mail.com', 'senha323', '34567098765', 11987654366, 6, true),
(1027, '2003-03-08', 'Isabela Cardoso', 'isabela.cardoso@mail.com', 'senha424', '45678098765', 11987654367, 7, true),
(1028, '2002-05-19', 'Renato Oliveira', 'renato.oliveira@mail.com', 'senha525', '56789098765', 11987654368, 8, true),
(1029, '2001-11-20', 'Luciana Mendes', 'luciana.mendes@mail.com', 'senha626', '67890109876', 11987654369, 9, true),
(1030, '2004-08-03', 'Marcos Silva', 'marcos.silva@mail.com', 'senha727', '78901219876', 11987654370, 10, true);


INSERT INTO aluno_maior_trabalha (rm, data_nasc, nome_aluno, email_aluno, senha, cpf, tel_aluno, nome_empresa, email_empresa, cod_curso, primeiro_acesso)
VALUES
(1031, '2003-01-05', 'Bianca Santos', 'bianca.santos@mail.com', 'senha828', '89012398765', 11987654371, 'TechEmpresa', 'rh@empresaH.com', 1, true),
(1032, '2002-06-22', 'Gabriel Silva', 'gabriel.silva@mail.com', 'senha929', '90123498765', 11987654372, 'TechCars', 'contato@lojai.com', 2, true),
(1033, '2000-03-18', 'Helena Souza', 'helena.souza@mail.com', 'senha030', '01234598765', 11987654373, 'PadariasForno', 'contato@comercioj.com', 3, true),
(1034, '2004-09-30', 'Vitor Lima', 'vitor.lima@mail.com', 'senha131', '12345698765', 11987654374, 'Luzenergia', 'contato@supermercadok.com', 4, true),
(1035, '2001-05-14', 'Isabel Cunha', 'isabel.cunha@mail.com', 'senha232', '23456798765', 11987654375, 'Enel', 'adm@escritoriol.com', 5, true),
(1036, '2000-11-27', 'Lucas Ribeiro', 'lucas.ribeiro@mail.com', 'senha333', '34567898765', 11987654376, 'Fiocompany', 'rh@empresaM.com', 6, true),
(1037, '2002-10-09', 'Mariana Oliveira', 'mariana.oliveira@mail.com', 'senha434', '45678998765', 11987654377, 'Correios', 'oficina@n.com', 7, true),
(1038, '2003-07-05', 'Rodrigo Almeida', 'rodrigo.almeida@mail.com', 'senha535', '56789098765', 11987654378, 'Maquinashoje', 'rh@empresaO.com', 8, true),
(1039, '2004-04-08', 'Talita Rocha', 'talita.rocha@mail.com', 'senha636', '67890109876', 11987654379, 'Ferroecia', 'contato@lojap.com', 9, true),
(1040, '2001-11-23', 'Vinicius Mendes', 'vinicius.mendes@mail.com', 'senha737', '78901219876', 11987654380, 'PeçasTorneadas.cia', 'adm@escritorioq.com', 10, true);


INSERT INTO gestor (email_gestor, tel_gestor, nif, cargo, primeiro_acesso, senha)
VALUES
('rosana.gestor@mail.com', 11987654381, 101, 'Analista', true, 'senha001'),
('moraes.gestor@mail.com', 11987654382, 102, 'Coordenador', true , 'senha002');

INSERT INTO saida (rm, data_hora_saida, ciencia_gestor, nif, cod_atestado)
VALUES
(1001, '2024-09-10 14:30:00', true, 101, 1),
(1002, '2024-09-10 15:00:00', false, 102, 2),
(1003, '2024-09-11 10:00:00', true, 101, 3),
(1004, '2024-09-11 11:30:00', true, 102, 4),
(1005, '2024-09-12 09:15:00', false, 101, 5);

INSERT INTO falta (data_falta, cod_saida)
VALUES
('2024-09-10', 1),
('2024-09-10', 2),
('2024-09-11', 3),
('2024-09-11', 4),
('2024-09-12', 5);

INSERT INTO justificativa (data_justificativa, cod_atestado, nif, cod_saida)
VALUES
('2024-09-11', 1, 101, 1),
('2024-09-12', 2, 102, 2),
('2024-09-13', 3, 101, 3),
('2024-09-14', 4, 102, 4),
('2024-09-15', 5, 101, 5);