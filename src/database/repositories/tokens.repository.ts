import { dbPool } from "../database";
import { env } from "../../utils/environment";

export async function createRefreshTokensTable(): Promise<void> {
    //@formatter:off
    const query = `
        CREATE TABLE IF NOT EXISTS ${env.DB_TOKENS_TABLE} 
        (
            id INTEGER PRIMARY KEY, 
            user_id INTEGER NOT NULL, 
            token TEXT NOT NULL UNIQUE, 
            expires_at INTEGER DEFAULT (strftime('%s', 'now') + 30 * 24 * 60 * 60),
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `;

    try {
        const db = await dbPool.acquire();
        await new Promise<void>((resolve, reject) => {
            db.run(query, [], (err) => {
                dbPool.release(db);
                if (err) reject(new Error("Unable to create the refresh tokens table: " + err.message));
                else resolve();
            });
        });
    } catch (error) {
        console.error("Error creating refresh tokens table:", error);
        throw error;
    }
}

export async function deleteRefreshToken(refreshToken: string): Promise<boolean> {
    const query = `DELETE
                   FROM ${env.DB_TOKENS_TABLE}
                   WHERE token = ?`;

    const db = await dbPool.acquire();
    return new Promise<boolean>((resolve, reject) => {
        db.run(query, [refreshToken], function (err) {
            dbPool.release(db);
            if (err) reject(new Error("Unable to delete refresh token: " + err.message));
            else resolve(this.changes > 0);
        });
    });
}
