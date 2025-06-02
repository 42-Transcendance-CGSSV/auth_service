import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { changeAccountPicture } from "../services/account.service";
import { ISuccessResponse } from "../interfaces/response.interface";
import schema from "fluent-json-schema";
import { getPicturePath } from "../database/repositories/pictures.repository";

export async function registerPicturesRoutes(app: FastifyInstance): Promise<void> {
    app.post("/picture/upload", {
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

    app.get("/picture/:userId", {
        schema: {
            querystring: schema.object().prop("userId", schema.number()).required()
        },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const userId = (req.query as { userId: number }).userId;

            return rep.send({
                success: true,
                message: `Voici le path de la photo de profil de l'utilisateur ${userId}`,
                data: await getPicturePath(userId)
            } as ISuccessResponse);
        }
    });
    app.log.info("| Pictures routes registered");
}
