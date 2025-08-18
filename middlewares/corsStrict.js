// middlewares/corsStrict.js
import cors from "cors";

const ALLOWED = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const corsStrict = cors({
    origin: (origin, cb) => {
        // Em dev, sem origem (curl/Postman) é ok
        if (!origin) return cb(null, true);
        if (ALLOWED.length === 0) return cb(null, true); // fallback: liberar tudo se não configurar
        return ALLOWED.includes(origin)
            ? cb(null, true)
            : cb(new Error("Origin not allowed"));
    },
});
