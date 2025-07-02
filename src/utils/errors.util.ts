export enum ApiErrorCode {
    // Erreurs d'authentification (401)
    MISSING_AUTH_COOKIE = "MISSING_AUTH_COOKIE",
    MISSING_REFRESH_COOKIE = "MISSING_REFRESH_COOKIE",
    INVALID_TOKEN = "INVALID_TOKEN",
    EXPIRED_TOKEN = "EXPIRED_TOKEN",

    // Erreurs d'autorisation (403)
    UNAUTHORIZED = "UNAUTHORIZED",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    FORBIDDEN_RESOURCE = "FORBIDDEN_RESOURCE",
    ALREADY_LOGGED = "ALREADY_LOGGED",

    // Erreurs de ressource (404)
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    TOKEN_NOT_FOUND = "TOKEN_NOT_FOUND",

    // Erreurs de conflit (409)
    DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",
    RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",

    // Erreurs de validation (400)
    INVALID_REQUEST_BODY = "INVALID_REQUEST_BODY",
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
    INVALID_FILE_SIZE = "INVALID_FILE_SIZE",
    INVALID_QUERY = "INVALID_QUERY",

    UNPROCESSABLE_ENTITY = "UNPROCESSABLE_ENTITY",

    // Erreurs serveur (500)
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR"
}

export const getHttpStatusCode = (errorCode: ApiErrorCode): number => {
    switch (errorCode) {
        // 400 - Bad Request
        case ApiErrorCode.INVALID_REQUEST_BODY:
        case ApiErrorCode.MISSING_REQUIRED_FIELD:
        case ApiErrorCode.INVALID_FILE_TYPE:
        case ApiErrorCode.INVALID_FILE_SIZE:
        case ApiErrorCode.INVALID_QUERY:
            return 400;

        // 401 - Unauthorized
        case ApiErrorCode.UNAUTHORIZED:
        case ApiErrorCode.MISSING_AUTH_COOKIE:
        case ApiErrorCode.INVALID_TOKEN:
        case ApiErrorCode.EXPIRED_TOKEN:
        case ApiErrorCode.MISSING_REFRESH_COOKIE:
            return 401;

        // 403 - Forbidden
        case ApiErrorCode.INSUFFICIENT_PERMISSIONS:
        case ApiErrorCode.FORBIDDEN_RESOURCE:
        case ApiErrorCode.ALREADY_LOGGED:
            return 403;

        // 404 - Not Found
        case ApiErrorCode.RESOURCE_NOT_FOUND:
        case ApiErrorCode.USER_NOT_FOUND:
        case ApiErrorCode.TOKEN_NOT_FOUND:
            return 404;

        // 409 - Conflict
        case ApiErrorCode.DUPLICATE_RESOURCE:
        case ApiErrorCode.RESOURCE_ALREADY_EXISTS:
            return 409;
        case ApiErrorCode.UNPROCESSABLE_ENTITY:
            return 422;

        // 500 - Internal Server Error
        case ApiErrorCode.INTERNAL_SERVER_ERROR:
        case ApiErrorCode.DATABASE_ERROR:
            return 500;

        // Par défaut
        default:
            return 500;
    }
};

export class ApiError extends Error {
    public code: ApiErrorCode;

    public constructor(code: ApiErrorCode, message?: string) {
        super(message || code);
        this.code = code;
        this.name = "ApiError";
    }

    public getHttpStatusCode(): number {
        return getHttpStatusCode(this.code);
    }
}
