import { FastifyInstance } from "fastify";
import { registerSchema } from "../schemas/user.schemas";
import { AuthProvider, IExternalUser, ILocalUser, IUser } from "../interfaces/user.interface";
import { AuthService } from "../services/auth.service";
import UserFactory from "../factory/factory.user";

export async function AuthController(app: FastifyInstance): Promise<void> {
    const authService = new AuthService();

    app.post("/register", {
        schema: { body: registerSchema },
        handler: async (req, rep) => {
            const typedBody = req.body as IUser;
            let user: IUser;
            if (typedBody.authProvider == AuthProvider.LOCAL) {
                user = UserFactory.createLocalUser(typedBody.name, typedBody.email, (req.body as ILocalUser).passwordHash);
            } else if (typedBody.authProvider == AuthProvider.GOOGLE) {
                user = UserFactory.createGoogleUser(typedBody.name, typedBody.email, (req.body as IExternalUser).externalProviderId);
            } else {
                throw new Error("Invalid auth provider");
            }
            const registeredUser = await authService.registerUser(user, app);
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
