import AMiddleware from "../classes/abstracts/AMiddleware";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { IJwtPayload, verifyJWT } from "../utils/jwt.util";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { IErrorResponse } from "../interfaces/response.interface";
import { TokenError } from "fast-jwt";

/**
 * @description Middleware to verify the JWT token and add the user to the request
 */
declare module "fastify" {
    interface FastifyRequest {
        publicUser?: IJwtPayload;
    }
}

/**
 * @description Middleware to verify the JWT token and add the user to the request
 * @class AuthenticationMiddleware
 * @extends AMiddleware
 */
class AuthenticationMiddleware extends AMiddleware {
    public constructor() {
        super();
        this.addRoute("/logout")
            .addRoute("/token/decode")
            .addRoute("/token/validate")
            .addRoute("/upload-picture")
            .addRoute("/update-account");
    }

    /**
     * @description Middleware to verify the JWT token and add the user to the request
     * @param app Fastify instance
     * @param request Fastify request
     * @param response Fastify response
     */
    public async handleRequest(app: FastifyInstance, request: FastifyRequest, response: FastifyReply): Promise<boolean> {
        try {
            const payload = await verifyJWT(app, request);
            if (isPublicUser(payload)) {
                request.publicUser = payload;
                return true;
            } else if (is2FA(payload)) {
                request.publicUser = undefined;
                throw new ApiError(ApiErrorCode.TWO_FACTOR_REQUIRED, "Vous devez passer le processus d'authentification à deux facteurs !");
            }
            return true;
        } catch (error) {
            request.publicUser = undefined;
            if (error instanceof TokenError) {
                replyWithError(response, error, ApiErrorCode.UNAUTHORIZED);
            } else if (error instanceof ApiError) replyWithError(response, error, error.code);
            return false;
        }
    }
}

function replyWithError(response: FastifyReply, error: Error, errorCode: ApiErrorCode): void {
    response.status(401).send({
        success: false,
        errorCode: errorCode,
        message: error.message
    } as IErrorResponse);
}

function is2FA(payload: unknown): payload is { need_2_fa: boolean } {
    return typeof payload === "object" && payload !== null && "need_2_fa" in payload;
}

function isPublicUser(payload: any): payload is IJwtPayload {
    return (
        typeof payload === "object" &&
        payload !== null &&
        "id" in payload &&
        "name" in payload &&
        "authProvider" in payload &&
        "verified" in payload
    );
}

export default AuthenticationMiddleware;
