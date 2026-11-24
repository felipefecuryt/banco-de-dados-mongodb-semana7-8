// =====================================================================
// Parte 3 - Tarefa de Casa (Desafio): $elemMatch e .explain()
// Execucao: mongosh --file 03_desafio.js
// Pre-requisito: rodar 01_insercao.js e 02_indices_consultas.js antes
// =====================================================================

use("ecommerce_db");
db = db.getSiblingDB("ecommerce_db");

// ---------------------------------------------------------------------
// 1. $elemMatch - filtrando um array de subdocumentos
//    Objetivo: achar produtos que tenham UMA MESMA variacao com
//              tamanho "M" E cor "Azul" no mesmo elemento do array.
// ---------------------------------------------------------------------
print("--- $elemMatch: variacao com tamanho 'M' E cor 'Azul' no mesmo item ---");
printjson(
  db.produtos
    .find(
      { variacoes: { $elemMatch: { tamanho: "M", cor: "Azul" } } },
      { titulo: 1, variacoes: 1, _id: 0 }
    )
    .toArray()
);

// Comparacao didatica: sem $elemMatch os criterios podem casar em
// elementos DIFERENTES do array, retornando resultados indesejados.
// Esperado: retorna tambem o "Moletom Canguru Felpado", que tem
// { tamanho: "M", cor: "Verde" } e { tamanho: "G", cor: "Azul" } -
// ou seja, tem "M" e tem "Azul", mas nunca no mesmo item (falso positivo).
print("\n--- Sem $elemMatch (criterios podem casar em itens diferentes) ---");
printjson(
  db.produtos
    .find(
      { "variacoes.tamanho": "M", "variacoes.cor": "Azul" },
      { titulo: 1, _id: 0 }
    )
    .toArray()
);

// $elemMatch combinado com operador de comparacao:
// variacao azul com estoque acima de 30 unidades
print("\n--- $elemMatch + $gt: cor 'Azul' com estoque > 30 ---");
printjson(
  db.produtos
    .find(
      { variacoes: { $elemMatch: { cor: "Azul", estoque: { $gt: 30 } } } },
      { titulo: 1, variacoes: 1, _id: 0 }
    )
    .toArray()
);

// ---------------------------------------------------------------------
// 2. BONUS - .explain("executionStats")
//    Comprova que o indice idx_preco_asc esta sendo usado.
//    Metricas importantes:
//      stage              -> deve ser IXSCAN (e nao COLLSCAN)
//      totalKeysExamined  -> chaves de indice lidas (> 0 indica uso do indice)
//      totalDocsExamined  -> documentos lidos do disco
// ---------------------------------------------------------------------
print("\n--- explain('executionStats') da consulta por faixa de preco ---");
const plano = db.produtos
  .find({ preco: { $gt: 100, $lt: 1000 } })
  .explain("executionStats");

printjson(plano.executionStats);

print("\n--- Resumo das metricas ---");
print("Stage vencedor .......:", plano.queryPlanner.winningPlan.inputStage
  ? plano.queryPlanner.winningPlan.inputStage.stage
  : plano.queryPlanner.winningPlan.stage);
print("Indice utilizado .....:", JSON.stringify(
  plano.queryPlanner.winningPlan.inputStage
    ? plano.queryPlanner.winningPlan.inputStage.indexName
    : "nenhum (COLLSCAN)"
));
print("nReturned ............:", plano.executionStats.nReturned);
print("totalKeysExamined ....:", plano.executionStats.totalKeysExamined);
print("totalDocsExamined ....:", plano.executionStats.totalDocsExamined);
print("executionTimeMillis ..:", plano.executionStats.executionTimeMillis);

// Comparativo: a mesma faixa de valores em um campo SEM indice
// resulta em COLLSCAN e totalKeysExamined = 0.
print("\n--- Comparativo: consulta em campo sem indice (estoque_total) ---");
const planoSemIndice = db.produtos
  .find({ estoque_total: { $gt: 50 } })
  .explain("executionStats");
print("Stage ................:", planoSemIndice.queryPlanner.winningPlan.stage);
print("totalKeysExamined ....:", planoSemIndice.executionStats.totalKeysExamined);
print("totalDocsExamined ....:", planoSemIndice.executionStats.totalDocsExamined);
