import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { loginLocalUser, registerUser, updateRefreshToken } from "../services/auth.service";
import { generateJWT } from "../utils/jwt.util";
import { sendAuthCookies } from "../utils/cookies.util";
import { ISuccessResponse } from "../interfaces/response.interface";
import { sendVerificationToken } from "../services/account.service";
import { revokeToken } from "../services/tokens.service";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { IProtectedUser, IPublicUser, toPublicUser } from "../interfaces/user.interface";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { toSnakeCase } from "../utils/case.util";

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
    app.post("/register", {
        schema: { body: registerSchema },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const protectedUser: IProtectedUser = await registerUser(req);
            if (!protectedUser) throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Veuillez inclure un body a votre requete !");
            const needVerification = await sendVerificationToken(protectedUser.id, app);
            protectedUser.verified = !needVerification;
            const jwt: string = generateJWT(app, protectedUser, "5m");
            const refreshTokenObj = await updateRefreshToken(req.cookies, protectedUser, rep);
            sendAuthCookies(refreshTokenObj, jwt, rep);
            rep.send({
                success: true,
                data: toSnakeCase(toPublicUser(protectedUser)),
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

            const refreshTokenObj = await updateRefreshToken(req.cookies, publicUser, rep);
            sendAuthCookies(refreshTokenObj, jwt, rep);
            rep.send({
                success: true,
                data: toSnakeCase(publicUser),
                message: "L'utilisateur est desormais connecte !"
            } as ISuccessResponse);
        }
    }); //Connexion et génération d’un token (JWT)

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
