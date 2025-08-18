// tests/products.test.js

import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app.js"; // exporte o app no app.js para usar no teste

describe("Produtos", () => {
    const token = process.env.TEST_JWT; // defina no .env um token válido para testes

    it("sem token deve retornar 401", async () => {
        const res = await request(app).get("/api/products");
        expect(res.status).toBe(401);
    });

    it("com token deve retornar lista paginada", async () => {
        const res = await request(app)
            .get("/api/products?page=1&limit=2")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("data");
        expect(res.body).toHaveProperty("total");
    });
});
