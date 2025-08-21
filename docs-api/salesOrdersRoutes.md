# salesOrdersRoutes.js

Rotas da API para **Pedidos de Vendas**.

## Localização
`routes/salesOrdersRoutes.js`

## Endpoints

### `GET /api/sales-orders`
Lista itens de pedidos com paginação e filtros.

- **Query params**:
  - `page` (int) – página (default: 1)
  - `limit` (int) – itens por página (default: 50, máx: 200)
  - `orderBy` (string) – ordenação CSV (`C6_NUN asc,C6_ITEM asc`)
  - `nun`, `cli`, `loja`, `filial`, `produto` – filtros
  - `emissaoFrom`, `emissaoTo` – intervalo de emissão (YYYY-MM-DD)
  - `pending` (bool) – `true` = pendente, `false` = entregue

- **Response 200**:
```json
{
  "data": [ { ... } ],
  "page": 1,
  "limit": 50,
  "total": 123
}
```

### `GET /api/sales-orders/{nun}`
Retorna o cabeçalho e os itens de um pedido específico.

- **Path param**:
  - `nun`: código do pedido

- **Response 200**:
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
- Usa `Zod` para validação de query e params.
- Usa `asyncHandler` para tratamento de erros.
- Protegido por JWT (herdado do `app.js`).
