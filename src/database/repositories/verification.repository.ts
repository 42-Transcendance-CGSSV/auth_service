import { dbPool } from "../database";
import { env } from "../../utils/environment";
import { ApiError, ApiErrorCode } from "../../utils/errors.util";

export async function createVerificationTokenTable(): Promise<void> {
    //@formatter:off
    const query = `
        CREATE TABLE IF NOT EXISTS ${env.DB_VERIFICATIONS_TABLE} 
        (
            user_id INTEGER UNIQUE PRIMARY KEY NOT NULL, 
            verification_token TEXT NOT NULL UNIQUE, 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `;
    //@formatter:on
    try {
        const db = await dbPool.acquire();
        await new Promise<void>((resolve, reject) => {
            db.run(query, [], (err) => {
                dbPool.release(db);
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    } catch (error) {
        console.error("Error creating verifications table:", error);
        throw error;
    }
}

export async function insertVerificationToken(userId: number, token: string): Promise<void> {
    const query = `INSERT INTO ${env.DB_VERIFICATIONS_TABLE} (user_id, verification_token)
                   VALUES (?, ?)`;

    const db = await dbPool.acquire();
    return new Promise<void>((resolve, reject) => {
        db.run(query, [userId, token], function (err) {
            dbPool.release(db);
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export async function getVerificationToken(userId: number): Promise<string> {
    const query = `SELECT verification_token
                   FROM ${env.DB_VERIFICATIONS_TABLE}
                   WHERE user_id = ?`;
    const db = await dbPool.acquire();
    return new Promise<string>((resolve, reject) => {
        db.get<string>(query, [userId], (err, row) => {
            dbPool.release(db);
            if (err) {
                reject(err);
            } else {
                resolve(row[0]);
            }
        });
    });
}

export async function deleteVerificationToken(token: string): Promise<boolean> {
    const query = `DELETE
                   FROM ${env.DB_TOKENS_TABLE}
                   WHERE verification_token = ?`;

    const db = await dbPool.acquire();
    return new Promise<boolean>((resolve, reject) => {
        db.run(query, [token], function (err) {
            dbPool.release(db);
            if (err) {
                reject(new ApiError(ApiErrorCode.TOKEN_NOT_FOUND, "Impossible de trouver ce token !"));
            } else {
                resolve(this.changes > 0);
            }
        });
    });
}
