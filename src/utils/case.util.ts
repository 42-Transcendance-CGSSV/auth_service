import { camelCase, kebabCase, mapKeys, snakeCase } from "lodash";
import { Dictionary } from "lodash";

export function toCamelCase(payload: any): Dictionary<any> {
    return mapKeys(payload, (_, key) => camelCase(key));
}

export function toSnakeCase(payload: any): Dictionary<any> {
    return mapKeys(payload, (_, key) => snakeCase(key));
}

export function toKebabCase(payload: any): Dictionary<any> {
    return mapKeys(payload, (_, key) => kebabCase(key));
}
