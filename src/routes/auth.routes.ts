import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";

export async function registerRoutes(app: FastifyInstance): Promise<void> {
    await AuthController(app);
}
