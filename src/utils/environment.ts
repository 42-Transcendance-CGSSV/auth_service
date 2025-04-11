export const env = {
    ENVIRONMENT: process.env.ENVIRONMENT || "DEVELOPMENT",
    LOG_LEVEL: process.env.LOG_LEVEL || "debug",
    BREVO_API_KEY: process.env.BREVO_API_KEY || "default_api_key",
    LOG_TIME_FORMAT: process.env.LOG_TIME_FORMAT || "${day}:${month}:${year} ${hours}:${minutes} (${seconds}:${milliseconds})",
    PORT: (process.env.PORT as unknown as number) ? parseInt(process.env.PORT as string, 10) : 3000,
    DB_PATH: process.env.DB_PATH || "./data/auth_database.db",
    DB_TOKENS_TABLE: process.env.DB_TOKENS_TABLE || "tokens",
    DB_USERS_TABLE: process.env.DB_USERS_TABLE || "users",
    DB_VERIFICATIONS_TABLE: process.env.DB_TOKENS_TABLE || "verifications",
    DB_PICTURES_TABLE: process.env.DB_PICTURES_TABLES || "pictures",
    DB_2FA_TABLE: process.env.DB_2FA_TABLE || "2fa",
    JWT_SECRET: process.env.JWT_SECRET || "default_secret"
};
