import schema from "fluent-json-schema";

export const getAccountSchema = schema
    .object()
    .anyOf([
        schema.object().prop("name", schema.string().minLength(4).maxLength(16).pattern("^[A-Za-z]+$")).required(),
        schema.object().prop("userId", schema.number()).required()
    ]);
