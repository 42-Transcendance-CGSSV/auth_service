import schema from "fluent-json-schema";

export const loginSchema = schema
    .object()
    .prop("email", schema.string().format("email").minLength(3).maxLength(320).required())
    .prop("password", schema.string().minLength(8).maxLength(32).required());
