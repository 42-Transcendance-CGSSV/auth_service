import AMiddleware from "../classes/abstracts/AMiddleware";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { verifyJWT } from "../utils/jwt.util";
import { IPublicUser } from "../interfaces/user.interface";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { IErrorResponse } from "../interfaces/response.interface";
import { TokenError } from "fast-jwt";

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
            request.publicUser = await verifyJWT(app, request);
            return true;
        } catch (error) {
            request.publicUser = undefined;
            if (error instanceof TokenError || error instanceof ApiError) {
                response.status(401)
                    .send({
                        success: false,
                        errorCode: ApiErrorCode.UNAUTHORIZED,
                        message: error.message
                    } as IErrorResponse);
            }
            return false;
        }
    }
}

export default AuthenticationMiddleware;
