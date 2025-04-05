import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { IErrorResponse } from "../../interfaces/response.interface";
import { ApiErrorCode } from "../../utils/errors.util";

abstract class AMiddleware {
    private readonly routes: string[];

    protected constructor() {
        this.routes = [];
    }

    protected get getRoutes(): string[] {
        return this.routes;
    }

    public register(app: FastifyInstance): void {
        this.routes.forEach((route: string) => {
            app.addHook("preHandler", async (request: FastifyRequest, response: FastifyReply) => {
                if (request.url === route) {
                    const isValid: boolean = await this.handleRequest(app, request, response);
                    if (!isValid) {
                        response.status(401).send({
                            success: false,
                            errorCode: ApiErrorCode.UNAUTHORIZED,
                            message: "The request is unauthenticated."
                        } as IErrorResponse);
                    }
                    return isValid;
                }
                return Promise.resolve();
            });
        });
    }

    public addRoute(route: string): AMiddleware {
        this.routes.push(route);
        return this;
    }

    protected abstract handleRequest(app: FastifyInstance, request: FastifyRequest, response: FastifyReply): Promise<boolean>;
}

export default AMiddleware;
