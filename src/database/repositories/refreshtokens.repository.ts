import { dbPool } from "../database";
import RefreshToken from "../../classes/RefreshToken";
import { ApiError, ApiErrorCode } from "../../utils/errors.util";
import { FastifyInstance } from "fastify";

export async function createTokensTable(app: FastifyInstance): Promise<void> {
    //@formatter:off
    const query = `
        CREATE TABLE IF NOT EXISTS refresh_tokens 
        (
            token_id INTEGER UNIQUE PRIMARY KEY,
            user_id INTEGER NOT NULL, 
            token VARCHAR(36) NOT NULL UNIQUE, 
            expires_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `;

    try {
        const db = await dbPool.acquire();
        db.run(query, [], (err) => {
            dbPool.release(db);
            if (err) throw err;
        });
    } catch (error) {
        app.log.error("Error creating refresh tokens table:", error);
        throw error;
    }
}

export async function insertToken(token: RefreshToken): Promise<void> {
    const query = `INSERT INTO refresh_tokens (token_id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`;

    const db = await dbPool.acquire();
    db.run(query, [null, token.getUserId, token.getToken, token.getExpireAt, token.getCreatedAt], function (err) {
        dbPool.release(db);
        if (err) throw err;
    });
}

export async function getToken(token: string): Promise<RefreshToken> {
    const query = `SELECT * FROM refresh_tokens WHERE token = ?`;
    const db = await dbPool.acquire();
    return new Promise<RefreshToken>((resolve, reject) => {
        db.get(query, [token], (err, row) => {
            dbPool.release(db);
            if (err) reject(err);
            const typedRow = row as { user_id: number; token: string; created_at: number; expires_at: number };
            if (!row || !typedRow || !("user_id" in typedRow) || typeof typedRow.user_id === "undefined") {
                reject(new ApiError(ApiErrorCode.TOKEN_NOT_FOUND, `Impossible de trouver le token ${token} dans la base de donnees !`));
                return;
            }
            const refreshToken = new RefreshToken(typedRow.user_id, typedRow.token, typedRow.created_at, typedRow.expires_at);
            resolve(refreshToken);
        });
    });
}

export async function evictExpiredTokens(): Promise<void> {
    const query = `DELETE FROM refresh_tokens WHERE strftime('%s', 'now') > expires_at`;
    const db = await dbPool.acquire();
    db.run(query, function (err) {
        dbPool.release(db);
        if (err) throw new ApiError(ApiErrorCode.DATABASE_ERROR, "Unable to evict expired tokens !");
    });
}

export async function deleteToken(token: string): Promise<boolean> {
    const query = `DELETE
                   FROM refresh_tokens
                   WHERE token = ?`;

    const db = await dbPool.acquire();
    return new Promise<boolean>((resolve, reject) => {
        db.run(query, [token], function (err) {
            dbPool.release(db);
            if (err) reject(new ApiError(ApiErrorCode.TOKEN_NOT_FOUND, "Impossible de trouver ce token !"));
            else resolve(this.changes > 0);
        });
    });
}
