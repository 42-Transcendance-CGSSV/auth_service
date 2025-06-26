import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { generateJWT } from "../utils/jwt.util";
import { ISuccessResponse } from "../interfaces/response.interface";
import { totpVerifySchema } from "../schemas/auth.schema";
import { IProtectedUser, toPublicUser } from "../interfaces/user.interface";
import { generateTotpQrCode, totpCodeIsValid } from "../utils/totp.util";
import { getUserByKey } from "../database/repositories/user.repository";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { disableTotpProtection, enableTotpProtection } from "../services/auth.service";
import { toSnakeCase } from "../utils/case.util";
import { sendJwtCookie } from "../utils/cookies.util";
import schema from "fluent-json-schema";

export async function registerTotpRoutes(app: FastifyInstance): Promise<void> {
    app.post("/totp/verify", {
        schema: { querystring: totpVerifySchema },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            if (!req.query || typeof req.query !== "object") {
                throw new ApiError(ApiErrorCode.INVALID_QUERY, "Votre requete n'est pas valide !");
            }

            if (!("code" in req.query && "user_id" in req.query)) {
                throw new ApiError(ApiErrorCode.MISSING_REQUIRED_FIELD, "Veuillez inclure un code et un user_id dans votre requete !");
            }

            const user: IProtectedUser = await getUserByKey("id", req.query.user_id as number);
            if (!user) {
                throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver l'utilisateur ayant cet id !");
            }

            if (!user.totpSecret) {
                throw new ApiError(ApiErrorCode.INSUFFICIENT_PERMISSIONS, "L'utilisateur n'a pas de secret TOTP !");
            }

            const codeIsValid = totpCodeIsValid(user.totpSecret, req.query.code as string);

            if (!codeIsValid) {
                throw new ApiError(ApiErrorCode.INVALID_TOKEN, "Le code TOTP est invalide !");
            }

            user.hasPassedTotp = true;
            sendJwtCookie(generateJWT(app, toPublicUser(user), "5m"), rep);
            rep.send({
                success: true,
                message: "Le code TOTP est valide !"
            } as ISuccessResponse);
        }
    });

    app.get("/totp", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            if (!req.publicUser) return;

            const user = await getUserByKey("id", req.publicUser.id);
            const totpData = toSnakeCase({
                totpEnabled: user.totpEnabled,
                totpSecret: user.totpSecret,
                qrCode: await generateTotpQrCode(user.totpSecret, user.name)
            });

            rep.send({
                success: true,
                message: "Voici vos informations TOTP",
                data: { ...totpData }
            } as ISuccessResponse);
        }
    });

    app.post("/totp", {
        schema: {
            body: schema.object().prop(
                "code",
                schema
                    .string()
                    .pattern(/^\d{6,}$/)
                    .required()
            )
        },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            if (!req.publicUser) return;
            if (req.publicUser.totpEnabled)
                throw new ApiError(ApiErrorCode.UNPROCESSABLE_ENTITY, "Vous avez déjà activé la protection TOTP !");
            const { code } = req.body as { code: number };

            const codes = await enableTotpProtection(req.publicUser.id, code);
            const returnedData = { backupCodes: codes };

            const user = await getUserByKey("id", req.publicUser.id);
            user.hasPassedTotp = true;
            user.totpEnabled = true;
            sendJwtCookie(generateJWT(app, user, "5m"), rep);
            rep.send({
                success: true,
                message: "La fonctionnalité TOTP a été activée !",
                data: toSnakeCase(returnedData)
            } as ISuccessResponse);
        }
    });

    app.delete("/totp", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            if (!req.publicUser) return;
            if (!req.publicUser.totpEnabled) throw new ApiError(ApiErrorCode.UNAUTHORIZED, "Vous n'avez pas la protection totp !");
            await disableTotpProtection(req.publicUser.id);

            req.publicUser.totpEnabled = false;
            req.publicUser.hasPassedTotp = false;
            sendJwtCookie(generateJWT(app, req.publicUser, "5m"), rep);

            rep.send({
                success: true,
                message: "La fonctionnalité TOTP a été desactivee !"
            } as ISuccessResponse);
        }
    });

    app.log.info("| Totp routes registered");
}
