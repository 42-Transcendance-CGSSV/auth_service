import { CookieSerializeOptions } from "fastify-cookie";

interface CookieInterface {
    cookieName: string;
    cookieValue: string;
    options: CookieSerializeOptions;
}

export default CookieInterface;
