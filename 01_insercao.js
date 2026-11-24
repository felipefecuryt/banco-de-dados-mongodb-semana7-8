// =====================================================================
// Parte 1 - Manipulacao e Insercao de Dados
// Banco: ecommerce_db  |  Colecao: produtos
// Execucao: mongosh < 01_insercao.js     ou    mongosh --file 01_insercao.js
// =====================================================================

// Seleciona (e cria, se nao existir) o banco de dados.
// O helper "use ecommerce_db" vale no shell interativo; a linha abaixo garante
// o mesmo efeito quando o arquivo e executado com "mongosh --file".
use("ecommerce_db");
db = db.getSiblingDB("ecommerce_db");

// Comeca limpo para o script poder ser reexecutado sem duplicar dados
db.produtos.drop();

// Insercao de multiplos documentos.
// Cada documento possui:
//   - array simples ......... tags
//   - subdocumento .......... fabricante { nome, pais }
//   - array de subdocumentos  variacoes [ { tamanho, cor, estoque } ]
db.produtos.insertMany([
  {
    titulo: "Notebook Ultrafino 14 polegadas",
    descricao:
      "Notebook leve com processador de baixo consumo, 16GB de memoria e SSD de 512GB, ideal para trabalho e estudo.",
    preco: 4299.9,
    estoque_total: 23,
    ativo: true,
    data_cadastro: new Date("2026-02-10T09:00:00Z"),
    tags: ["eletronicos", "informatica", "promocao"],
    fabricante: {
      nome: "TecnoLuz",
      pais: "Brasil",
      contato: { email: "vendas@tecnoluz.com.br", telefone: "+55 85 3344-1200" }
    },
    variacoes: [
      { tamanho: "14pol", cor: "Cinza", estoque: 15 },
      { tamanho: "14pol", cor: "Azul", estoque: 8 }
    ]
  },
  {
    titulo: "Camiseta Basica Algodao Pima",
    descricao:
      "Camiseta de algodao pima com malha respiravel, costura reforcada e modelagem reta unissex.",
    preco: 89.9,
    estoque_total: 140,
    ativo: true,
    data_cadastro: new Date("2026-03-02T14:30:00Z"),
    tags: ["vestuario", "basico", "promocao"],
    fabricante: {
      nome: "Malha Nordeste",
      pais: "Brasil",
      contato: { email: "sac@malhanordeste.com.br", telefone: "+55 81 3030-7788" }
    },
    variacoes: [
      { tamanho: "P", cor: "Branco", estoque: 40 },
      { tamanho: "M", cor: "Azul", estoque: 35 },
      { tamanho: "M", cor: "Preto", estoque: 30 },
      { tamanho: "G", cor: "Azul", estoque: 35 }
    ]
  },
  {
    titulo: "Moletom Canguru Felpado",
    descricao:
      "Moletom com capuz e bolso canguru, felpado por dentro, punhos em ribana.",
    preco: 189.9,
    estoque_total: 70,
    ativo: true,
    data_cadastro: new Date("2026-03-18T16:00:00Z"),
    tags: ["vestuario", "inverno"],
    fabricante: {
      nome: "Malha Nordeste",
      pais: "Brasil",
      contato: { email: "sac@malhanordeste.com.br", telefone: "+55 81 3030-7788" }
    },
    // Atencao: existe tamanho "M" e existe cor "Azul", mas NUNCA no mesmo item.
    // Este produto e o contra-exemplo usado em 03_desafio.js para mostrar
    // por que $elemMatch e necessario.
    variacoes: [
      { tamanho: "M", cor: "Verde", estoque: 40 },
      { tamanho: "G", cor: "Azul", estoque: 30 }
    ]
  },
  {
    titulo: "Fone de Ouvido Bluetooth com Cancelamento de Ruido",
    descricao:
      "Fone over-ear com cancelamento ativo de ruido, 30 horas de bateria e estojo de transporte.",
    preco: 749.0,
    estoque_total: 60,
    ativo: true,
    data_cadastro: new Date("2026-01-20T11:15:00Z"),
    tags: ["eletronicos", "audio", "importado"],
    fabricante: {
      nome: "SoundWave",
      pais: "China",
      contato: { email: "support@soundwave.cn", telefone: "+86 21 5555-9090" }
    },
    variacoes: [
      { tamanho: "Unico", cor: "Preto", estoque: 40 },
      { tamanho: "Unico", cor: "Azul", estoque: 20 }
    ]
  },
  {
    titulo: "Cafeteira Italiana de Aluminio 6 Doses",
    descricao:
      "Cafeteira moka de aluminio polido para fogao, extracao intensa e limpeza simples.",
    preco: 139.5,
    estoque_total: 85,
    ativo: true,
    data_cadastro: new Date("2026-04-05T08:45:00Z"),
    tags: ["casa", "cozinha", "promocao"],
    fabricante: {
      nome: "Casa Viva",
      pais: "Italia",
      contato: { email: "info@casaviva.it", telefone: "+39 02 7766-1122" }
    },
    variacoes: [
      { tamanho: "6 doses", cor: "Prata", estoque: 55 },
      { tamanho: "3 doses", cor: "Prata", estoque: 30 }
    ]
  }
]);

// Conferencia dos dados inseridos
print("Total de documentos inseridos:", db.produtos.countDocuments());
printjson(db.produtos.findOne({ titulo: /Notebook/ }));
