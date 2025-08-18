# jwtAuth.js — Documentação Técnica (Middleware de Autenticação JWT)

> **Arquivo fonte:** `middlewares/jwtAuth.js`  
> **Stack:** Node.js + Express + [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)

---

## Objetivo

Fornecer autenticação baseada em **JWT (Bearer Token)** para todas as rotas da API, com possibilidade de **definir exceções** (`publicPaths`) que não exigem autenticação.

---

## Código (resumido)

```js
import jwt from "jsonwebtoken";

export function jwtAuth(options = {}) {
    const { publicPaths = ["/health", "/api/docs", "/api/openapi.json"] } =
        options;

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        console.error("⚠️ JWT_SECRET não definido no .env");
    }

    return (req, res, next) => {
        // Liberar rotas públicas
        if (publicPaths.some((p) => req.path.startsWith(p))) return next();

        const authHeader = req.headers["authorization"];
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                code: "UNAUTHORIZED",
                message: "Token ausente ou mal formatado (use Bearer <token>)",
            });
        }

        const token = authHeader.substring(7);
        try {
            req.user = jwt.verify(token, JWT_SECRET);
            next();
        } catch (err) {
            return res.status(401).json({
                code: "UNAUTHORIZED",
                message: "Token inválido ou expirado",
            });
        }
    };
}
```

---

## Funcionamento

1. **Configuração inicial**
   - Recebe `options` com `publicPaths` (array de rotas que não exigem JWT).
   - Lê `JWT_SECRET` do `.env`. Caso não esteja definido, exibe alerta no console.

2. **Execução do middleware**
   - Verifica se a rota requisitada está em `publicPaths` → se sim, libera acesso sem validação.
   - Valida o header `Authorization`:
     - Deve começar com `Bearer `.
     - Caso contrário, responde `401 UNAUTHORIZED`.
   - Extrai o token e tenta validá-lo com `jwt.verify` usando `JWT_SECRET`.
     - Sucesso → adiciona `req.user` com o payload do token e chama `next()`.
     - Falha → responde `401 UNAUTHORIZED` com mensagem adequada.

---

## Opções (`options`)

- `publicPaths`  
  Array de caminhos que serão ignorados pela verificação de token.  
  **Padrão**: `["/health", "/api/docs", "/api/openapi.json"]`

Exemplo de uso:

```js
app.use(
    jwtAuth({
        publicPaths: ["/health", "/login", "/register"],
    })
);
```

---

## Variáveis de Ambiente

```dotenv
JWT_SECRET=chave_super_secreta
```

- **Obrigatório**: usado para assinar/verificar tokens.  
- Se não definido, middleware ainda funciona, mas exibirá alerta no console e não conseguirá validar tokens corretamente.

---

## Respostas de Erro

- **401 Unauthorized**
  ```json
  {
      "code": "UNAUTHORIZED",
      "message": "Token ausente ou mal formatado (use Bearer <token>)"
  }
  ```

  ou

  ```json
  {
      "code": "UNAUTHORIZED",
      "message": "Token inválido ou expirado"
  }
  ```

---

## Boas Práticas

- Use tokens com tempo de expiração curto (ex.: `15m`, `1h`).  
- Rotacione o `JWT_SECRET` regularmente.  
- Não exponha o segredo em logs ou commits.  
- Combine este middleware com **rate limiting** e **HTTPS** para segurança adicional.

---

## Próximos Passos

- Implementar **refresh token** para renovação de sessão.  
- Adicionar suporte a **roles/permissions** no payload do JWT.  
- Criar testes unitários cobrindo cenários de sucesso e falha.

