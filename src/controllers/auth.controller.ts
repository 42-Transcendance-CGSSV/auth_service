import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { loginLocalUser, registerUser, toggleTotp } from "../services/auth.service";
import { generateJWT } from "../utils/jwt.util";
import { buildJwtCookie, sendAuthCookies } from "../utils/cookies.util";
import { ISuccessResponse } from "../interfaces/response.interface";
import { sendVerificationToken } from "../services/account.service";
import { createRefreshToken, revokeToken, updateToken } from "../services/tokens.service";
import { loginSchema, registerSchema, totpVerifySchema } from "../schemas/auth.schema";
import { IProtectedUser, IPublicUser, toPublicUser } from "../interfaces/user.interface";
import { generateTotpQrCode, totpCodeIsValid } from "../utils/totp.util";
import { getUserByKey } from "../database/repositories/user.repository";
import { ApiError, ApiErrorCode } from "../utils/errors.util";

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
    app.post("/register", {
        schema: { body: registerSchema },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const publicUser: IProtectedUser = await registerUser(req);
            const needVerification = await sendVerificationToken(publicUser.id, app);
            publicUser.verified = !needVerification;
            rep.send({
                success: true,
                data: toPublicUser(publicUser),
                message: needVerification
                    ? "Le compte utilisateur a été créé avec succès ! Il faut encore l'activer"
                    : "Le compte utilisateur a été créé avec succès ! Vous pouvez vous connecter !"
            } as ISuccessResponse);
        }
    }); //Inscription d'un nouvel utilisateur

    app.post("/login", {
        schema: { body: loginSchema },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const publicUser: IPublicUser = await loginLocalUser(req, app);
            const jwt: string = generateJWT(app, publicUser, "5m");
            const refreshToken: string | null = req.cookies["refresh_token"] || null;
            const refreshTokenObj = !refreshToken ? await createRefreshToken(publicUser.id) : await updateToken(refreshToken);
            sendAuthCookies(refreshTokenObj, jwt, rep);
            rep.send({
                success: true,
                data: {
                    // eslint-disable-next-line camelcase
                    user_data: publicUser,
                    token: jwt
                },
                message: "L'utilisateur est desormais connecte !"
            } as ISuccessResponse);
        }
    }); //Connexion et génération d’un token (JWT)

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
            const publicUser: IPublicUser = toPublicUser(user);
            const newToken = generateJWT(app, publicUser, "5m");
            buildJwtCookie(newToken, rep, true);
            rep.send({
                success: true,
                message: "Le code TOTP est valide !",
                data: { token: newToken }
            } as ISuccessResponse);
        }
    });

    app.post("/totp/toggle", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            if (!req.publicUser) return;
            const callback: string | null = await toggleTotp(req.publicUser.id);
            const message = !callback ? "La fonctionnalité TOTP a été désactivée !" : "La fonctionnalité TOTP a été activée !";

            req.publicUser.hasTotpProtection = !!callback;
            req.publicUser.hasPassedTotp = false;
            const newToken = generateJWT(app, req.publicUser, "5m");
            buildJwtCookie(newToken, rep, true);

            rep.send({
                success: true,
                message: message,
                data: {
                    // eslint-disable-next-line camelcase
                    totp_secret: callback,
                    // eslint-disable-next-line camelcase
                    qr_code: callback ? await generateTotpQrCode(callback, req.publicUser.name) : null,
                    token: newToken
                }
            } as ISuccessResponse);
        }
    }); //Activation ou desactivation de la fonctionnalité TOTP

    app.post("/logout", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const refreshToken: string | null = req.cookies["refresh_token"] || null;
            if (refreshToken) {
                try {
                    await revokeToken(refreshToken);
                    rep.clearCookie("refresh_token");
                } catch {
                    app.log.info("Impossible de supprimer le refresh token");
                }
            }
            rep.clearCookie("auth_token");
            rep.send({
                success: true,
                message: "L'utilisateur a ete deconnecte"
            } as ISuccessResponse);
        }
    }); //Déconnexion et invalidation du token
    app.log.info("| Auth routes registered");
}
