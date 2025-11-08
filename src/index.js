import app from "./app.js";
import { connectDB } from "./db.js";
import { config } from "./config.js";

await connectDB();
app.listen(config.port, () => console.log(`[api] escuchando en http://localhost:${config.port}`));
