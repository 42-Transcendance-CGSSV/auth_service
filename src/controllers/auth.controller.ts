import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { registerSchema } from "../schemas/user.schemas";
import { AuthProvider, IUser } from "../interfaces/user.interface";
import { AuthService } from "../services/auth.service";
import { camelCase, mapKeys } from "lodash";
import { generateJWT } from "../utils/jwt.util";
import { env } from "../utils/environment";

export async function AuthController(app: FastifyInstance): Promise<void> {
    const authService = new AuthService();

    app.post("/register", {
        schema: { body: registerSchema },
        onError: (_request, rep, error: FastifyError) => {
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
            const token: string = generateJWT(app, returnedValue, env.JWT_EXPIRE_TIME);
            const refreshToken = generateJWT(app, { id: registeredUser.id }, "30d");

            rep.setCookie("auth_token", token, {
                httpOnly: true,
                secure: env.ENVIRONMENT === "PRODUCTION",
                sameSite: "strict",
                path: "/"
            });
            rep.setCookie("refresh_token", refreshToken, {
                httpOnly: true,
                secure: env.ENVIRONMENT === "PRODUCTION",
                sameSite: "strict",
                path: "/refresh"
            });

            rep.send({ user: returnedValue });
        }
    }); //Inscription d'un nouvel utilisateur

    app.post("/login", () => {}); //Connexion et génération d’un token (JWT)
    app.post("/logout", () => {}); //Déconnexion et invalidation du token
    app.post("/refresh-token", () => {}); //Rafraîchissement du token d'accès
    app.post("/forgot-password", () => {}); //Demande de réinitialisation de mot de passe
    app.post("/reset-password", () => {}); //Réinitialisation du mot de passe via un lien/token

    app.get("/me", () => {}); //Récupération des informations de l'utilisateur authentifié
    app.get("/validate-token", () => {}); //Vérification de la validité d’un token

    app.log.info("Auth routes registered");
}
