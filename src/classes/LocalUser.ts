import { ILocalUser, IPublicUser } from "../interfaces/user.interface";
import HashUtil from "../utils/hash.util";

export class LocalUser implements ILocalUser {
    private _id: number;
    private _name: string;
    private _email: string;
    private _createdAt: number;
    private _verified: boolean;
    private _authProvider: string;
    private _password: string;

    public constructor(name: string, email: string, password: string) {
        this._id = -1;
        this._name = name;
        this._email = email;
        this._password = password;
        this._authProvider = "LOCAL";
        this._createdAt = Date.now();
        this._verified = false;
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

    public get authProvider(): string {
        return this._authProvider;
    }

    public set authProvider(value: string) {
        this._authProvider = value;
    }

    public get password(): string {
        return this._password;
    }

    public set password(value: string) {
        this._password = value;
    }

    public toPublicUser(): IPublicUser {
        return {
            id: this._id,
            name: this._name,
            verified: this._verified,
            authProvider: this._authProvider
        };
    }

    public async hashPassword(): Promise<string> {
        return HashUtil.hashPassword(this._password);
    }
}

export default LocalUser;
