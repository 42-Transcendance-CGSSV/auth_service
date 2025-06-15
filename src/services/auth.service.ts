import { FastifyInstance, FastifyRequest } from "fastify";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import HashUtil from "../utils/hash.util";
import { verifyJWT } from "../utils/jwt.util";
import { getUserByKey, insertUser, updatePartialUser } from "../database/repositories/user.repository";
import { toCamelCase, toSnakeCase } from "../utils/case.util";
import { IProtectedUser, IPublicUser, toPublicUser } from "../interfaces/user.interface";
import { createExternalUser, createLocalUser } from "../factory/user.factory";
import { generateTotpSecretKey } from "../utils/totp.util";

export async function registerUser(req: FastifyRequest): Promise<IProtectedUser> {
    if (!req.body) throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Veuillez inclure un body a votre requete !");

    const camelCaseRow = toCamelCase(req.body);
    if (camelCaseRow.name && camelCaseRow.email && camelCaseRow.password) {
        const user: IProtectedUser = await createLocalUser(camelCaseRow.name, camelCaseRow.email, camelCaseRow.password);
        await registerLocalUser(user);
        return user;
    }
    const externalUser = createExternalUser(camelCaseRow.name, camelCaseRow.email, "EXEMPLE TOKEN");
    await registerExternalUser(externalUser);
    return externalUser;
}

export async function loginLocalUser(req: FastifyRequest, app: FastifyInstance): Promise<IPublicUser> {
    let alreadyHasJwt: boolean = false;

    //TODO: check if the user is already logged in

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
        const user: IProtectedUser = await getUserByKey("email", email.toLowerCase());

        if (user.password === null || typeof user.password === "undefined") {
            throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver un utilisateur ayant ces identifiants !");
        }

        if (!(await HashUtil.comparePasswords(password, user.password))) {
            throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver un utilisateur ayant ces identifiants !");
        }

        if (!user.verified) {
            throw new ApiError(ApiErrorCode.INSUFFICIENT_PERMISSIONS, "Impossible de se connecter a un compte non verifie !");
        }

        return toPublicUser(user);
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, "Une erreur est survenue pendant l'authentification!");
    }
}

export async function toggleTotp(userId: number): Promise<string | null> {
    const user = await getUserByKey("id", userId);
    if (!user) return null;
    if (user.totpSecret === null) {
        const key: string = generateTotpSecretKey();
        const valuesToUpdate: Partial<any> = { totpSecret: key };
        await updatePartialUser(userId, toSnakeCase(valuesToUpdate), ["totp_secret"]);
        return key;
    }

    const valuesToUpdate: Partial<any> = { totpSecret: "null" };
    await updatePartialUser(userId, toSnakeCase(valuesToUpdate), ["totp_secret"]);
    return null;
}

async function registerLocalUser(localUser: IProtectedUser): Promise<IPublicUser> {
    if (!localUser.password) {
        throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Un mot de passe est requis pour enregistrer un utilisateur local !");
    }
    localUser.id = await insertUser(localUser);
    return localUser as IPublicUser;
}

async function registerExternalUser(externalUser: IProtectedUser): Promise<IPublicUser> {
    if (!externalUser.externalToken) {
        throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Un token externe est requis pour enregistrer un utilisateur externe !");
    }
    await insertUser(externalUser);
    return externalUser as IPublicUser;
}
