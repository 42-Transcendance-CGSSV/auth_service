import RefreshToken from "../classes/RefreshToken";
import { getUserById } from "../database/repositories/user.repository";
import * as tokenRepository from "../database/repositories/refreshtokens.repository";
import { getToken } from "../database/repositories/refreshtokens.repository";
import { addDays, getTimestamp } from "../utils/timestamp.util";
import { ApiError, ApiErrorCode } from "../utils/errors.util";

export class RefreshTokenService {
    public static async createRefreshToken(userId: number): Promise<RefreshToken> {
        const token: RefreshToken = RefreshToken.generateToken(userId, addDays(getTimestamp(), 30));
        await tokenRepository.insertToken(token);
        return token;
    }

    public static async updateToken(token: string): Promise<RefreshToken> {
        if (!token || typeof token === "undefined") {
            throw new ApiError(ApiErrorCode.TOKEN_NOT_FOUND, "Le refresh token ne peut etre undefined !");
        }

        const refreshToken = await getToken(token);
        if (refreshToken.isExpired) throw new ApiError(ApiErrorCode.EXPIRED_TOKEN, "Ce refresh token est expire");

        const user = await getUserById(refreshToken.getUserId);
        if (!user) throw new ApiError(ApiErrorCode.USER_NOT_FOUND, "Impossible de trouver l'utilisateur !");
        await this.revokeToken(refreshToken.getToken);
        const newToken = RefreshToken.generateToken(user.id, addDays(getTimestamp(), 30));
        await tokenRepository.insertToken(newToken);
        return newToken;
    }

    public static async isTokenValid(token: string): Promise<boolean> {
        const tokenData = await tokenRepository.getToken(token);
        return tokenData !== null && !tokenData.isExpired;
    }

    public static async revokeToken(token: string): Promise<boolean> {
        return tokenRepository.deleteToken(token);
    }
}
