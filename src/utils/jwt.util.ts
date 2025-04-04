import { FastifyInstance, FastifyRequest } from "fastify";
import { IPublicUser } from "../interfaces/user.interface";
import { ApiError, ApiErrorCode } from "./errors.util";
import { TokenError } from "fast-jwt";

export function generateJWT(app: FastifyInstance, payload: IPublicUser, expireTime: string): string {
    return app.jwt.sign(payload, { expiresIn: expireTime });
}

export function verifyJWT(app: FastifyInstance, req: FastifyRequest): Promise<IPublicUser> {
    return new Promise((resolve, reject) => {
        const jwt = getJWTToken(req);
        const token: string | null = jwt[1];
        if (!jwt[0] || !token) {
            reject(new ApiError(ApiErrorCode.TOKEN_NOT_FOUND, "Impossible d'acceder au token jwt !"));
            return;
        }

        try {
            app.jwt.verify<IPublicUser>(token, (_err, payload) => {
                // Payload manquant malgré l'absence d'erreur (cas rare)
                if (!payload) {
                    const noPayloadError = new Error("Token valide mais payload absent");
                    console.error(noPayloadError);
                    reject(new ApiError(ApiErrorCode.INVALID_TOKEN, noPayloadError.message));
                    return;
                }

                // Tout est bon, on résout avec le payload
                resolve(payload);
            });
        } catch (error) {
            if (error instanceof TokenError) {
                const err = error as TokenError;
                if (err.code === "FAST_JWT_EXPIRED") {
                    reject(new ApiError(ApiErrorCode.EXPIRED_TOKEN, `Erreur de JWT token: ${err.message}`));
                } else {
                    reject(new ApiError(ApiErrorCode.INVALID_TOKEN, err.message));
                }
            } else {
                reject(new ApiError(ApiErrorCode.INVALID_TOKEN, "Une erreur est survenue lors de la verification du token !"));
            }
        }
    });
}

function getJWTToken(req: FastifyRequest): [boolean, null | string] {
    if (!req.headers || !req.headers["authorization"]) return [false, null];
    if (typeof req.headers["authorization"] !== "string") return [false, null];
    if (!req.headers["authorization"].startsWith("Bearer ")) return [false, null];
    const token = req.headers["authorization"].split(" ")[1];
    if (!token || token.length < 10) return [false, null];
    return [true, token];
}
