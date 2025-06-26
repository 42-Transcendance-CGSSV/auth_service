import RefreshToken from "../classes/RefreshToken";
import * as tokenRepository from "../database/repositories/refreshtokens.repository";
import { getToken } from "../database/repositories/refreshtokens.repository";
import { addDays, getTimestamp } from "../utils/timestamp.util";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { getUserByKey } from "../database/repositories/user.repository";

export async function createRefreshToken(userId: number): Promise<RefreshToken> {
    const token: RefreshToken = RefreshToken.generateToken(userId, addDays(getTimestamp(), 60));
    await tokenRepository.insertToken(token);
    return token;
}

export async function updateToken(token: string): Promise<RefreshToken> {
    if (!token || typeof token === "undefined") {
        throw new ApiError(ApiErrorCode.TOKEN_NOT_FOUND, "Le refresh token ne peut etre undefined !");
    }

    const refreshToken = await getToken(token);
    if (refreshToken.isExpired) throw new ApiError(ApiErrorCode.EXPIRED_TOKEN, "Ce refresh token est expire");

    const user = await getUserByKey("id", refreshToken.getUserId);
    if (!user) throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver l'utilisateur !");
    await revokeToken(refreshToken.getToken);
    const newToken = RefreshToken.generateToken(user.id, addDays(getTimestamp(), 30));
    await tokenRepository.insertToken(newToken);
    return newToken;
}

export async function isTokenValid(token: string): Promise<boolean> {
    const tokenData = await tokenRepository.getToken(token);
    return tokenData !== null && !tokenData.isExpired;
}

export async function revokeToken(token: string): Promise<boolean> {
    return tokenRepository.deleteToken(token);
}
