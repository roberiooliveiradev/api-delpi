// server.js
import app from "./app.js";

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API de DELPI está online em http://localhost:${PORT}`);
});
