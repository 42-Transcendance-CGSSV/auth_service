import schema from "fluent-json-schema";

export const getAccountSchema = schema
    .object()
    .anyOf([
        schema.object().prop("name", schema.string().minLength(4).maxLength(16).pattern("[a-zA-Z0-9_]")).required(),
        schema.object().prop("user_id", schema.number().minimum(1)).required()
    ]);

//TODO: regex external token
export const updateAccountSchema = schema
    .object()
    .prop("name", schema.string().minLength(4).maxLength(16).pattern("[a-zA-Z0-9_]"))
    .prop("email", schema.string().format("email").minLength(3).maxLength(320))
    .prop("password", schema.string().minLength(8).maxLength(32))
    .prop("external_token", schema.string());
