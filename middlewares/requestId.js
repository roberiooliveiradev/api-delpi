// middlewares/requestId.js
import { randomUUID } from "node:crypto";

export function requestId(req, _res, next) {
    // Respeita um header vindo de proxy/gateway ou gera um novo
    req.id = req.headers["x-request-id"] || randomUUID();
    next();
}
