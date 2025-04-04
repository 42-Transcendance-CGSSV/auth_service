import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { verifyJWT } from "../utils/jwt.util";
import { ISuccessResponse } from "../interfaces/response.interface";
import { IPublicUser } from "../interfaces/user.interface";

export async function TokenController(app: FastifyInstance): Promise<void> {
    app.get("/token/decode", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            // eslint-disable-next-line no-useless-catch
            const user: IPublicUser = await verifyJWT(app, req);
            return rep.send({
                success: true,
                data: user,
                message: "Ce token est valide, les informations contenues dedans ont été décodées !"
            } as ISuccessResponse);
        }
    }); //Récupération des informations de l'utilisateur authentifié

    app.get("/token/validate", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            await verifyJWT(app, req);
            return rep.send({
                success: true,
                message: "Ce token est valide !"
            } as ISuccessResponse);
        }
    }); //Vérification de la validité d’un token
}
