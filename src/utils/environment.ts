export const env = {
    ENVIRONMENT: process.env.ENVIRONMENT || "DEVELOPMENT",
    LOG_LEVEL: process.env.LOG_LEVEL || "debug",
    BREVO_API_KEY: process.env.BREVO_API_KEY || "default_api_key",
    LOG_TIME_FORMAT: process.env.LOG_TIME_FORMAT || "${day}:${month}:${year} ${hours}:${minutes} (${seconds}:${milliseconds})",
    JWT_SECRET: process.env.JWT_SECRET || "default_secret"
};
