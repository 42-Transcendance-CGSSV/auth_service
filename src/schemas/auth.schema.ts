import schema from "fluent-json-schema";

export const registerSchema = schema
    .object()
    .prop("name", schema.string().minLength(4).maxLength(16).pattern("^[A-Za-z]+$").required())
    .prop("email", schema.string().format("email").minLength(3).maxLength(320).required())
    .prop("password", schema.string().minLength(8).maxLength(32).required());

export const loginSchema = schema
    .object()
    .prop("email", schema.string().format("email").minLength(3).maxLength(320).required())
    .prop("password", schema.string().minLength(8).maxLength(32).required());
