// =====================================================================
// Parte 2 - Mini Projeto: Indices e Consultas
// Execucao: mongosh --file 02_indices_consultas.js
// Pre-requisito: rodar 01_insercao.js antes
// =====================================================================

use("ecommerce_db");
db = db.getSiblingDB("ecommerce_db");

// ---------------------------------------------------------------------
// 1. Indice simples em campo de alta consulta (filtros e ordenacao por preco)
// ---------------------------------------------------------------------
db.produtos.createIndex({ preco: 1 }, { name: "idx_preco_asc" });

// Indice auxiliar para ordenacao por data de cadastro (mais recentes primeiro)
db.produtos.createIndex({ data_cadastro: -1 }, { name: "idx_data_desc" });

// ---------------------------------------------------------------------
// 2. Indice de texto para busca textual
//    Atencao: o MongoDB permite apenas UM indice de texto por colecao,
//    por isso titulo e descricao entram no mesmo indice composto de texto.
// ---------------------------------------------------------------------
db.produtos.createIndex(
  { titulo: "text", descricao: "text" },
  {
    name: "idx_texto_titulo_descricao",
    default_language: "portuguese",
    weights: { titulo: 10, descricao: 3 } // titulo tem mais relevancia
  }
);

print("--- Indices da colecao produtos ---");
printjson(db.produtos.getIndexes());

// ---------------------------------------------------------------------
// 3. Consultas com filtros variados
// ---------------------------------------------------------------------

// 3.1 Operadores de comparacao: produtos entre R$ 100,00 e R$ 1.000,00
print("\n--- Consulta 1: preco > 100 e preco < 1000 ($gt / $lt) ---");
printjson(
  db.produtos
    .find(
      { preco: { $gt: 100, $lt: 1000 } },
      { titulo: 1, preco: 1, _id: 0 }
    )
    .sort({ preco: 1 })
    .toArray()
);

// 3.2 Valor dentro de um array: basta comparar com o campo do array
print("\n--- Consulta 2: produtos com a tag 'promocao' (busca em array) ---");
printjson(
  db.produtos
    .find({ tags: "promocao" }, { titulo: 1, tags: 1, _id: 0 })
    .toArray()
);

// 3.3 Busca usando o indice de texto
print("\n--- Consulta 3: $text $search 'bluetooth ruido' (indice de texto) ---");
printjson(
  db.produtos
    .find(
      { $text: { $search: "bluetooth ruido" } },
      { titulo: 1, score: { $meta: "textScore" }, _id: 0 }
    )
    .sort({ score: { $meta: "textScore" } })
    .toArray()
);

// 3.4 Consulta em subdocumento usando notacao de ponto
print("\n--- Consulta extra: fabricantes do Brasil (subdocumento) ---");
printjson(
  db.produtos
    .find(
      { "fabricante.pais": "Brasil" },
      { titulo: 1, "fabricante.nome": 1, _id: 0 }
    )
    .toArray()
);

// 3.5 Busca parcial sem diferenciar maiusculas de minusculas ($regex)
//     O find comum e case-sensitive; $regex com a opcao "i" resolve isso.
print("\n--- Consulta extra: $regex case-insensitive por 'camiseta' ---");
printjson(
  db.produtos
    .find({ titulo: { $regex: "camiseta", $options: "i" } }, { titulo: 1, _id: 0 })
    .toArray()
);
