# SalesOrdersRepository.js

Repositório responsável por consultas de **Pedidos de Vendas**.

## Localização
`repository/SalesOrdersRepository.js`

## Descrição
Este repositório realiza consultas nas tabelas SC6010 (itens do pedido), SC5010 (cabeçalho), SB1010 (produtos) e SA1010 (clientes).

### Métodos

#### `getAllOrders({ page, limit, orderBy, filters })`
- Lista itens de pedidos com paginação, ordenação e filtros opcionais.
- **Parâmetros**:
  - `page`: número da página (default: 1)
  - `limit`: quantidade por página (default: 50, max: 200)
  - `orderBy`: colunas de ordenação (ex: `["C6_NUN ASC", "C6_ITEM ASC"]`)
  - `filters`: objeto com filtros opcionais (`nun`, `cli`, `loja`, `filial`, `produto`, `emissaoFrom`, `emissaoTo`, `pending`)

- **Retorno**:
```json
{
  "data": [ { ... } ],
  "page": 1,
  "limit": 50,
  "total": 123
}
```

#### `getOrderByNun(nun)`
- Retorna o **cabeçalho** e **itens** de um pedido específico.
- **Parâmetros**:
  - `nun`: código do pedido (C5/C6_NUN)
- **Retorno**:
```json
{
  "C5_NUN": "0001",
  "C5_EMISSAO": "2025-08-10",
  "C6_FILIAL": "01",
  "C6_CLI": "CL0001",
  "C6_LOJA": "01",
  "A1_NREDUZ": "Cliente ABC",
  "items": [ { ... } ]
}
```

---

## Observações
- Usa `poolPromise` para conexão com SQL Server.
- Sanitiza `orderBy` via `buildSafeOrderBy` (BaseRepository).
- Lança `ApiError(404)` quando o pedido não é encontrado.
