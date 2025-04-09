import { dbPool } from "../database";
import { env } from "../../utils/environment";
import { ApiError, ApiErrorCode } from "../../utils/errors.util";
import { FastifyInstance } from "fastify";
import LocalUser from "../../classes/users/local.user";

export async function createTwoFactorTable(app: FastifyInstance): Promise<void> {
    //@formatter:off
    const query = `
        CREATE TABLE IF NOT EXISTS ${env.DB_2FA_TABLE} 
        (
            user_id INTEGER UNIQUE PRIMARY KEY,
            token VARCHAR(36) NOT NULL UNIQUE, 
            backup_codes TEXT NOT NULL,
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
        app.log.error("Error creating two factor table:", error);
        throw error;
    }
}

export async function userHas2FA(userId: number): Promise<boolean> {
    const query = `SELECT EXISTS(SELECT 1 FROM ${env.DB_2FA_TABLE} WHERE user_id = ?) AS has_2fa`;
    const db = await dbPool.acquire();
    return new Promise<boolean>((resolve, reject) => {
        db.get(query, [userId], (err, row) => {
            dbPool.release(db);
            if (err) reject(err);
            const typedRow = row as { has_2fa: number };
            resolve(typedRow.has_2fa === 1);
        });
    });
}

export async function enable2FA(localUser: LocalUser): Promise<LocalUser> {
    const query = `INSERT INTO ${env.DB_2FA_TABLE} (user_id, token, backup_codes) VALUES (?, ?, ?)`;

    const db = await dbPool.acquire();
    return new Promise<LocalUser>((resolve, reject) => {
        localUser.enableTwoFactor("TEST SECRET");
        db.run(query, [localUser.id, localUser.twoFactorSecret, localUser.serializeBackupCodes()], function (err) {
            dbPool.release(db);
            if (err) reject(err);
            else resolve(localUser);
        });
    });
}

export async function get2FAToken(userId: number): Promise<string> {
    const query = `SELECT token FROM ${env.DB_2FA_TABLE} WHERE user_id = ?`;
    const db = await dbPool.acquire();
    return new Promise<string>((resolve, reject) => {
        db.get(query, [userId], (err, row) => {
            dbPool.release(db);
            if (err) reject(err);
            const typedRow = row as { token: string };
            if (!row || !typedRow || !("token" in typedRow) || typeof typedRow.token === "undefined") {
                reject(new ApiError(ApiErrorCode.INVALID_TOKEN, "Cet utilisateur n'a pas de 2FA !"));
                return;
            }
            resolve(typedRow.token);
        });
    });
}

export async function disable2FA(userId: number): Promise<void> {
    const query = `DELETE FROM ${env.DB_2FA_TABLE} WHERE user_id = ?`;

    const db = await dbPool.acquire();
    db.run(query, [userId], function (err) {
        dbPool.release(db);
        if (err)
            return Promise.resolve(new ApiError(ApiErrorCode.TOKEN_NOT_FOUND, "Impossible de desactiver la 2FA pour cet utilisateur !"));
        else return Promise.reject();
    });
}

export async function getBackupCodes(userId: number): Promise<string[]> {
    const query = `SELECT bakcup_codes FROM ${env.DB_TOKENS_TABLE} WHERE user_id = ?`;
    const db = await dbPool.acquire();
    return new Promise<string[]>((resolve, reject) => {
        db.get(query, [userId], (err, row) => {
            dbPool.release(db);
            if (err) reject(err);
            const typedRow = row as { backup_codes: string };
            if (
                !row ||
                !typedRow ||
                !("backup_codes" in typedRow) ||
                typeof typedRow.backup_codes === "undefined" ||
                typedRow.backup_codes.length === 0
            ) {
                reject(new ApiError(ApiErrorCode.INVALID_TOKEN, "Cet utilisateur n'a plus de code de secours !"));
                return;
            }
            resolve(typedRow.backup_codes.split(","));
        });
    });
}

export async function updateBackupCodes(userId: number, backupCodes: string[]): Promise<void> {
    const query = `UPDATE ${env.DB_2FA_TABLE} SET backup_codes = ? WHERE user_id = ?`;

    const db = await dbPool.acquire();
    db.run(query, [backupCodes.join(","), userId], function (err) {
        dbPool.release(db);
        if (err) return Promise.reject(err);
        else return Promise.resolve();
    });
}
