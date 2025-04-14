import { dbPool } from "../database";
import { env } from "../../utils/environment";
import { ApiError, ApiErrorCode } from "../../utils/errors.util";
import { FastifyInstance } from "fastify";
import LocalUser from "../../classes/users/local.user";
import { toCamelCase } from "../../utils/case.util";
import { Dictionary } from "lodash";

export async function createTotpTable(app: FastifyInstance): Promise<void> {
    //@formatter:off
    const query = `
        CREATE TABLE IF NOT EXISTS ${env.DB_TOTP_TABLE}
        (
            user_id INTEGER UNIQUE PRIMARY KEY,
            totp_secret VARCHAR(36) NOT NULL UNIQUE, 
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

export async function userIsProtected(userId: number): Promise<boolean> {
    const query = `SELECT EXISTS(SELECT 1 FROM ${env.DB_TOTP_TABLE} WHERE user_id = ?) AS has_2fa`;
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

export async function enableTotp(localUser: LocalUser): Promise<LocalUser> {
    const query = `INSERT INTO ${env.DB_TOTP_TABLE} (user_id, totp_secret, backup_codes) VALUES (?, ?, ?)`;

    const db = await dbPool.acquire();
    return new Promise<LocalUser>((resolve, reject) => {
        db.run(query, [localUser.id, localUser.twoFactorSecret, localUser.serializeBackupCodes()], function (err) {
            dbPool.release(db);
            if (err) reject(err);
            else resolve(localUser);
        });
    });
}

export async function getTotpSecret(userId: number): Promise<string> {
    const query = `SELECT totp_secret FROM ${env.DB_TOTP_TABLE} WHERE user_id = ?`;
    const db = await dbPool.acquire();
    return new Promise<string>((resolve, reject) => {
        db.get(query, [userId], (err, row) => {
            dbPool.release(db);
            if (err) reject(err);
            const typedRow = row as { totp_secret: string };
            if (!row || !typedRow || !("totp_secret" in typedRow) || typeof typedRow.totp_secret === "undefined") {
                reject(new ApiError(ApiErrorCode.INVALID_TOKEN, "Cet utilisateur n'a pas de 2FA !"));
                return;
            }
            resolve(typedRow.totp_secret);
        });
    });
}

export async function disableTotp(userId: number): Promise<void> {
    const query = `DELETE FROM ${env.DB_TOTP_TABLE} WHERE user_id = ?`;

    const db = await dbPool.acquire();
    db.run(query, [userId], function (err) {
        dbPool.release(db);
        if (err)
            return Promise.resolve(new ApiError(ApiErrorCode.TOKEN_NOT_FOUND, "Impossible de desactiver la 2FA pour cet utilisateur !"));
        else return Promise.reject();
    });
}

export async function getBackupCodes(userId: number): Promise<string[]> {
    const query = `SELECT bakcup_codes FROM ${env.DB_TOTP_TABLE} WHERE user_id = ?`;
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
                resolve([]);
                return;
            }
            resolve(typedRow.backup_codes.split(","));
        });
    });
}

export async function getAllTotpDatas(userId: number): Promise<Dictionary<any>> {
    const query = `SELECT * FROM ${env.DB_TOTP_TABLE} WHERE user_id = ?`;
    const db = await dbPool.acquire();
    return new Promise((resolve, reject) => {
        db.get(query, [userId], (err, row) => {
            dbPool.release(db);
            if (err) reject(err);
            if (typeof row === "undefined") {
                reject(new ApiError(ApiErrorCode.RESOURCE_NOT_FOUND, "Impossible de retrouver les datas 2FA de cet utilistateur"));
                return;
            }
            resolve(toCamelCase(row));
        });
    });
}

export async function updateBackupCodes(userId: number, backupCodes: string[]): Promise<void> {
    const query = `UPDATE ${env.DB_TOTP_TABLE} SET backup_codes = ? WHERE user_id = ?`;

    const db = await dbPool.acquire();
    db.run(query, [backupCodes.join(","), userId], function (err) {
        dbPool.release(db);
        if (err) return Promise.reject(err);
        else return Promise.resolve();
    });
}
