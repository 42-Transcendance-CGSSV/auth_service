import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { activateAccount, changeAccountPicture } from "../services/account.service";
import { ISuccessResponse } from "../interfaces/response.interface";
import { verifyJWT } from "../utils/jwt.util";

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
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const data = await req.file({
                limits: {
                    files: 1,
                    fileSize: 5242880
                }
            });

            await changeAccountPicture(data, (await verifyJWT(app, req)).id);

            return rep.send({
                success: true,
                message: "Le fichier a bien ete enregistre "
            } as ISuccessResponse);
        }
    });

    /*app.patch("/update-account", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {}
    });
     */

    app.log.info("| Account routes registered");
}
