// middlewares/errorHandler.js
export class ApiError extends Error {
    constructor(
        status = 500,
        code = "INTERNAL_ERROR",
        message = "Erro inesperado",
        details = undefined
    ) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

export function errorHandler(err, req, res, _next) {
    // Se for ApiError, usamos os campos; senão, converte (fallback 500)
    const status = err.status || 500;
    const payload = {
        code: err.code || "INTERNAL_ERROR",
        message: err.message || "Erro inesperado",
    };
    if (err.details) payload.details = err.details;

    // ID de correlação opcional (se você adicionar depois)
    if (req.id) payload.requestId = req.id;

    // Log básico (em prod troque por pino/winston)
    console.error(err);

    res.status(status).json(payload);
}
