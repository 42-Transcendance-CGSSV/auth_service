import { camelCase, kebabCase, mapKeys, snakeCase } from "lodash";

export function toCamelCase(payload: any): any {
    return mapKeys(payload, (_, key) => camelCase(key));
}

export function toSnakeCase(payload: any): any {
    return mapKeys(payload, (_, key) => snakeCase(key));
}

export function toKebabCase(payload: any): any {
    return mapKeys(payload, (_, key) => kebabCase(key));
}
