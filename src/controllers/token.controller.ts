import { FastifyInstance } from "fastify";

export async function TokenController(app: FastifyInstance): Promise<void> {
    app.get("/token/decode", () => {}); //Récupération des informations de l'utilisateur authentifié
    app.get("/token/validate", () => {}); //Vérification de la validité d’un token
}
