import { ILocalUser, IPublicUser, IUser } from "../interfaces/user.interface";
import { getUserByEmail, insertUser } from "../database/repositories/user.repository";
import LocalUser from "../classes/LocalUser";
import ExternalUser from "../classes/ExternalUser";
import { FastifyInstance, FastifyRequest } from "fastify";
import FactoryUser from "../factory/factory.user";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import HashUtil from "../utils/hash.util";
import { toCamelCase } from "../utils/case.utils";
import { verifyJWT } from "../utils/jwt.util";

export class AuthService {
    public async registerUser(req: FastifyRequest): Promise<IPublicUser> {
        if (!req.body) throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Veuillez inclure un body a votre requete !");

        const camelCaseBody = toCamelCase(req.body);
        const user: IUser = {
            id: camelCaseBody.id,
            name: camelCaseBody.name,
            email: camelCaseBody.email,
            createdAt: camelCaseBody.createdAt,
            verified: false,
            authProvider: typeof camelCaseBody.authProvider === "undefined" ? "LOCAL" : "EXTERNAL"
        };

        if (user.authProvider === "LOCAL") {
            return this.registerLocalUser(FactoryUser.createLocalUser(user.name, user.email, camelCaseBody.password));
        }

        return this.registerExternalUser(FactoryUser.createExternalUser(user.name, user.email, camelCaseBody.externalProviderId));
    }

    public async loginLocalUser(req: FastifyRequest, app: FastifyInstance): Promise<IPublicUser> {
        let alreadyHasJwt: boolean = false;

        try {
            await verifyJWT(app, req);
            alreadyHasJwt = true;
        } catch {
            /* empty */
        }

        if (alreadyHasJwt) {
            throw new ApiError(ApiErrorCode.ALREADY_LOGGED, "Vous etes deja connecte !");
        }

        if (!req.body) {
            throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Veuillez inclure un body à votre requête !");
        }

        const { email, password } = req.body as { email: string; password: string };

        try {
            const user: IUser = await getUserByEmail(email);

            if (user.authProvider !== "LOCAL") {
                throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver un utilisateur ayant ces identifiants !");
            }

            const localUser = user as ILocalUser;
            const samePass: boolean = await HashUtil.comparePasswords(password, localUser.password);

            if (!samePass) {
                throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver un utilisateur ayant ces identifiants !");
            }

            if (!user.verified) {
                throw new ApiError(ApiErrorCode.INSUFFICIENT_PERMISSIONS, "Impossible de se connecter a un compte non verifie !");
            }

            return {
                id: localUser.id,
                name: localUser.name,
                verified: localUser.verified,
                authProvider: localUser.authProvider
            };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, "Une erreur est survenue pendant l'authentification!");
        }
    }

    private async registerLocalUser(localUser: LocalUser): Promise<IPublicUser> {
        if (!localUser.password) return Promise.reject("A password is required to register a local user !");
        await insertUser(localUser);
        return localUser.toPublicUser();
    }

    private async registerExternalUser(externalUser: ExternalUser): Promise<IPublicUser> {
        if (!externalUser.externalToken) return Promise.reject("An external token is required to register an external user !");
        await insertUser(externalUser);
        return externalUser.toPublicUser();
    }
}
