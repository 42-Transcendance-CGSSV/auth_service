import { dbPool } from "../database";

export async function createRefreshTokensTable(): Promise<void> {
    const query = `
        CREATE TABLE IF NOT EXISTS ${process.env.DB_TOKENS_TABLE}
        (
            id         INTEGER PRIMARY KEY,
            user_id    INTEGER NOT NULL,
            token      TEXT    NOT NULL UNIQUE,
            expires_at INTEGER DEFAULT (strftime('%s', 'now') + 30 * (24 * 60 * 60)),
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
    `;

    try {
        const db = await dbPool.acquire();

        await new Promise<void>((resolve, reject) => {
            db.run(query, [], (err) => {
                if (err) {
                    reject(new Error("Unable to create the refresh tokens table: " + err.message));
                } else {
                    resolve();
                }
            });
        });

        dbPool.release(db);
    } catch (error) {
        console.error("Error creating refresh tokens table:", error);
        throw error;
    }
}

export async function deleteRefreshToken(refreshToken: string): Promise<boolean> {
    const query = `DELETE
                   FROM ${process.env.DB_TOKENS_TABLE}
                   WHERE token = ?`;

    try {
        const db = await dbPool.acquire();

        const result = await new Promise<number>((resolve, reject) => {
            db.run(query, [refreshToken], function (err) {
                if (err) {
                    reject(new Error("Unable to delete refresh token: " + err.message));
                } else {
                    resolve(this.changes);
                }
            });
        });

        await dbPool.release(db);
        return result > 0;
    } catch (error) {
        console.error("Error deleting refresh token:", error);
        return false;
    }
}
