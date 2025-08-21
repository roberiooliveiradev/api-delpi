// app.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import systemRouter from "./routes/systemRoutes.js";
import productRouter from "./routes/productRoutes.js";
import salesOrderRouter from "./routes/salesOrderRoutes.js";
import { jwtAuth } from "./middlewares/jwtAuth.js";

import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import yaml from "yaml";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega o YAML como objeto JS, com fallback seguro
const openapiPath = path.join(__dirname, "docs-api", "openapi.yaml");
let openapiDoc;
try {
    openapiDoc = yaml.parse(fs.readFileSync(openapiPath, "utf8"));
} catch (e) {
    console.warn(
        "⚠️ Não foi possível carregar docs-api/openapi.yaml. Usando fallback mínimo."
    );
    openapiDoc = {
        openapi: "3.0.3",
        info: { title: "API DELPI", version: "1.0.0" },
        paths: {},
    };
}

const app = express();

// Básico
app.use(express.json());
app.use(cors());

// JWT global (libera públicos)
app.use(
    jwtAuth({
        publicPaths: ["/health", "/api/docs", "/api/openapi.json"],
    })
);

// Swagger UI e JSON cru
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));
app.get("/api/openapi.json", (req, res) => res.json(openapiDoc));

// Rotas
app.use("/api/system", systemRouter);
app.use("/api/products", productRouter);
app.use("/api/sales-orders", salesOrderRouter);

// Healthcheck (público)
app.get("/health", (_req, res) => {
    res.status(200).send("API DELPI online e saudável!");
});

// ⚠️ NÃO dê app.listen aqui — exporte o app para testes
export default app;
