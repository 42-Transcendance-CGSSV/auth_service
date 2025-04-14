import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ISuccessResponse } from "../interfaces/response.interface";
import LocalUser from "../classes/users/local.user";
import { getUserByKey } from "../database/repositories/user.repository";
import { generateUUID } from "../utils/uuid.util";
import { disableTotp, enableTotp, getTotpSecret } from "../database/repositories/totp.repository";
import { toSnakeCase } from "../utils/case.util";
import schema from "fluent-json-schema";
import { isGood } from "../utils/totp.util";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { generateJWT } from "../utils/jwt.util";
import { buildJwtCookie } from "../utils/cookies.util";

export async function registerTotp(app: FastifyInstance): Promise<void> {
    app.post("/totp/toggle", {
        handler: async (req: FastifyRequest, rep: FastifyReply): Promise<never | void> => {
            if (!req.publicUser) return;
            const user = await LocalUser.fromDatabase(getUserByKey("id", req.publicUser.id));
            const secretKey = generateUUID().replace("-", "");
            if (!user.twoFactorEnabled) {
                user.enableTwoFactor(secretKey);
                await enableTotp(user);
                return rep.send({
                    success: true,
                    data: toSnakeCase(secretKey),
                    message: "2FA ON"
                } as ISuccessResponse);
            } else {
                user.disableTwoFactor();
                await disableTotp(user.id);
                return rep.send({
                    success: true,
                    message: "2FA OFF"
                } as ISuccessResponse);
            }
        }
    }); //Permet d'activer / desactiver la connection a deux facteurs

    app.post("/totp/validate/:token", {
        schema: {
            querystring: schema.object().prop("token", schema.string()).required()
        },
        handler: async (req: FastifyRequest, rep: FastifyReply): Promise<void> => {
            if (!req.publicUser || !req.publicUser.hasTwoFactor || req.publicUser.hasPassedTwoFactor) return;
            const totpSecret = await getTotpSecret(req.publicUser.id);
            if (!isGood(totpSecret, (req.query as { token: string }).token)) {
                throw new ApiError(ApiErrorCode.UNAUTHORIZED, "Impossible de valider ce code 2FA");
            }
            req.publicUser.hasPassedTwoFactor = true;
            const jwt = generateJWT(app, req.publicUser, "5m");
            buildJwtCookie(jwt, rep, true);
            rep.send({
                success: true,
                data: {
                    token: jwt
                },
                message: "La 2FA a ete passe"
            } as ISuccessResponse);
        }
    });
    app.log.info("| ToTp routes registered");
}
