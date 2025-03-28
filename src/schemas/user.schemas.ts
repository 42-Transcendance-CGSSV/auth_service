import schema from "fluent-json-schema";
import { AuthProvider } from "../interfaces/user.interface";

export const registerSchema = schema
    .object()
    .prop("name", schema.string().minLength(4).pattern("^[A-Za-z]+$").required())
    .prop("email", schema.string().format("email").required())
    .prop(
        "password",
        schema
            .anyOf([
                schema
                    .string()
                    .minLength(8)
                    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]$/),
                schema.null()
            ])
            .required()
    )
    .prop("authProvider", schema.string().enum(Object.values(AuthProvider)).required())
    .prop("externalProviderId", schema.anyOf([schema.string(), schema.null()]).required());
