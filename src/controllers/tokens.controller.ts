import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { generateJWT, verifyJWT } from "../utils/jwt.util";
import { ISuccessResponse } from "../interfaces/response.interface";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import RefreshToken from "../classes/RefreshToken";
import { flushAuthCookies, sendAuthCookies } from "../utils/cookies.util";
import { isTokenValid, updateToken } from "../services/tokens.service";
import { getUserByKey } from "../database/repositories/user.repository";
import { toPublicUser } from "../interfaces/user.interface";

export async function registerTokensRoutes(app: FastifyInstance): Promise<void> {
    app.get("/token/decode", {
        handler: async (req: FastifyRequest, rep: FastifyReply): Promise<never | void> => {
            const payload = await verifyJWT(app, req);
            if (!payload) throw new ApiError(ApiErrorCode.INVALID_TOKEN, "Unable to check the JWT");
            return rep.send({
                success: true,
                data: payload,
                message: "Ce token est valide, les informations contenues dedans ont été décodées !"
            } as ISuccessResponse);
        }
    }); //Récupération des informations de l'utilisateur authentifié

    app.get("/token/validate", {
        handler: async (_req: FastifyRequest, rep: FastifyReply) => {
            return rep.send({
                success: true,
                message: "Ce token est valide !"
            } as ISuccessResponse);
        }
    }); //Vérification de la validité d’un token

    app.post("/token/refresh", {
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const refreshToken: string | null = req.cookies["refresh_token"] || null;
            if (!refreshToken) {
                throw new ApiError(ApiErrorCode.MISSING_REFRESH_COOKIE, "Vous devez envoyer le cookie contenant le refresh token");
            }

            if (!(await isTokenValid(refreshToken))) {
                throw new ApiError(ApiErrorCode.EXPIRED_TOKEN, "Le refresh token est invalide ou a expire");
            }

            flushAuthCookies(rep);

            const updatedToken: RefreshToken = await updateToken(refreshToken);
            const jwt: string = generateJWT(app, toPublicUser(await getUserByKey("id", updatedToken.getUserId)), "5m");
            sendAuthCookies(updatedToken, jwt, rep);
            rep.send({
                success: true,
                message: "Le refresh token a été mis à jour et un nouveau JWT a été généré !"
            } as ISuccessResponse);
        }
    });

    app.log.info("| Tokens routes registered");
}
