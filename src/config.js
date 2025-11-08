export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/gestor_local",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
};
