# app.js (alterações)

Arquivo principal da aplicação.

## Alterações necessárias

1. Importar o router de Pedidos de Vendas:

```js
import salesOrdersRouter from "./routes/salesOrdersRoutes.js";
```

2. Montar a rota no Express:

```js
app.use("/api/sales-orders", salesOrdersRouter);
```

3. Ordem de middlewares recomendada:

-   `requestId`
-   `logger`
-   `jwtAuth`
-   Routers (`system`, `products`, `sales-orders`)
-   `notFound`
-   `errorHandler`
