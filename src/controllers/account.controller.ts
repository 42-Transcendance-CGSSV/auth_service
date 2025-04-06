import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { activateAccount, changeAccountPicture } from "../services/account.service";
import { ISuccessResponse } from "../interfaces/response.interface";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { getPicturePath } from "../database/repositories/pictures.repository";

export async function registerAccountRoutes(app: FastifyInstance): Promise<void> {
    app.post("/activate-account", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            await activateAccount(req);
            await rep.send({
                success: true,
                message: "Ce compte a ete active !"
            } as ISuccessResponse);
        }
    });

    app.post("/upload-picture", {
        handler: async (req: FastifyRequest, rep: FastifyReply): Promise<never | void> => {
            if (!req.publicUser) return;

            const data = await req.file({
                limits: {
                    files: 1,
                    fileSize: 1048576 * 3 // 3 Mo
                }
            });
            await changeAccountPicture(data, req.publicUser.id);
            return rep.send({
                success: true,
                message: "Le fichier a bien ete enregistre "
            } as ISuccessResponse);
        }
    });

    app.get("/get-picture/:userId", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            if (!req.query) {
                throw new ApiError(ApiErrorCode.INVALID_QUERY, "Veuillez inclure un id d'utilisateur dans la requete !");
            }
            const typedQuery = req.query as { userId: number };
            if (!typedQuery || !typedQuery.userId) {
                throw new ApiError(ApiErrorCode.INVALID_QUERY, "Veuillez inclure un id d'utilisateur dans la requete !");
            }

            const userId = typedQuery.userId;
            return rep.send({
                success: true,
                message: `Voici le path de la photo de profil de l'utilisateur ${userId}`,
                data: await getPicturePath(userId)
            } as ISuccessResponse);
        }
    });

    /*app.patch("/update-account", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {}
    });
     */

    app.log.info("| Account routes registered");
}
