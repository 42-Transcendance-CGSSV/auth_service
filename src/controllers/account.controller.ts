import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { activateAccount, changeAccountPicture, getUser } from "../services/account.service";
import { ISuccessResponse } from "../interfaces/response.interface";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { getPicturePath } from "../database/repositories/pictures.repository";
import { updatePartialUser } from "../database/repositories/user.repository";
import HashUtil from "../utils/hash.util";
import schema from "fluent-json-schema";
import { IJwtPayload } from "../utils/jwt.util";
import { getAccountSchema, updateAccountSchema } from "../schemas/account.schema";

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

    app.patch("/update-account", {
        schema: { body: updateAccountSchema },
        handler: async (req: FastifyRequest, rep: FastifyReply): Promise<never | void> => {
            if (!req.publicUser) return;
            if (!req.body) throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Veuillez inclure un body a votre requete !");
            const fieldsToUpdate = ["name", "email", "password", "external_token"];
            if (req.body && typeof req.body === "object" && "password" in req.body && typeof req.body.password === "string") {
                req.body.password = await HashUtil.hashPassword(req.body.password);
            }
            await updatePartialUser(req.publicUser.id, req.body, fieldsToUpdate);
            return rep.send({
                success: true,
                message: "Le compte a bien ete mis a jour !"
            } as ISuccessResponse);
        }
    });

    app.get("/get-account/:user", {
        schema: { querystring: getAccountSchema },
        handler: async (req: FastifyRequest, rep: FastifyReply): Promise<never | void> => {
            const user: IJwtPayload = await getUser(req);
            if (!user) {
                throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver l'utilisateur");
            }

            return rep.send({
                success: true,
                message: `Voici les informations de l'utilisateur`,
                data: user
            } as ISuccessResponse);
        }
    });

    app.log.info("| Account routes registered");
}
