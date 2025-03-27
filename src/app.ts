import fastify from "fastify";
import dotenv from "dotenv";
import { registerRoutes } from "./routes/auth.routes";

const app = fastify({
    logger: true,
    disableRequestLogging: true
});
dotenv.config();

//TODO: FIXING ENV UNDEFINED
async function start(): Promise<void> {
    try {
        await app.listen({
            port: Number(process.env.PORT),
            host: "0.0.0.0"
        });
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
}

const listeners: string[] = ["SIGINT", "SIGTERM"];
listeners.forEach((signal): void => {
    process.on(signal, async () => {
        await app.close();
        process.exit(0);
    });
});

registerRoutes(app);

app.get("/healthcheck", (_req, response) => {
    response.send({ message: "Success" });
});

start();
