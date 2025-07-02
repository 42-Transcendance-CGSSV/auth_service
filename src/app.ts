import fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyMultipart from "@fastify/multipart";
import { env } from "./utils/environment";
import { createDatabase, dbPool, vacuumOldTokens } from "./database/database";
import { getTimestamp } from "./utils/timestamp.util";
import { IErrorResponse } from "./interfaces/response.interface";
import { ApiError } from "./utils/errors.util";
import { registerAuthRoutes } from "./controllers/auth.controller";
import { registerTokensRoutes } from "./controllers/tokens.controller";
import AuthenticationMiddleware from "./middlewares/authentication.middleware";
import { registerAccountRoutes } from "./controllers/accounts.controller";
import { clearInterval } from "timers";
import { registerPicturesRoutes } from "./controllers/pictures.controller";
import { registerTotpRoutes } from "./controllers/totp.controller";
import fastifyCookie from "@fastify/cookie";

export const app = fastify({
    logger: {
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true
            }
        },
        enabled: true,
        level: env.LOG_LEVEL,
        timestamp: () => {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, "0");
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const year = String(now.getFullYear()).slice(-2);
            const hours = String(now.getHours()).padStart(2, "0");
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const seconds = String(now.getSeconds()).padStart(2, "0");
            const milliseconds = String(now.getMilliseconds());
            const logTime = env.LOG_TIME_FORMAT.replace("${day}", day)
                .replace("${month}", month)
                .replace("${year}", year)
                .replace("${hours}", hours)
                .replace("${minutes}", minutes)
                .replace("${seconds}", seconds)
                .replace("${milliseconds}", milliseconds);
            return `,"time":"${logTime}"`;
        }
    },
    disableRequestLogging: true
});

const listeners: string[] = ["SIGINT", "SIGTERM"];
listeners.forEach((signal): void => {
    process.on(signal, async () => {
        app.log.info(`Received ${signal}. Shutting down gracefully...`);
        if (vacuumOldTokens) {
            app.log.info("Stopping vacuum task...");
            clearInterval(vacuumOldTokens);
            app.log.info("Vacuum task stopped !");
        }
        app.log.info("Closing server...");
        await app.close();
        app.log.info("Server closed !");
        app.log.info("Clearing database connection pool...");
        await dbPool.clear();
        app.log.info("Database connection pool cleared !");
        app.log.info("Exiting process...");
        process.exit(0);
    });
});

async function start(): Promise<void> {
    app.register(fastifyCookie);
    app.register(fastifyMultipart);
    app.register(fastifyJwt, {
        secret: env.JWT_SECRET as string
    });

    app.setErrorHandler((error, _request, reply) => {
        if (error.name === "ApiError") {
            reply.code((error as ApiError).getHttpStatusCode()).send({
                success: false,
                errorCode: error.code,
                message: error.message
            } as IErrorResponse);
            return;
        }

        const statusCode = error.statusCode || 500;
        reply.status(statusCode).send({
            success: false,
            message: error.message,
            errorCode: error.code || "INTERNAL_SERVER_ERROR"
        } as IErrorResponse);
    });

    new AuthenticationMiddleware().register(app);

    await app.listen({
        port: 3000,
        host: "0.0.0.0"
    });
}

const startTime: number = getTimestamp();
createDatabase(app)
    .then(async () => {
        await registerAuthRoutes(app);
        await registerTotpRoutes(app);
        await registerTokensRoutes(app);
        await registerAccountRoutes(app);
        await registerPicturesRoutes(app);

        app.get("/healthcheck", (_req, response) => {
            response.send({ message: "Success" });
        });
        await start();
        const endTime: number = getTimestamp();
        app.log.info("Server started successfully ( " + (endTime - startTime) + "ms )");
    })
    .catch((error) => {
        app.log.fatal("An error occurred while starting the server");
        app.log.fatal("Please check the database connection and environment variables");
        if (error instanceof Error) {
            app.log.fatal(error.message);
        }
        process.exit(1);
    });
