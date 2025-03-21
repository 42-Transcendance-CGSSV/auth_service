import fastify from "fastify";

const app = fastify({ logger: true });

async function start(): Promise<void> {
    try {
        await app.listen({ port: 8080 });
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
}

app.get("/healthcheck", (_req, response) => {
    response.send({ message: "Success" });
});

start();
