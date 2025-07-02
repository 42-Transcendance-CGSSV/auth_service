import dotenv from "dotenv";

dotenv.config();

const allowedLogLevels = ["debug", "info", "warn", "error"];
const logLevel = allowedLogLevels.includes(process.env.LOG_LEVEL || "") ? process.env.LOG_LEVEL : "debug";

export const env = {
    ENVIRONMENT: process.env.ENVIRONMENT || "DEVELOPMENT",
    LOG_LEVEL: logLevel,
    COOKIE_SECRET: process.env.COOKIE_SECRET || "default_cookie_secret",
    BREVO_API_KEY: process.env.BREVO_API_KEY || "default_api_key",
    LOG_TIME_FORMAT: process.env.LOG_TIME_FORMAT || "${day}:${month}:${year} ${hours}:${minutes} (${seconds}:${milliseconds})",
    JWT_SECRET: process.env.JWT_SECRET || "default_secret",
    IP: process.env.IP || "127.0.0.1",
    NGINX_PORT: 25565
};
