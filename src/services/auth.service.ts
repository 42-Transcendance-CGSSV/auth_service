import LocalUser from "../classes/users/local.user";
import { FastifyInstance, FastifyRequest } from "fastify";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import HashUtil from "../utils/hash.util";
import { IJwtPayload, verifyJWT } from "../utils/jwt.util";
import { getUserByKey, insertUser } from "../database/repositories/user.repository";
import AUser from "../classes/abstracts/AUser";
import { toCamelCase } from "../utils/case.util";
import ExternalUser from "../classes/users/external.user";

export async function registerUser(req: FastifyRequest): Promise<IJwtPayload> {
    if (!req.body) throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Veuillez inclure un body a votre requete !");

    const camelCaseRow = toCamelCase(req.body);
    if (camelCaseRow.name && camelCaseRow.email && camelCaseRow.password) {
        const user = LocalUser.createDefaultAccount(camelCaseRow.name, camelCaseRow.email, camelCaseRow.password);
        await registerLocalUser(user);
        return user.toPublicUser();
    }
    const externalUser = ExternalUser.createDefaultAccount(camelCaseRow.name, camelCaseRow.email, "EXEMPLE TOKEN");
    await registerExternalUser(externalUser);
    return externalUser.toPublicUser();
}

export async function loginLocalUser(req: FastifyRequest, app: FastifyInstance): Promise<IJwtPayload> {
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
        const user: AUser = await getUserByKey("email", email);

        if (user.authProvider !== "LOCAL") {
            throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver un utilisateur ayant ces identifiants !");
        }

        const localUser = user as LocalUser;
        const samePass: boolean = await HashUtil.comparePasswords(password, localUser.password);

        if (!samePass) {
            throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver un utilisateur ayant ces identifiants !");
        }

        if (!user.verified) {
            throw new ApiError(ApiErrorCode.INSUFFICIENT_PERMISSIONS, "Impossible de se connecter a un compte non verifie !");
        }

        return user.toPublicUser();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, "Une erreur est survenue pendant l'authentification!");
    }
}

async function registerLocalUser(localUser: LocalUser): Promise<IJwtPayload> {
    if (!localUser.password) {
        throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Un mot de passe est requis pour enregistrer un utilisateur local !");
    }
    localUser.id = await insertUser(localUser);
    return localUser.toPublicUser();
}

async function registerExternalUser(externalUser: ExternalUser): Promise<IJwtPayload> {
    if (!externalUser.externalToken) {
        throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Un token externe est requis pour enregistrer un utilisateur externe !");
    }
    await insertUser(externalUser);
    return externalUser.toPublicUser();
}
