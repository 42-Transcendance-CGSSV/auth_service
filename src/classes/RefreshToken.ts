import { generateUUID } from "../utils/uuid.util";
import { getTimestamp } from "../utils/timestamp.util";

class RefreshToken {
    private token: string;
    private readonly _userId: number;
    private readonly _createdAt: number;
    private readonly _expiresAt: number;

    public constructor(userId: number, token: string, createdAt: number, expiresAt: number) {
        this._userId = userId;
        this.token = token;
        this._createdAt = createdAt;
        this._expiresAt = expiresAt;
    }

    public get getUserId(): number {
        return this._userId;
    }

    public get getToken(): string {
        return this.token;
    }

    public get getCreatedAt(): number {
        return this._createdAt;
    }

    public get getExpireAt(): number {
        return this._expiresAt;
    }

    public get isExpired(): boolean {
        return this._expiresAt < getTimestamp();
    }

    public static generateToken(userId: number, expireAt: number): RefreshToken {
        return new RefreshToken(userId, generateUUID(), getTimestamp(), expireAt);
    }
}

export default RefreshToken;
