import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import HashUtil from "../utils/hash.util";
import { verifyJWT } from "../utils/jwt.util";
import { getUserByKey, insertUser, updatePartialUser } from "../database/repositories/user.repository";
import { toCamelCase, toSnakeCase } from "../utils/case.util";
import { IProtectedUser, IPublicUser } from "../interfaces/user.interface";
import { createLocalUser } from "../factory/user.factory";
import { totpCodeIsValid } from "../utils/totp.util";
import { createRefreshToken, updateToken } from "./tokens.service";
import { flushRefreshTokenCookie } from "../utils/cookies.util";
import RefreshToken from "../classes/RefreshToken";
import { randomInt } from "node:crypto";
import { app } from "../app";

export async function registerUser(req: FastifyRequest): Promise<IProtectedUser> {
    if (!req.body) throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Veuillez inclure un body a votre requete !");

    const camelCaseRow = toCamelCase(req.body);
    if (!camelCaseRow.name || !camelCaseRow.email || !camelCaseRow.password) {
        throw new ApiError(
            ApiErrorCode.INVALID_REQUEST_BODY,
            "Vous devez fournir un nom, un email et un mot de passe pour enregistrer un utilisateur !"
        );
    }

    const user: IProtectedUser = await createLocalUser(camelCaseRow.name, camelCaseRow.email, camelCaseRow.password);
    if (!user.password)
        throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Un mot de passe est requis pour enregistrer un utilisateur !");
    user.id = await insertUser(user);
    return user;
}

export async function loginLocalUser(req: FastifyRequest, app: FastifyInstance): Promise<IProtectedUser> {
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
            throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "%backend.auth.login.error.kd%");
        }

        if (!(await HashUtil.comparePasswords(password, user.password))) {
            throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver un utilisateur ayant ces identifiants !");
        }

        if (!user.verified) {
            throw new ApiError(ApiErrorCode.INSUFFICIENT_PERMISSIONS, "Impossible de se connecter a un compte non verifie !");
        }

        return user;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, "Une erreur est survenue pendant l'authentification!");
    }
}

function generateTotpBackupCode(): string {
    return randomInt(0, 1000000).toString().padStart(6, "0");
}

function generateTotpBackupCodes(): string[] {
    const backupCodes: string[] = [];
    for (let i = 0; i < 6; i++) {
        backupCodes.push(generateTotpBackupCode());
    }
    return backupCodes;
}

export async function enableTotpProtection(userId: number, totpCode: number): Promise<string> {
    const user = await getUserByKey("id", userId);
    if (!user) throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver l'utilisateur avec cet ID !");

    if (!totpCodeIsValid(user.totpSecret, totpCode.toString()))
        throw new ApiError(ApiErrorCode.UNPROCESSABLE_ENTITY, "Impossible de valider le code TOTP !");

    const backupCodes: string = generateTotpBackupCodes().join(",");

    const valuesToUpdate: Partial<any> = { totpEnabled: true, totpBackupCodes: backupCodes };
    await updatePartialUser(userId, toSnakeCase(valuesToUpdate), ["totp_enabled", "totp_backup_codes"]);
    app.log.info(`TOTP protection enabled for user ID: ${userId}`);
    app.log.debug(await getUserByKey("id", userId));
    return backupCodes;
}

export async function useTotpBackupCode(userId: number, backupCode: string): Promise<void> {
    const user = await getUserByKey("id", userId);
    if (!user) throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver l'utilisateur avec cet ID !");

    if (!user.totpBackupCodes || !user.totpBackupCodes.split(",").includes(backupCode)) {
        throw new ApiError(ApiErrorCode.UNPROCESSABLE_ENTITY, "Le code de secours TOTP est invalide ou a deja et utilise !");
    }

    const updatedBackupCodes = user.totpBackupCodes
        .split(",")
        .filter((code: string) => code !== backupCode)
        .join(",");

    const valuesToUpdate: Partial<any> = { totpBackupCodes: updatedBackupCodes.length > 0 ? updatedBackupCodes : null };
    await updatePartialUser(userId, toSnakeCase(valuesToUpdate), ["totp_backup_codes"]);
}

export async function disableTotpProtection(userId: number): Promise<void> {
    const user = await getUserByKey("id", userId);
    if (!user) throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver l'utilisateur avec cet ID !");

    const valuesToUpdate: Partial<any> = { totpEnabled: false, totpBackupCodes: null };
    await updatePartialUser(userId, toSnakeCase(valuesToUpdate), ["totp_enabled", "totp_backup_codes"]);
}

export async function updateRefreshToken(
    cookies: {
        [p: string]: string | undefined;
    },
    user: IPublicUser,
    rep: FastifyReply
): Promise<RefreshToken> {
    let hasRefreshToken: boolean = true;
    if (!cookies || !cookies["refresh_token"]) hasRefreshToken = false;

    if (hasRefreshToken) {
        const refreshToken: string | undefined = cookies["refresh_token"];
        if (!refreshToken) hasRefreshToken = false;
    }

    if (hasRefreshToken) {
        try {
            return await updateToken(cookies["refresh_token"]!);
        } catch {
            flushRefreshTokenCookie(rep);
            return await createRefreshToken(user.id);
        }
    } else return await createRefreshToken(user.id);
}
