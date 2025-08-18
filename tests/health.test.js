// tests/health.test.js

import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app.js"; // exporte o app no app.js para usar no teste

describe("Healthcheck", () => {
    it("deve retornar 200 no /health", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.text).toContain("API DELPI");
    });
});
