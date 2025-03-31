import fastify from "fastify";
import dotenv from "dotenv";
import { registerRoutes } from "./routes/auth.routes";
import SegfaultHandler from "segfault-handler";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "fastify-cookie";
import fs from "fs";
import { createUsersTable } from "./database/repositories/user.repository";
import { createRefreshTokensTable } from "./database/repositories/tokens.repository";

const app = fastify({
    logger: {
        enabled: true,
        level: "debug"
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

//TODO: FIXING ENV UNDEFINED
async function start(): Promise<void> {
    SegfaultHandler.registerHandler("crash.log");
    fs.mkdir("./data/", { recursive: true }, (err) => {
        if (err) {
            app.log.error("An error occurred while creating the data directory", err);
            process.exit(1);
        }
    });

    const createStream = fs.createWriteStream("./data/auth_database.db");
    createStream.end();

    await createUsersTable();
    await createRefreshTokensTable();

    app.register(fastifyCookie);
    app.register(fastifyJwt, {
        secret: process.env.JWT_SECRET as string,
        cookie: {
            cookieName: "token",
            signed: false
        }
    });

    await app.listen({
        port: Number(process.env.PORT),
        host: "0.0.0.0"
    });
}

start();
registerRoutes(app);

app.get("/healthcheck", (_req, response) => {
    response.send({ message: "Success" });
});
