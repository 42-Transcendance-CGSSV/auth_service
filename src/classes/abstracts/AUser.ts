import { IJwtPayload } from "../../utils/jwt.util";

abstract class AUser {
    private _id: number;
    private _name: string;
    private _email: string;
    private _createdAt: number;
    private _verified: boolean;
    private _authProvider: "LOCAL" | "EXTERNAL";

    protected constructor(
        id: number,
        name: string,
        email: string,
        createdAt: number,
        verified: boolean,
        authProvider: "LOCAL" | "EXTERNAL"
    ) {
        this._id = id;
        this._name = name;
        this._email = email;
        this._createdAt = createdAt;
        this._verified = verified;
        this._authProvider = authProvider;
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

    public toPublicUser(): IJwtPayload {
        return {
            id: this._id,
            name: this._name,
            verified: this._verified,
            authProvider: this._authProvider,
            hasTwoFactor: false,
            hasPassedTwoFactor: false
        } as IJwtPayload;
    }
}

export default AUser;
