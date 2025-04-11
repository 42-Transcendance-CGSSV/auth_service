import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { registerUser, loginLocalUser } from "../services/auth.service";
import { generateJWT, IJwtPayload } from "../utils/jwt.util";
import { sendAuthCookies } from "../utils/cookies.util";
import { ISuccessResponse } from "../interfaces/response.interface";
import { sendVerificationToken } from "../services/account.service";
import { createRefreshToken, revokeToken, updateToken } from "../services/tokens.service";
import { loginSchema, registerSchema } from "../schemas/auth.schema";

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
    app.post("/register", {
        schema: { body: registerSchema },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const publicUser: IJwtPayload = await registerUser(req);
            const needVerification = await sendVerificationToken(publicUser.id, app);
            rep.send({
                success: true,
                data: publicUser,
                message: needVerification
                    ? "Le compte utilisateur a été créé avec succès ! Il faut encore l'activer"
                    : "Le compte utilisateur a été créé avec succès ! Vous pouvez vous connecter !"
            } as ISuccessResponse);
        }
    }); //Inscription d'un nouvel utilisateur

    app.post("/login", {
        schema: { body: loginSchema },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const publicUser: IJwtPayload = await loginLocalUser(req, app);
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
