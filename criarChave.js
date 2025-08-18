// criarChave.js
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

// Carregar as variáveis do .env
dotenv.config();

// Criar o token (payload + segredo + tempo de expiração)
const token = jwt.sign(
    { service: "gpt-agent" }, // Dados que vão dentro do token
    process.env.JWT_SECRET, // Mesma chave do JWT_SECRET do seu .env
    { expiresIn: "1d" } // Tempo de validade (1 dias neste exemplo)
);

console.log(token);
