# openapi.yaml (adições)

## Nova tag
```yaml
tags:
  - name: Pedidos de Vendas
    description: "Consulta de pedidos de vendas (cabeçalho + itens)"
```

## Schemas adicionados
- `SalesOrderItem`
- `PaginatedSalesOrderItems`
- `SalesOrderDetail`

## Novos paths

### `GET /sales-orders`
- Lista itens de pedidos com paginação e filtros.

### `GET /sales-orders/{nun}`
- Retorna cabeçalho e itens de um pedido.
