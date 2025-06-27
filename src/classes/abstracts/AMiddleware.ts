import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

/**
 * @description Abstract class for middlewares
 */
abstract class AMiddleware {
    /**
     * @description Array of routes
     */
    private readonly routes: string[];

    /**
     * @description Constructor
     */
    protected constructor() {
        this.routes = [];
    }

    /**
     * @description Get the routes
     * @returns {string[]} Array of routes
     */
    protected get getRoutes(): string[] {
        return this.routes;
    }

    /**
     * @description Register the middleware
     * @param app Fastify instance
     */
    public register(app: FastifyInstance): void {
        app.addHook("preHandler", async (request: FastifyRequest, response: FastifyReply) => {
            app.log.info("PreHandler hook for route: " + request.url);
            const isProtected = this.routes.some((route) => request.url.startsWith(route));
            if (!isProtected) {
                return;
            }
            app.log.info("Handling request for protected route: " + request.url);
            return await this.handleRequest(app, request, response);
        });
    }

    /**
     * @description Add a route to the middleware
     * @param route Route to add
     * @returns {AMiddleware} this
     */
    public addRoute(route: string): AMiddleware {
        this.routes.push(route);
        return this;
    }

    /**
     * @description Handle the request
     * @param app Fastify instance
     * @param request Fastify request
     * @param response Fastify response
     * @returns {Promise<boolean>} true if the request is handled, false otherwise
     */
    protected abstract handleRequest(app: FastifyInstance, request: FastifyRequest, response: FastifyReply): Promise<boolean>;
}

export default AMiddleware;
