# Middlewares — Documentação Técnica

> **Diretório:** `/middlewares`  
> **Stack:** Node.js + Express + bibliotecas auxiliares (Zod, Helmet, Pino, etc.)

---

## 1. asyncHandler.js

### Objetivo
Simplificar o tratamento de erros assíncronos em rotas Express, evitando repetição de `try/catch`.

### Implementação
```js
export const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
```

### Uso
```js
router.get("/rota", asyncHandler(async (req, res) => {
    const data = await service.getData();
    res.json(data);
}));
```

---

## 2. corsStrict.js

### Objetivo
Restringir origens permitidas no CORS de forma configurável via variável de ambiente.

### Variável de Ambiente
```dotenv
CORS_ORIGINS=https://site1.com,https://site2.com
```

### Implementação
- Aceita requisições sem `Origin` (ex.: `curl` ou Postman).
- Se `CORS_ORIGINS` não for definido, permite todas as origens.

```js
export const corsStrict = cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (ALLOWED.length === 0) return cb(null, true);
        return ALLOWED.includes(origin)
            ? cb(null, true)
            : cb(new Error("Origin not allowed"));
    },
});
```

---

## 3. errorHandler.js

### Objetivo
Padronizar o tratamento global de erros, retornando respostas JSON consistentes.

### Classe `ApiError`
```js
export class ApiError extends Error {
    constructor(status = 500, code = "INTERNAL_ERROR", message = "Erro inesperado", details = undefined) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}
```

### Middleware `errorHandler`
- Responde com `{ code, message, details?, requestId? }`.
- Loga o erro no console (em produção usar Pino/Winston).

```js
export function errorHandler(err, req, res, _next) {
    const status = err.status || 500;
    const payload = {
        code: err.code || "INTERNAL_ERROR",
        message: err.message || "Erro inesperado",
    };
    if (err.details) payload.details = err.details;
    if (req.id) payload.requestId = req.id;

    console.error(err);
    res.status(status).json(payload);
}
```

---

## 4. logger.js

### Objetivo
Log estruturado de requisições HTTP com **pino-http**.

### Implementação
```js
export const logger = pinoHttp({
    customProps: (req) => ({ requestId: req.id }),
    transport: process.env.PRETTY
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
});
```

- `PRETTY=1` → saída colorida e legível em dev.
- Inclui `requestId` nos logs para rastreabilidade.

---

## 5. notFound.js

### Objetivo
Gerar erro 404 padronizado para rotas inexistentes.

### Implementação
```js
export function notFound(_req, _res, next) {
    next({ status: 404, code: "NOT_FOUND", message: "Rota não encontrada" });
}
```

---

## 6. requestId.js

### Objetivo
Adicionar **ID único de requisição** para rastreamento e correlação de logs.

### Implementação
```js
import { randomUUID } from "node:crypto";

export function requestId(req, _res, next) {
    req.id = req.headers["x-request-id"] || randomUUID();
    next();
}
```

---

## 7. security.js

### Objetivo
Adicionar camadas de segurança HTTP e proteção contra abusos.

### Helmet
```js
export const helmetMiddleware = helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
});
```

### Rate Limiter
```js
export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        code: "RATE_LIMITED",
        message: "Muitas requisições, tente novamente mais tarde.",
    },
});
```

---

## 8. validate.js

### Objetivo
Validar `params`, `query` e `body` de requisições via **Zod**.

### Implementação
```js
export const validate = (schema) => (req, _res, next) => {
    try {
        const data = { params: req.params, query: req.query, body: req.body };
        schema.parse(data);
        next();
    } catch (err) {
        const issue = err.errors?.[0];
        next({
            status: 400,
            code: "BAD_REQUEST",
            message: issue?.message || "Parâmetros inválidos",
            details: err.errors,
        });
    }
};
```

### Exemplo
```js
const schema = z.object({
    params: z.object({ id: z.string().uuid() }),
});

router.get("/user/:id", validate(schema), (req, res) => {
    res.json({ ok: true });
});
```

---

## Boas Práticas

- Usar **requestId + logger** em conjunto para rastrear requisições.
- Configurar corretamente `CORS_ORIGINS` em produção.
- Retornar sempre payloads JSON padronizados (`code`, `message`, `details`).
- Ajustar limites de `rateLimiter` conforme a carga esperada.
- Manter `helmet` configurado com políticas coerentes de segurança.

