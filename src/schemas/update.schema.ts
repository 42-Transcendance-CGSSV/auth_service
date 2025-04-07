import schema from "fluent-json-schema";

export const updateSchema = schema
    .object()
    .prop("name", schema.string().minLength(4).maxLength(16).pattern("^[A-Za-z]+$"))
    .prop("email", schema.string().format("email").minLength(3).maxLength(320))
    .prop("password", schema.string().minLength(8).maxLength(32))
    .prop("external_token", schema.string());
