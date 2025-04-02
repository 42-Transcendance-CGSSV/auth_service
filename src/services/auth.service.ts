import { ILocalUser, IPublicUser, IUser } from "../interfaces/user.interface";
import { getUserByEmail, insertUser } from "../database/repositories/user.repository";
import LocalUser from "../classes/LocalUser";
import ExternalUser from "../classes/ExternalUser";
import { FastifyRequest } from "fastify";
import { camelCase, mapKeys } from "lodash";
import FactoryUser from "../factory/factory.user";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import HashUtil from "../utils/hash.util";

export class AuthService {
    public async registerUser(req: FastifyRequest): Promise<IPublicUser> {
        if (!req.body) throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Veuillez inclure un body a votre requete !");

        const camelCaseBody = mapKeys(req.body, (_, key) => camelCase(key));
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

    public async loginLocalUser(req: FastifyRequest): Promise<IPublicUser> {
        const refreshToken: string | null = req.cookies["refresh_token"] || null;
        const authToken: string | null = req.cookies["auth_token"] || null;

        if (refreshToken && authToken) {
            throw new ApiError(ApiErrorCode.ALREADY_LOGGED, "L'utilisateur est deja connecte");
        }

        if (!req.body) throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Veuillez inclure un body a votre requete !");
        const { email, password } = req.body as { email: string; password: string };

        return new Promise<IPublicUser>((resolve, reject) => {
            getUserByEmail(email).then(async (user: IUser) => {
                if (user.authProvider !== "LOCAL") {
                    reject(new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver un utilisateur ayant ces identifiants !"));
                    return;
                }

                const localUser: ILocalUser = user as ILocalUser;
                try {
                    const samePass: boolean = await HashUtil.comparePasswords(password, localUser.password);
                    if (!samePass) {
                        reject(new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver un utilisateur ayant ces identifiants !"));
                        return;
                    }

                    const publicUser: IPublicUser = {
                        id: localUser.id,
                        name: localUser.name,
                        verified: localUser.verified,
                        authProvider: localUser.authProvider
                    };
                    resolve(publicUser);
                } catch {
                    reject(new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, "Une erreur est survenue pendant le check mdp!"));
                }
            });
        });
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
