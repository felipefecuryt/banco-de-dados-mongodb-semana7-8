# Modelagem NoSQL com MongoDB — Catálogo de E-commerce

Entregável de Banco de Dados (Semanas 07 e 08). Modelagem de um catálogo de
e-commerce no MongoDB, aplicando os conceitos de bancos de dados NoSQL
orientados a documentos: arrays, subdocumentos, índices e consultas.

- **Banco:** `ecommerce_db`
- **Coleção principal:** `produtos`

## Estrutura do repositório

| Arquivo | Conteúdo |
|---|---|
| `01_insercao.js` | Parte 1 — criação do banco e da coleção, `insertMany()` com arrays e subdocumentos |
| `02_indices_consultas.js` | Parte 2 — índice simples, índice de texto e as 3 consultas com filtros variados |
| `03_desafio.js` | Parte 3 — consulta com `$elemMatch` e bônus com `.explain("executionStats")` |

## Como executar

Com uma instância do MongoDB rodando localmente (`mongodb://localhost:27017`):

```bash
mongosh --file 01_insercao.js
mongosh --file 02_indices_consultas.js
mongosh --file 03_desafio.js
```

Para uma conexão remota (Atlas, por exemplo):

```bash
mongosh "mongodb+srv://usuario:senha@cluster.mongodb.net/" --file 01_insercao.js
```

Os scripts são idempotentes: `01_insercao.js` faz `db.produtos.drop()` antes de
inserir, então podem ser reexecutados sem gerar dados duplicados.

## Parte 1 — Manipulação e inserção de dados

Banco criado com `use("ecommerce_db")` e 5 documentos inseridos em um único
`insertMany()`. Cada documento contém, obrigatoriamente:

- **Array simples:** `tags: ["eletronicos", "informatica", "promocao"]`
- **Subdocumento:** `fabricante: { nome, pais, contato: { email, telefone } }`
- **Array de subdocumentos:** `variacoes: [ { tamanho, cor, estoque } ]`

Exemplo da estrutura de um documento:

```js
{
  titulo: "Camiseta Basica Algodao Pima",
  descricao: "Camiseta de algodao pima com malha respiravel...",
  preco: 89.9,
  estoque_total: 140,
  tags: ["vestuario", "basico", "promocao"],
  fabricante: { nome: "Malha Nordeste", pais: "Brasil", contato: { /* ... */ } },
  variacoes: [
    { tamanho: "P", cor: "Branco", estoque: 40 },
    { tamanho: "M", cor: "Azul",   estoque: 35 }
  ]
}
```

## Parte 2 — Índices e consultas

### Índices criados

```js
db.produtos.createIndex({ preco: 1 }, { name: "idx_preco_asc" });
db.produtos.createIndex({ data_cadastro: -1 }, { name: "idx_data_desc" });

db.produtos.createIndex(
  { titulo: "text", descricao: "text" },
  { name: "idx_texto_titulo_descricao",
    default_language: "portuguese",
    weights: { titulo: 10, descricao: 3 } }
);
```

O MongoDB permite **apenas um índice de texto por coleção**, por isso `titulo` e
`descricao` entram no mesmo índice, com peso maior para o título.

### Consultas

1. **Operadores de comparação** — faixa de preço:
   ```js
   db.produtos.find({ preco: { $gt: 100, $lt: 1000 } }).sort({ preco: 1 })
   ```
2. **Valor dentro de um array** — a comparação direta com o campo do array já
   faz o match em qualquer elemento:
   ```js
   db.produtos.find({ tags: "promocao" })
   ```
3. **Índice de texto**:
   ```js
   db.produtos.find({ $text: { $search: "bluetooth ruido" } })
             .sort({ score: { $meta: "textScore" } })
   ```

Consultas extras incluídas no script: filtro em subdocumento por notação de
ponto (`"fabricante.pais": "Brasil"`) e busca parcial sem diferenciar
maiúsculas de minúsculas com `$regex` + `$options: "i"` — já que o `find`
comum é case-sensitive.

## Parte 3 — Desafio: `$elemMatch` e `.explain()`

### `$elemMatch`

Para filtrar um array de subdocumentos exigindo que **os critérios estejam no
mesmo elemento**:

```js
db.produtos.find({ variacoes: { $elemMatch: { tamanho: "M", cor: "Azul" } } })
```

Sem `$elemMatch`, os critérios podem casar em elementos **diferentes** do
array. O dataset tem um contra-exemplo proposital para isso — o *Moletom
Canguru Felpado*, com variações `{ M, Verde }` e `{ G, Azul }`: existe tamanho
`M` e existe cor `Azul`, mas nunca no mesmo item.

| Consulta | Resultado |
|---|---|
| `{ variacoes: { $elemMatch: { tamanho: "M", cor: "Azul" } } }` | 1 produto — apenas a Camiseta (que tem a variação `{ M, Azul }`) |
| `{ "variacoes.tamanho": "M", "variacoes.cor": "Azul" }` | 2 produtos — Camiseta **e** Moletom (falso positivo) |

O script `03_desafio.js` executa as duas versões em sequência para evidenciar a
diferença.

### Bônus — comprovação do uso do índice

```js
db.produtos.find({ preco: { $gt: 100, $lt: 1000 } }).explain("executionStats")
```

Métricas que comprovam o uso do índice `idx_preco_asc`:

| Métrica | Com índice (`preco`) | Sem índice (`estoque_total`) |
|---|---|---|
| `stage` | `IXSCAN` + `FETCH` | `COLLSCAN` |
| `totalKeysExamined` | > 0 (igual ao nº de chaves na faixa) | `0` |
| `totalDocsExamined` | apenas os documentos que casam | toda a coleção |

`totalKeysExamined > 0` indica que o banco percorreu a árvore do índice em vez
de varrer a coleção inteira. Em um `COLLSCAN`, `totalKeysExamined` é sempre `0`
e `totalDocsExamined` é igual a `countDocuments()`.

## Parte 4 — Reflexão

### Qual é a principal diferença de arquitetura entre *Embedding* e *Referencing* no MongoDB?

A diferença está em **onde o dado relacionado fisicamente mora**.

No **embedding**, o dado relacionado é gravado dentro do próprio documento, como
subdocumento ou array de subdocumentos. Tudo fica no mesmo registro em disco, o
que significa que uma única leitura traz o conjunto completo — não existe
`JOIN`, não existe segunda ida ao banco. A contrapartida é que o documento
cresce, e o MongoDB impõe um **limite rígido de 16 MB por documento**; além
disso, se o mesmo dado for incorporado em vários documentos, qualquer alteração
precisa ser propagada em todos eles (duplicação).

No **referencing**, o dado relacionado vive em outra coleção e o documento
guarda apenas o `_id` dele. Isso elimina duplicação e mantém os documentos
pequenos, mas exige uma segunda consulta ou um `$lookup` no pipeline de
agregação para montar o resultado completo — ou seja, troca-se performance de
leitura por normalização e consistência.

A regra prática é modelar **pelo padrão de acesso da aplicação**, não pela
estrutura lógica dos dados: *dados que são lidos juntos devem ficar juntos*.

### Em que cenário cada um deve ser usado?

**Embedding — use quando:**

- Os dados são **sempre lidos junto** com o documento pai. No catálogo deste
  projeto, `fabricante` e `variacoes` só fazem sentido no contexto do produto:
  a página do produto precisa do nome do fabricante e das combinações de
  tamanho/cor na mesma requisição.
- A relação é **um-para-um** ou **um-para-poucos** e limitada: endereço de
  entrega dentro do pedido, autor dentro de um post de blog, itens dentro de um
  pedido já fechado.
- O dado **muda pouco** ou precisa ser congelado no tempo. O preço e o nome do
  produto gravados dentro de um pedido devem continuar valendo os do momento da
  compra, mesmo que o catálogo mude depois.

**Referencing — use quando:**

- A relação é **muitos-para-muitos**. Produtos e categorias, posts e tags
  compartilhadas: cada lado é consultado de forma independente, então ambos
  viram coleções próprias ligadas por `_id`.
- O dado **muda com frequência** e é compartilhado. Se o fabricante fosse uma
  entidade com dezenas de produtos e seu contato mudasse, incorporá-lo exigiria
  atualizar todos os produtos; com referência, basta um `updateOne` na coleção
  `fabricantes`.
- O array pode **crescer sem limite** (*unbounded array*). Comentários de um
  post muito popular, avaliações de um produto best-seller ou o histórico de
  pedidos de um cliente devem ficar em coleção separada apontando para o pai —
  caso contrário o documento caminha para o teto de 16 MB e cada leitura passa a
  carregar dados que quase nunca são usados.
- A entidade referenciada é **consultada por si só**. Um cliente é pesquisado,
  editado e listado independentemente dos pedidos dele; portanto `pedidos`
  guarda `cliente_id`, não uma copia do cliente.

Na prática, modelos reais são **híbridos**: o pedido referencia
`cliente_id` (entidade própria, consultada isoladamente) e ao mesmo tempo
incorpora um snapshot dos itens comprados (dados que precisam ser imutáveis e
lidos junto). O mesmo vale para um blog: o `autor` pode ser embedado com apenas
`{ nome, _id }` para exibição imediata — o padrão *extended reference* — mantendo
a coleção `autores` como fonte de verdade.
