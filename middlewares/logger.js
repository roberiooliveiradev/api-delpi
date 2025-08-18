// middlewares/logger.js
import pinoHttp from "pino-http";

export const logger = pinoHttp({
    customProps: (req) => ({ requestId: req.id }),
    // Em dev: habilite PRETTY=1 no ambiente p/ saída legível
    transport: process.env.PRETTY
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
});
