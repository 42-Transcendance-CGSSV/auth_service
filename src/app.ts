import fastify from "fastify";
import dotenv from "dotenv";
import { registerRoutes } from "./routes/auth.routes";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "fastify-cookie";
import { env } from "./utils/environment";
import { createDatabase, dbPool } from "./database/database";
import { getTimestamp } from "./utils/timestamp.util";

const app = fastify({
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
dotenv.config();

const listeners: string[] = ["SIGINT", "SIGTERM"];
listeners.forEach((signal): void => {
    process.on(signal, async () => {
        console.log("");
        app.log.info(`Received ${signal}. Closing server...`);
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
    app.register(fastifyJwt, {
        secret: env.JWT_SECRET as string,
        cookie: {
            cookieName: "token",
            signed: false
        }
    });

    await app.listen({
        port: Number(env.PORT),
        host: "0.0.0.0"
    });
}

const startTime: number = getTimestamp();
createDatabase(app)
    .then(async () => {
        await registerRoutes(app);
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
