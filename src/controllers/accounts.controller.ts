import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { activateAccount, getUserPayload } from "../services/account.service";
import { ISuccessResponse } from "../interfaces/response.interface";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { getUserByKey, updatePartialUser } from "../database/repositories/user.repository";
import HashUtil from "../utils/hash.util";
import { getAccountSchema, updateAccountSchema } from "../schemas/account.schema";
import { IPublicUser, toPublicUser } from "../interfaces/user.interface";
import schema from "fluent-json-schema";
import { needVerification } from "../database/repositories/verification.repository";
import { sendJwtCookie } from "../utils/cookies.util";
import { generateJWT } from "../utils/jwt.util";

export async function registerAccountRoutes(app: FastifyInstance): Promise<void> {
    app.get("/activate-account", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const userId = await activateAccount(req);
            const user = await getUserByKey("id", userId);
            sendJwtCookie(generateJWT(app, toPublicUser(user), "5m"), rep);
            await rep.send({
                success: true,
                message: "Ce compte a ete active !"
            } as ISuccessResponse);
        }
    });

    app.get("/need-activation/:userId", {
        schema: { querystring: schema.object().prop("user_id", schema.number().minimum(0)).required() },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const userId = (req.query as { userId: number }).userId;
            const needActivation = await needVerification(userId);
            await rep.send({
                success: true,
                // eslint-disable-next-line camelcase
                data: { need_activation: needActivation }
            } as ISuccessResponse);
        }
    });

    app.patch("/update-account", {
        schema: { body: updateAccountSchema },
        handler: async (req: FastifyRequest, rep: FastifyReply): Promise<never | void> => {
            if (!req.publicUser) return;
            if (!req.body) throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Veuillez inclure un body a votre requete !");
            const fieldsToUpdate = ["name", "email", "password"];
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
            const user: IPublicUser = await getUserPayload(req);
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
