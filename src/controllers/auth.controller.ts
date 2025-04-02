import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { registerSchema } from "../schemas/register.schemas";
import { loginSchema } from "../schemas/login.schema";
import { AuthService } from "../services/auth.service";
import { generateJWT } from "../utils/jwt.util";
import { RefreshTokenService } from "../services/tokens.service";
import { buildRefreshTokenCookie, sendAuthCookies } from "../utils/cookies.util";
import { ISuccessResponse } from "../interfaces/response.interface";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { IPublicUser } from "../interfaces/user.interface";
import { VerificationService } from "../services/verification.service";

export async function AuthController(app: FastifyInstance): Promise<void> {
    const authService = new AuthService();

    app.post("/register", {
        schema: { body: registerSchema },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const publicUser: IPublicUser = await authService.registerUser(req);
            sendAuthCookies(await RefreshTokenService.createRefreshToken(publicUser.id), generateJWT(app, publicUser, "10m"), rep);
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
            const publicUser: IPublicUser = await authService.loginLocalUser(req);
            sendAuthCookies(await RefreshTokenService.createRefreshToken(publicUser.id), generateJWT(app, publicUser, "10m"), rep);
            rep.send({
                success: true,
                data: publicUser,
                message: "User logged"
            } as ISuccessResponse);
        }
    }); //Connexion et génération d’un token (JWT)

    app.post("/logout", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const refreshToken: string | null = req.cookies["refresh_token"] || null;
            const authToken: string | null = req.cookies["auth_token"] || null;
            if (!authToken) {
                throw new ApiError(ApiErrorCode.INSUFFICIENT_PERMISSIONS, "Vous devez etre connecte pour effectuer cette action !");
            }
            if (refreshToken) {
                try {
                    await RefreshTokenService.revokeToken(refreshToken);
                } catch {
                    /* empty */
                }
                rep.clearCookie("refresh_token");
            }
            rep.clearCookie("auth_token");
            rep.send({
                success: true,
                message: "L'utilisateur a ete deconnecte"
            } as ISuccessResponse);
        }
    }); //Déconnexion et invalidation du token

    app.post("/refresh-token", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const refreshToken: string | null = req.cookies["refresh_token"] || null;
            if (!refreshToken) {
                throw new ApiError(ApiErrorCode.MISSING_REFRESH_COOKIE, "Vous devez envoyer le cookie contenant le refresh token");
            }
            rep.clearCookie("refresh_token");
            buildRefreshTokenCookie(await RefreshTokenService.updateToken(refreshToken), rep, true);
            rep.send({
                success: true,
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
    app.post("/forgot-password", () => {}); //Demande de réinitialisation de mot de passe

    app.log.info("Auth routes registered");
}
