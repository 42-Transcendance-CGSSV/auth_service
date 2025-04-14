import HashUtil from "../../utils/hash.util";
import { generateUUID } from "../../utils/uuid.util";
import AUser from "../abstracts/AUser";
import { IJwtPayload } from "../../utils/jwt.util";
import { getTimestamp } from "../../utils/timestamp.util";
import { Dictionary } from "lodash";
import { getAllTotpDatas } from "../../database/repositories/totp.repository";

export class LocalUser extends AUser {
    private _password: string;
    private _twoFactorEnabled: boolean;
    private _twoFactorBackupCodes: string[] | null;
    private _twoFactorSecret: string | null;
    private _passedTwoFactor: boolean;

    /**
     * Contruct a default local user
     * @param name
     * @param email
     * @param createdAt
     * @param password
     */
    private constructor(name: string, email: string, createdAt: number, password: string) {
        super(-1, name, email, createdAt, false, "LOCAL");
        this._password = password;
        this._twoFactorEnabled = false;
        this._twoFactorBackupCodes = null;
        this._twoFactorSecret = null;
        this._passedTwoFactor = false;
    }

    public get password(): string {
        return this._password;
    }

    public set password(value: string) {
        this._password = value;
    }

    public set passedTwoFactor(value: boolean) {
        this._passedTwoFactor = value;
    }

    public get twoFactorEnabled(): boolean {
        return this._twoFactorEnabled;
    }

    public get twoFactorBackupCodes(): string[] | null {
        return this._twoFactorBackupCodes;
    }

    public get twoFactorSecret(): string | null {
        return this._twoFactorSecret;
    }

    public static createDefaultAccount(name: string, email: string, password: string): LocalUser {
        return new LocalUser(name, email, getTimestamp(), password);
    }

    public static async fromDatabase(dict: Dictionary<any>): Promise<LocalUser> {
        const user = new LocalUser(dict.name, dict.email, dict.createdAt, dict.password);
        user.id = dict.id;
        user.verified = dict.verified;
        try {
            const twoFactorDict = await getAllTotpDatas(user.id);
            user._twoFactorEnabled = true;
            user._twoFactorSecret = twoFactorDict.totpSecret;
            user._twoFactorBackupCodes = twoFactorDict.backupCodes ? twoFactorDict.backupCodes.split(",") : null;
        } catch (error) {
            user._twoFactorEnabled = false;
            user._twoFactorBackupCodes = null;
            user._twoFactorSecret = null;
        }
        return user;
    }

    public serializeBackupCodes(): string | null {
        if (!this._twoFactorBackupCodes) return null;
        return this._twoFactorBackupCodes.join(",");
    }

    public enableTwoFactor(secret: string): void {
        this._twoFactorEnabled = true;
        this._twoFactorSecret = secret;
        this._twoFactorBackupCodes = [];
        this.refreshBackupCodes(10);
    }

    public disableTwoFactor(): void {
        this._twoFactorEnabled = false;
        this._twoFactorBackupCodes = null;
        this._twoFactorSecret = null;
    }

    public async hashPassword(): Promise<string> {
        return HashUtil.hashPassword(this._password);
    }

    public refreshBackupCodes(amount: number): void {
        if (!this._twoFactorEnabled || !this._twoFactorSecret) return;

        if (!this._twoFactorBackupCodes) {
            this._twoFactorBackupCodes = [];
        }

        for (; amount > 0; --amount) {
            this._twoFactorBackupCodes.push(generateUUID().replace("-", ""));
        }
    }

    public toPublicUser(): IJwtPayload {
        return {
            id: this.id,
            name: this.name,
            verified: this.verified,
            authProvider: this.authProvider,
            hasTwoFactor: this.twoFactorEnabled,
            hasPassedTwoFactor: this._passedTwoFactor
        } as IJwtPayload;
    }
}

export default LocalUser;
