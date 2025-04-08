import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { generateJWT } from "../utils/jwt.util";
import { ISuccessResponse } from "../interfaces/response.interface";
import { IPublicUser } from "../interfaces/user.interface";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import RefreshToken from "../classes/RefreshToken";
import { getUserById } from "../database/repositories/user.repository";
import { sendAuthCookies } from "../utils/cookies.util";
import { isTokenValid, updateToken } from "../services/tokens.service";

export async function registerTokensRoutes(app: FastifyInstance): Promise<void> {
    app.get("/token/decode", {
        handler: async (req: FastifyRequest, rep: FastifyReply): Promise<never | void> => {
            if (!req.publicUser) return;
            return rep.send({
                success: true,
                data: req.publicUser,
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

            rep.clearCookie("refresh_token");
            rep.clearCookie("auth_token");

            const updatedToken: RefreshToken = await updateToken(refreshToken);
            const fetchedUser: IPublicUser = (await getUserById(updatedToken.getUserId)) as IPublicUser;
            const jwt: string = generateJWT(app, fetchedUser, "5m");
            sendAuthCookies(updatedToken, jwt, rep);
            rep.send({
                success: true,
                data: {
                    token: jwt
                },
                message: "Le refresh token a été mis à jour et un nouveau JWT a été généré !"
            } as ISuccessResponse);
        }
    });

    app.log.info("| Tokens routes registered");
}
