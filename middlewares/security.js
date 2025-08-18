// middlewares/security.js
import helmet from "helmet";
import rateLimit from "express-rate-limit";

export const helmetMiddleware = helmet({
    // Ajuste se precisar de crossOriginResourcePolicy mais permissivo
    crossOriginResourcePolicy: { policy: "same-site" },
});

export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 1000, // ajuste conforme carga
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        code: "RATE_LIMITED",
        message: "Muitas requisições, tente novamente mais tarde.",
    },
});
