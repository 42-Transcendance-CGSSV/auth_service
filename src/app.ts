import fastify from "fastify";
import dotenv from "dotenv";
import { registerRoutes } from "./routes/auth.routes";
import SegfaultHandler from "segfault-handler";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "fastify-cookie";
import { env } from "./utils/environment";
import { createDatabase } from "./database/database";

const app = fastify({
    logger: {
        enabled: true,
        level: env.LOG_LEVEL,
        timestamp: () => {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, "0");
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const year = String(now.getFullYear()).slice(-2);
            const seconds = String(now.getSeconds()).padStart(2, "0");
            const milliseconds = String(now.getMilliseconds());
            const logTime = env.LOG_TIME_FORMAT.replace("${day}", day)
                .replace("${month}", month)
                .replace("${year}", year)
                .replace("${seconds}", seconds)
                .replace("${milliseconds}", milliseconds);
            return `,"time":"${logTime}"`;
        }
    },
    disableRequestLogging: false
});
dotenv.config();

const listeners: string[] = ["SIGINT", "SIGTERM"];
listeners.forEach((signal): void => {
    process.on(signal, async () => {
        await app.close();
        process.exit(0);
    });
});

async function start(): Promise<void> {
    SegfaultHandler.registerHandler("crash.log");

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

createDatabase(app)
    .then(async () => {
        await registerRoutes(app);
        app.get("/healthcheck", (_req, response) => {
            response.send({ message: "Success" });
        });
        await start();
    })
    .catch(() => process.exit(1));
