import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { registerSchema } from "../schemas/register.schemas";
import { loginSchema } from "../schemas/login.schema";
import { registerUser, loginLocalUser } from "../services/auth.service";
import { generateJWT } from "../utils/jwt.util";
import { sendAuthCookies } from "../utils/cookies.util";
import { ISuccessResponse } from "../interfaces/response.interface";
import { IPublicUser } from "../interfaces/user.interface";
import { sendVerificationToken } from "../services/account.service";
import { createRefreshToken, revokeToken, updateToken } from "../services/tokens.service";

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
    app.post("/register", {
        schema: { body: registerSchema },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const publicUser: IPublicUser = await registerUser(req);
            await sendVerificationToken(publicUser.id);
            rep.send({
                success: true,
                data: publicUser,
                message: "Le conpte utilisateur a ete cree, il faut encore l'activer !"
            } as ISuccessResponse);
        }
    }); //Inscription d'un nouvel utilisateur

    app.post("/login", {
        schema: { body: loginSchema },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const publicUser: IPublicUser = await loginLocalUser(req, app);
            const jwt: string = generateJWT(app, publicUser, "5m");
            const refreshToken: string | null = req.cookies["refresh_token"] || null;
            let refreshTokenObj;
            if (!refreshToken) {
                refreshTokenObj = await createRefreshToken(publicUser.id);
            } else {
                refreshTokenObj = await updateToken(refreshToken);
            }
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
                rep.clearCookie("auth_token");
                rep.send({
                    success: true,
                    message: "L'utilisateur a ete deconnecte"
                } as ISuccessResponse);
            }
        }
    }); //Déconnexion et invalidation du token
    app.log.info("| Auth routes registered");
}
