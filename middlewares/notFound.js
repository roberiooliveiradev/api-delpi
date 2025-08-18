// middlewares/notFound.js
export function notFound(_req, _res, next) {
    next({ status: 404, code: "NOT_FOUND", message: "Rota não encontrada" });
}
