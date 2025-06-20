import AMiddleware from "../classes/abstracts/AMiddleware";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { verifyJWT } from "../utils/jwt.util";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { IErrorResponse } from "../interfaces/response.interface";
import { TokenError } from "fast-jwt";
import { IPublicUser } from "../interfaces/user.interface";

/**
 * @description Middleware to verify the JWT token and add the user to the request
 */
declare module "fastify" {
    interface FastifyRequest {
        publicUser?: IPublicUser;
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
        this.addRoute("/token/validate")
            .addRoute("/picture/upload")
            .addRoute("/picture")
            .addRoute("/totp/toggle")
            .addRoute("/totp/validate");
    }

    /**
     * @description Middleware to verify the JWT token and add the user to the request
     * @param app Fastify instance
     * @param request Fastify request
     * @param response Fastify response
     */
    public async handleRequest(app: FastifyInstance, request: FastifyRequest, response: FastifyReply): Promise<boolean> {
        app.log.info("middleintercepter: " + request.url);
        try {
            request.publicUser = undefined;
            const payload = await verifyJWT(app, request);

            if (!isUserToken(payload)) {
                throw new ApiError(ApiErrorCode.INVALID_TOKEN, "Le JWT n'est pas valide !");
            }

            if (needEmailVerification(payload) && request.url !== "/activate-account")
                throw new ApiError(ApiErrorCode.UNAUTHORIZED, "Vous devez dabord verifier votre compte");

            //todo: check if mail if verified
            if (needTwoFactor(payload) && request.url !== "/totp/validate") {
                throw new ApiError(ApiErrorCode.UNAUTHORIZED, "Vous devez passer le processus d'authentification à deux facteurs !");
            }

            request.publicUser = payload;
            return true;
        } catch (error) {
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

function needEmailVerification(payload: unknown): boolean {
    return (typeof payload === "object" && payload !== null && "verified" in payload && !payload.verified) as boolean;
}

function needTwoFactor(payload: unknown): boolean {
    return (typeof payload === "object" &&
        payload !== null &&
        "hasTotpProtection" in payload &&
        payload.hasTotpProtection &&
        "hasPassedTotp" in payload &&
        !payload.hasPassedTotp) as boolean;
}

function isUserToken(payload: any): payload is IPublicUser {
    return typeof payload === "object" && payload !== null && "id" in payload;
}

export default AuthenticationMiddleware;
