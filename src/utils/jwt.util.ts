import { FastifyInstance } from "fastify";

export const generateJWT = (app: FastifyInstance, payload: object, expireTime: string): string => {
    return app.jwt.sign(payload, { expiresIn: expireTime });
};
