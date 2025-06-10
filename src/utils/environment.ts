import dotenv from "dotenv";

dotenv.config();

export const env = {
    ENVIRONMENT: process.env.ENVIRONMENT || "DEVELOPMENT",
    LOG_LEVEL: process.env.LOG_LEVEL || "debug",
    BREVO_API_KEY: process.env.BREVO_API_KEY || "default_api_key",
    LOG_TIME_FORMAT: process.env.LOG_TIME_FORMAT || "${day}:${month}:${year} ${hours}:${minutes} (${seconds}:${milliseconds})",
    DB_PATH: process.env.DB_PATH || "./data/auth_database.db",
    DB_TOKENS_TABLE: process.env.DB_TOKENS_TABLE || "tokens",
    DB_USERS_TABLE: process.env.DB_USERS_TABLE || "users",
    DB_VERIFICATIONS_TABLE: process.env.DB_TOKENS_TABLE || "verifications",
    DB_PICTURES_TABLE: process.env.DB_PICTURES_TABLES || "pictures",
    DB_TOTP_TABLE: process.env.DB_TOTP_TABLE || "two_factor",
    JWT_SECRET: process.env.JWT_SECRET || "default_secret"
};
