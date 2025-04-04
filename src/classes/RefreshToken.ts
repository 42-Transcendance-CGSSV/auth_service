import { generateUUID } from "../utils/uuid.util";
import { getTimestamp } from "../utils/timestamp.util";

class RefreshToken {
    private readonly token: string;
    private readonly userId: number;
    private readonly createdAt: number;
    private readonly expiresAt: number;

    public constructor(userId: number, token: string, createdAt: number, expiresAt: number) {
        this.userId = userId;
        this.token = token;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public get getUserId(): number {
        return this.userId;
    }

    public get getToken(): string {
        return this.token;
    }

    public get getCreatedAt(): number {
        return this.createdAt;
    }

    public get getExpireAt(): number {
        return this.expiresAt;
    }

    public get isExpired(): boolean {
        return this.expiresAt < getTimestamp();
    }

    public static generateToken(userId: number, expireAt: number): RefreshToken {
        return new RefreshToken(userId, generateUUID(), getTimestamp(), expireAt);
    }
}

export default RefreshToken;
