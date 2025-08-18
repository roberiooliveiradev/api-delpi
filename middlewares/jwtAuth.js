// middlewares/jwtAuth.js
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
