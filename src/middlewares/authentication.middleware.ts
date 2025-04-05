import AMiddleware from "../classes/abstracts/AMiddleware";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { verifyJWT } from "../utils/jwt.util";

class AuthenticationMiddleware extends AMiddleware {
    public constructor() {
        super();
        this.addRoute("/logout").addRoute("/token/decode").addRoute("/token/validate").addRoute("/upload-picture");
    }

    public async handleRequest(app: FastifyInstance, request: FastifyRequest, _response: FastifyReply): Promise<boolean> {
        try {
            await verifyJWT(app, request);
            return true;
        } catch {
            return false;
        }
    }
}

export default AuthenticationMiddleware;
