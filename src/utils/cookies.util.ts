import { env } from "./environment";
import { addDays, addMinutes, getTimestamp } from "./timestamp.util";
import RefreshToken from "../classes/RefreshToken";
import { FastifyReply } from "fastify";
import cookieInterface from "../interfaces/cookie.interface";
import CookieInterface from "../interfaces/cookie.interface";

export function sendAuthCookies(refreshToken: RefreshToken, jwt: string, rep: FastifyReply): void {
    buildJwtCookie(jwt, rep, true);
    buildRefreshTokenCookie(refreshToken, rep, true);
}

export function buildJwtCookie(jwt: string, rep: FastifyReply, headerAdding: boolean): CookieInterface {
    const cookieTyped: CookieInterface = {
        cookieName: "auth_token",
        cookieValue: jwt,
        options: {
            httpOnly: env.ENVIRONMENT === "PRODUCTION",
            secure: env.ENVIRONMENT === "PRODUCTION",
            sameSite: "strict",
            maxAge: addMinutes(getTimestamp(), 60),
            path: "/"
        }
    };

    const cookie: string = buildCookie(cookieTyped);
    if (headerAdding) rep.header("set-cookie", cookie);
    return cookieTyped;
}

export function buildRefreshTokenCookie(refreshToken: RefreshToken, rep: FastifyReply, headerAdding: boolean): CookieInterface {
    const cookieType: CookieInterface = {
        cookieName: "refresh_token",
        cookieValue: refreshToken.getToken,
        options: {
            httpOnly: env.ENVIRONMENT === "PRODUCTION",
            secure: env.ENVIRONMENT === "PRODUCTION",
            sameSite: "strict",
            maxAge: addDays(getTimestamp(), 30),
            path: "/token/refresh"
        }
    };
    const cookie: string = buildCookie(cookieType);
    if (headerAdding) rep.header("set-cookie", cookie);
    return cookieType;
}

function buildCookie(cookie: cookieInterface): string {
    let cookieString = `${cookie.cookieName}=${cookie.cookieValue}`;

    if (cookie.options.httpOnly) {
        cookieString += "; HttpOnly";
    }

    if (cookie.options.secure) {
        cookieString += "; Secure";
    }

    if (cookie.options.sameSite) {
        cookieString += `; SameSite=${cookie.options.sameSite}`;
    }

    if (cookie.options.path) {
        cookieString += `; Path=${cookie.options.path}`;
    }

    if (cookie.options.maxAge) {
        cookieString += `; Max-Age=${cookie.options.maxAge}`;
    }

    return cookieString;
}
