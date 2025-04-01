import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { registerSchema } from "../schemas/user.schemas";
import { AuthProvider, IUser } from "../interfaces/user.interface";
import { AuthService } from "../services/auth.service";
import { camelCase, mapKeys } from "lodash";
import { generateJWT } from "../utils/jwt.util";
import { RefreshTokenService } from "../services/tokens.service";
import { buildRefreshTokenCookie, sendAuthCookies } from "../utils/cookies.util";

export async function AuthController(app: FastifyInstance): Promise<void> {
    const authService = new AuthService();

    app.post("/register", {
        schema: { body: registerSchema },
        errorHandler: (error, _req, rep) => {
            rep.status(400).send({ error: error.message });
        },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            if (!req.body) {
                throw new Error("Request body is missing");
            }

            const camelCaseBody = mapKeys(req.body, (_, key) => camelCase(key));

            const typedBody: { authProvider: AuthProvider } = {
                ...camelCaseBody,
                authProvider: AuthProvider[camelCaseBody.authProvider as keyof typeof AuthProvider]
            };

            if (typedBody.authProvider !== AuthProvider.LOCAL) {
                throw new Error("Route register can only be used with Local authProvider");
            }
            const registeredUser: IUser = await authService.registerUser(typedBody);
            const returnedValue: { id: number; name: string; authProvider: AuthProvider; isVerified: boolean } = {
                id: registeredUser.id,
                name: registeredUser.name,
                authProvider: registeredUser.authProvider,
                isVerified: registeredUser.isVerified
            };

            sendAuthCookies(await RefreshTokenService.createRefreshToken(registeredUser.id), generateJWT(app, returnedValue, "10min"), rep);

            rep.send({ user: returnedValue });
        }
    }); //Inscription d'un nouvel utilisateur

    app.post("/login", () => {}); //Connexion et génération d’un token (JWT)
    app.post("/logout", () => {}); //Déconnexion et invalidation du token
    app.post("/refresh-token", {
        errorHandler: (error, _req, rep) => {
            rep.status(400).send({ error: error.message });
        },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const refreshToken: string | null = req.cookies["refresh_token"] || null;
            if (!refreshToken) throw new Error("Refresh token is missing");

            buildRefreshTokenCookie(await RefreshTokenService.updateToken(refreshToken), rep, true);
            rep.send({ message: "The token refresh_token has been updated" });
        }
    }); //Rafraîchissement du token d'accès
    app.post("/forgot-password", () => {}); //Demande de réinitialisation de mot de passe
    app.post("/reset-password", () => {}); //Réinitialisation du mot de passe via un lien/token

    app.get("/me", () => {}); //Récupération des informations de l'utilisateur authentifié
    app.get("/validate-token", () => {}); //Vérification de la validité d’un token

    app.log.info("Auth routes registered");
}
