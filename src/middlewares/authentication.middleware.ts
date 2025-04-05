import AMiddleware from "../classes/abstracts/AMiddleware";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { verifyJWT } from "../utils/jwt.util";
import { IPublicUser } from "../interfaces/user.interface";

declare module "fastify" {
    interface FastifyRequest {
        publicUser?: IPublicUser;
    }
}

class AuthenticationMiddleware extends AMiddleware {
    public constructor() {
        super();
        this.addRoute("/logout").addRoute("/token/decode").addRoute("/token/validate").addRoute("/upload-picture");
    }

    public async handleRequest(app: FastifyInstance, request: FastifyRequest, _response: FastifyReply): Promise<boolean> {
        try {
            request.publicUser = await verifyJWT(app, request);
            return true;
        } catch {
            request.publicUser = undefined;
            return false;
        }
    }
}

export default AuthenticationMiddleware;
