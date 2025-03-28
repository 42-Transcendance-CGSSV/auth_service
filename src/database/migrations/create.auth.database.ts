import { FastifyInstance } from "fastify";

function createAuthDatabase(app: FastifyInstance): Promise<void> {
    return app.db.exec("CREATE DATABASE IF NOT EXISTS transcendence_auth");
}

export default createAuthDatabase;
