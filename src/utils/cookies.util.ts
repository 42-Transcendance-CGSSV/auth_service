import { env } from "./environment";
import { addDays, addMinutes, getTimestamp } from "./timestamp.util";
import RefreshToken from "../classes/RefreshToken";
import { FastifyReply } from "fastify";

export function sendAuthCookies(refreshToken: RefreshToken, jwt: string, rep: FastifyReply): void {
    sendJwtCookie(jwt, rep);
    sendRefreshTokenCookie(refreshToken, rep);
}

export function flushAuthCookies(rep: FastifyReply): void {
    flushJwtCookie(rep);
    flushRefreshTokenCookie(rep);
}

export function flushRefreshTokenCookie(rep: FastifyReply): void {
    rep.clearCookie("refresh_token");
}

export function flushJwtCookie(rep: FastifyReply): void {
    rep.clearCookie("auth_token");
}

export function sendJwtCookie(jwt: string, rep: FastifyReply): void {
    rep.setCookie("auth_token", jwt, {
        path: "/",
        maxAge: addMinutes(getTimestamp(), 5),
        sameSite: "strict",
        httpOnly: env.ENVIRONMENT === "PRODUCTION",
        secure: env.ENVIRONMENT === "PRODUCTION",
        priority: "high",
        domain: env.ENVIRONMENT === "PRODUCTION" ? env.IP : undefined,
        signed: false
    });
}

export function sendRefreshTokenCookie(refreshToken: RefreshToken, rep: FastifyReply): void {
    rep.setCookie("refresh_token", refreshToken.getToken, {
        path: "/",
        maxAge: addDays(getTimestamp(), 60),
        sameSite: "strict",
        httpOnly: env.ENVIRONMENT === "PRODUCTION",
        secure: env.ENVIRONMENT === "PRODUCTION",
        priority: "medium",
        domain: env.ENVIRONMENT === "PRODUCTION" ? env.IP : undefined,
        signed: false
    });
}
