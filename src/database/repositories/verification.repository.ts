import { dbPool } from "../database";
import { ApiError, ApiErrorCode } from "../../utils/errors.util";
import { FastifyInstance } from "fastify";

export async function createVerificationTokenTable(app: FastifyInstance): Promise<void> {
    //@formatter:off
    const query = `
        CREATE TABLE IF NOT EXISTS account_verification 
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
        app.log.error("Error creating verifications table:", error);
        throw error;
    }
}

export async function insertVerificationToken(userId: number, token: string): Promise<void> {
    const query = `INSERT INTO account_verification (user_id, verification_token)
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
                   FROM account_verification
                   WHERE user_id = ?`;
    const db = await dbPool.acquire();
    return new Promise<string>((resolve, reject) => {
        db.get<string>(query, [userId], (err, row) => {
            dbPool.release(db);
            if (err) {
                reject(err);
                return;
            }

            if (!row || typeof row === "undefined") {
                reject(new ApiError(ApiErrorCode.TOKEN_NOT_FOUND, "Impossible de trouver ce token"));
                return;
            }
            const typedRow = row as unknown as { verification_token: string };
            if (!typedRow || !("verification_token" in typedRow)) {
                reject(new ApiError(ApiErrorCode.TOKEN_NOT_FOUND, "Impossible de trouver ce token"));
            }

            resolve(typedRow.verification_token);
        });
    });
}

export async function deleteVerificationToken(token: string): Promise<void> {
    const query = `DELETE
                   FROM account_verification
                   WHERE verification_token = ?`;

    const db = await dbPool.acquire();
    db.run(query, [token]);
    dbPool.release(db);
}
