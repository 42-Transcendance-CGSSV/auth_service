import { IExternalUser, IPublicUser } from "../interfaces/user.interface";
import { getTimestamp } from "../utils/timestamp.util";

export class ExternalUser implements IExternalUser {
    private _id: number;
    private _name: string;
    private _email: string;
    private _createdAt: number;
    private _verified: boolean;
    private _authProvider: "LOCAL" | "EXTERNAL";
    private _externalToken: string;

    public constructor(name: string, email: string, externalToken: string) {
        this._id = -1;
        this._name = name;
        this._email = email;
        this._externalToken = externalToken;
        this._authProvider = "EXTERNAL";
        this._createdAt = getTimestamp();
        this._verified = true;
    }

    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public get email(): string {
        return this._email;
    }

    public set email(value: string) {
        this._email = value;
    }

    public get createdAt(): number {
        return this._createdAt;
    }

    public set createdAt(value: number) {
        this._createdAt = value;
    }

    public get verified(): boolean {
        return this._verified;
    }

    public set verified(value: boolean) {
        this._verified = value;
    }

    public get authProvider(): "LOCAL" | "EXTERNAL" {
        return this._authProvider;
    }

    public set authProvider(value: "LOCAL" | "EXTERNAL") {
        this._authProvider = value;
    }

    public get externalToken(): string {
        return this._externalToken;
    }

    public set externalToken(value: string) {
        this._externalToken = value;
    }

    public toPublicUser(): IPublicUser {
        return {
            id: this._id,
            name: this._name,
            verified: this._verified,
            authProvider: this._authProvider
        };
    }
}

export default ExternalUser;
