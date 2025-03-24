import fastify from "fastify";
import dotenv from "dotenv";

const app = fastify({ logger: true });
dotenv.config();

//TODO: FIXING ENV UNDEFINED
async function start(): Promise<void> {
    try {
        await app.listen({ port: Number(process.env.PORT) });
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
}

console.log("port: " + process.env.PORT);
console.log(process.env.BASE_ROUTE + "/healthcheck");

app.get(process.env.BASE_ROUTE + "/healthcheck", (_req, response) => {
    response.send({ message: "Success" });
});

start();
