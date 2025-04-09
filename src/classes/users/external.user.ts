import AUser from "../abstracts/AUser";
import { getTimestamp } from "../../utils/timestamp.util";
import { Dictionary } from "lodash";

export class ExternalUser extends AUser {
    private _externalToken: string;

    /**
     * Contruct a default external user
     * @param name
     * @param email
     * @param createdAt
     * @param externalToken
     */
    private constructor(name: string, email: string, createdAt: number, externalToken: string) {
        super(-1, name, email, createdAt, true, "EXTERNAL");
        this._externalToken = externalToken;
    }

    public get externalToken(): string {
        return this._externalToken;
    }

    public set externalToken(value: string) {
        this._externalToken = value;
    }

    public static createDefaultAccount(name: string, email: string, externalToken: string): ExternalUser {
        return new ExternalUser(name, email, getTimestamp(), externalToken);
    }

    public static fromDatabase(dict: Dictionary<any>): ExternalUser {
        const user = new ExternalUser(dict.name, dict.email, dict.createdAt, dict.externalToken);
        user.id = dict.id;
        return user;
    }
}

export default ExternalUser;
