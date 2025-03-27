import { FastifyInstance } from "fastify";
import { registerSchema } from "../schemas/user.schemas";
import { AuthProvider, UserModel } from "../models/user.model";
import { AuthService } from "../services/auth.service";
import UserFactory from "../factory/factory.user";

export async function AuthController(app: FastifyInstance): Promise<void> {
    const authService = new AuthService();

    app.post<{ Body: UserModel }>("/register", {
        schema: { body: registerSchema },
        handler: async (req, rep) => {
            let user: UserModel;
            if (req.body.getAuthProvider == AuthProvider.LOCAL) {
                user = UserFactory.createTranscendenceAccount(req.body.getName, req.body.getEmail, req.body.getPassword as string);
            } else if (req.body.getAuthProvider == AuthProvider.GOOGLE) {
                user = UserFactory.createGoogleAccount(req.body.getName, req.body.getEmail, req.body.getExternalProviderId as string);
            } else {
                throw new Error("Invalid auth provider");
            }
            const registeredUser = await authService.registerUser(user);
            rep.send(registeredUser);
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
