import { env } from "./environment";
import { addDays, addMinutes, getTimestamp } from "./timestamp.util";
import RefreshToken from "../classes/RefreshToken";
import { FastifyReply } from "fastify";
import cookieInterface from "../interfaces/cookie.interface";

export function sendAuthCookies(refreshToken: RefreshToken, jwt: string, rep: FastifyReply): void {
    const cookies: cookieInterface[] = [];

    cookies.push(buildJwtCookie(jwt, rep, false)[0]);
    cookies.push(buildRefreshTokenCookie(refreshToken, rep, false)[0]);

    rep.header("set-cookie", buildCookies(cookies));
}

export function buildJwtCookie(jwt: string, rep: FastifyReply, headerAdding: boolean): cookieInterface[] {
    const cookies: cookieInterface[] = [];

    cookies.push({
        cookieName: "auth_token",
        cookieValue: jwt,
        options: {
            httpOnly: env.ENVIRONMENT === "PRODUCTION",
            secure: env.ENVIRONMENT === "PRODUCTION",
            sameSite: "strict",
            maxAge: addMinutes(getTimestamp(), 60),
            path: "/"
        }
    });

    if (headerAdding) rep.header("set-cookie", buildCookies(cookies));
    return cookies;
}

export function buildRefreshTokenCookie(refreshToken: RefreshToken, rep: FastifyReply, headerAdding: boolean): cookieInterface[] {
    const cookies: cookieInterface[] = [];

    cookies.push({
        cookieName: "refresh_token",
        cookieValue: refreshToken.getToken,
        options: {
            httpOnly: env.ENVIRONMENT === "PRODUCTION",
            secure: env.ENVIRONMENT === "PRODUCTION",
            sameSite: "strict",
            maxAge: addDays(getTimestamp(), 30),
            path: "/refresh"
        }
    });
    if (headerAdding) rep.header("set-cookie", buildCookies(cookies));
    return cookies;
}

function buildCookies(cookies: cookieInterface[]): string[] {
    return cookies.map((cookie) => {
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
    });
}
