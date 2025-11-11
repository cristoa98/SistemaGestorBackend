import express from "express";
import morgan from "morgan";
import cors from "cors";
import { config } from "./config.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import itemRoutes from "./routes/items.routes.js";
import loanRoutes from "./routes/loans.routes.js";
import reqRoutes from "./routes/requests.routes.js";

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(cors({ origin: config.frontendOrigin, credentials: false }));


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/requests", reqRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// error handler
app.use((err, req, res, next) => {
  console.error("[error]", err);
  res.status(err.status || 500).json({ error: err.message || "Internal error" });
});

export default app;
