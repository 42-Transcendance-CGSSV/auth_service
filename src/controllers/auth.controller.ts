import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { registerSchema } from "../schemas/register.schemas";
import { loginSchema } from "../schemas/login.schema";
import { AuthService } from "../services/auth.service";
import { generateJWT, verifyJWT } from "../utils/jwt.util";
import { RefreshTokenService } from "../services/tokens.service";
import { sendAuthCookies } from "../utils/cookies.util";
import { ISuccessResponse } from "../interfaces/response.interface";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { IPublicUser } from "../interfaces/user.interface";
import { VerificationService } from "../services/verification.service";
import RefreshToken from "../classes/RefreshToken";
import { getUserById } from "../database/repositories/user.repository";

export async function AuthController(app: FastifyInstance): Promise<void> {
    const authService = new AuthService();

    app.post("/register", {
        schema: { body: registerSchema },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const publicUser: IPublicUser = await authService.registerUser(req);
            await VerificationService.sendVerificationToken(publicUser.id);
            rep.send({
                success: true,
                data: publicUser,
                message: "User Created !"
            } as ISuccessResponse);
        }
    }); //Inscription d'un nouvel utilisateur

    app.post("/login", {
        schema: { body: loginSchema },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const publicUser: IPublicUser = await authService.loginLocalUser(req, app);
            const jwt = generateJWT(app, publicUser, "5m");
            const refreshToken: string | null = req.cookies["refresh_token"] || null;
            let refreshTokenObj;
            if (!refreshToken) {
                refreshTokenObj = await RefreshTokenService.createRefreshToken(publicUser.id);
            } else {
                refreshTokenObj = await RefreshTokenService.updateToken(refreshToken);
            }
            sendAuthCookies(refreshTokenObj, jwt, rep);
            rep.send({
                success: true,
                data: {
                    user_data: publicUser,
                    token: jwt
                },
                message: "User logged"
            } as ISuccessResponse);
        }
    }); //Connexion et génération d’un token (JWT)

    app.post("/logout", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            await verifyJWT(app, req);
            const refreshToken: string | null = req.cookies["refresh_token"] || null;
            if (refreshToken) {
                try {
                    RefreshTokenService.revokeToken(refreshToken);
                    rep.clearCookie("refresh_token");
                } catch {
                    app.log.info("Impossible de supprimer le refresh token");
                }
                rep.clearCookie("auth_token");
                rep.send({
                    success: true,
                    message: "L'utilisateur a ete deconnecte"
                } as ISuccessResponse);
            }
        }
    }); //Déconnexion et invalidation du token

    app.post("/refresh-token", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const refreshToken: string | null = req.cookies["refresh_token"] || null;
            if (!refreshToken) {
                throw new ApiError(ApiErrorCode.MISSING_REFRESH_COOKIE, "Vous devez envoyer le cookie contenant le refresh token");
            }

            if (!(await RefreshTokenService.isTokenValid(refreshToken))) {
                throw new ApiError(ApiErrorCode.EXPIRED_TOKEN, "Le refresh token est invalide ou a expire");
            }

            rep.clearCookie("refresh_token");
            rep.clearCookie("auth_token");

            const updatedToken: RefreshToken = await RefreshTokenService.updateToken(refreshToken);
            const publicUser: IPublicUser = await getUserById(updatedToken.getUserId);
            const jwt: string = generateJWT(app, publicUser, "5m");
            sendAuthCookies(updatedToken, jwt, rep);
            rep.send({
                success: true,
                data: {
                    token: jwt
                },
                message: "Refresh Token updated !"
            } as ISuccessResponse);
        }
    });

    app.post("/activate-account", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            await VerificationService.activateAccount(req);
            await rep.send({
                success: true,
                message: "Account activated !"
            } as ISuccessResponse);
        }
    });
    //app.post("/forgot-password", () => {}); //Demande de réinitialisation de mot de passe

    app.log.info("Auth routes registered");
}
