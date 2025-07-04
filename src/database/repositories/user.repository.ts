import { dbPool } from "../database";
import { ApiError, ApiErrorCode } from "../../utils/errors.util";
import { toCamelCase } from "../../utils/case.util";
import { IProtectedUser } from "../../interfaces/user.interface";
import { generateTotpSecretKey } from "../../utils/totp.util";

export async function createUsersTable(): Promise<void> {
    //@formatter:off
    const query = `CREATE TABLE IF NOT EXISTS users
        (
            id INTEGER PRIMARY KEY,
            name VARCHAR(16) NOT NULL UNIQUE,
            email VARCHAR(320) NOT NULL UNIQUE,
            password VARCHAR(32),
            created_at INTEGER NOT NULL,
            verified boolean NOT NULL,
            totp_secret TEXT NOT NULL,
            totp_enabled BOOLEAN DEFAULT FALSE,
            totp_backup_codes TEXT DEFAULT NULL
        )`;

    const db = await dbPool.acquire();
    db.run(query, (err) => {
        dbPool.release(db);
        if (err) throw new ApiError(ApiErrorCode.DATABASE_ERROR, err.message);
    });
}

export async function insertUser(user: IProtectedUser): Promise<number> {
    const query = `INSERT INTO users (id, name, email, password, created_at, verified, totp_secret) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const db = await dbPool.acquire();

    return new Promise<number>((resolve, reject) => {
        db.run(query, [null, user.name, user.email, user.password, user.createdAt, user.verified, generateTotpSecretKey()], function (err) {
            dbPool.release(db);
            if (err) {
                reject(
                    new ApiError(
                        ApiErrorCode.RESOURCE_ALREADY_EXISTS,
                        "Un utilisateur ayant le meme pseudo / email est deja present dans la base de donnes !"
                    )
                );
                return;
            }
            resolve(this.lastID);
        });
    });
}

export async function userExists(email: string, username: string): Promise<boolean> {
    const query = `SELECT EXISTS(SELECT 1 FROM users WHERE email = ? OR name = ?) AS userExists;`;

    const db = await dbPool.acquire();

    return new Promise<boolean>((resolve, reject) => {
        db.get<{ userExists: boolean }>(query, [email, username], (err, row) => {
            dbPool.release(db);
            if (err)
                reject(
                    new ApiError(
                        ApiErrorCode.USER_NOT_FOUND,
                        `Impossible de trouver le compte utilisateur ${email} ${username} dans la base de donnes!`
                    )
                );
            else resolve(row.userExists);
        });
    });
}

export async function getUserByKey(key: string, keyValue: any): Promise<IProtectedUser> {
    const query = `SELECT * FROM users WHERE ${key} = ?`;

    const db = await dbPool.acquire();

    return new Promise<IProtectedUser>((resolve, reject) => {
        db.get(query, [keyValue], async (err, row) => {
            await dbPool.release(db);
            if (err) {
                reject(
                    new ApiError(
                        ApiErrorCode.USER_NOT_FOUND,
                        `Impossible de trouver un utilisateur correspondant a ${key} = ${keyValue} dans la base de donnees !`
                    )
                );
                return;
            }
            if (!row)
                reject(
                    new ApiError(
                        ApiErrorCode.USER_NOT_FOUND,
                        `Impossible de trouver un utilisateur correspondant a ${key} = ${keyValue} dans la base de donnees !`
                    )
                );
            resolve(toCamelCase(row) as IProtectedUser);
        });
    });
}

export async function updatePartialUser<T>(userId: any, partialData: Partial<T>, fieldsToUpdate: (keyof T)[]): Promise<void> {
    if (!fieldsToUpdate || fieldsToUpdate.length === 0) return;

    const values = fieldsToUpdate.map((field) => partialData[field]);
    const filteredFields = fieldsToUpdate.filter((_, index) => values[index] !== null && values[index] !== undefined);
    const setClause = filteredFields.map((fField) => `${String(fField)} = ?`).join(", ");
    const query = `UPDATE users SET ${setClause} WHERE id = ?`;

    const filteredValues = values.filter((value) => value !== null && value !== undefined);
    filteredValues.push(userId);

    const finalValues: ((Partial<T>[keyof T] & {}) | null)[] = [];
    for (let i = 0; i < filteredValues.length; i++) {
        if (filteredValues[i] === "null") finalValues.push(null);
        else finalValues.push(filteredValues[i]);
    }
    const db = await dbPool.acquire();
    return new Promise<void>((resolve, reject) => {
        db.run(query, finalValues, (err: Error | null) => {
            dbPool.release(db);
            if (err) {
                let errorMessage = err.message;
                if (err.message.includes("CONSTRAINT")) {
                    if (err.message.includes("users.name")) errorMessage = "Un utilisateur avec ce pseudo existe deja !";
                    else if (err.message.includes("users.email")) errorMessage = "Un utilisateur avec cet email existe deja !";
                }
                reject(new ApiError(ApiErrorCode.UNPROCESSABLE_ENTITY, `Impossible de mettre a jour l'utilisateur : ${errorMessage}`));
            } else resolve();
        });
    });
}

export async function activateUser(userId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const query: string = `UPDATE users SET verified = 1 WHERE id = ?`;
        dbPool
            .acquire()
            .then((db) => {
                db.run(query, [userId], (err: Error | null) => {
                    dbPool.release(db);
                    if (err) reject(new ApiError(ApiErrorCode.USER_NOT_FOUND, `Impossible d'activer l'utilisateur avec l'ID ${userId} !`));
                    resolve();
                });
            })
            .catch(reject);
    });
}

export async function deleteUser(userId: number): Promise<boolean> {
    const query = `DELETE FROM users WHERE id = ?`;
    const db = await dbPool.acquire();
    return new Promise<boolean>((resolve, reject) => {
        db.run(query, [userId], function (err) {
            dbPool.release(db);
            if (err) reject(new ApiError(ApiErrorCode.USER_NOT_FOUND, `Impossible de supprimer l'utilisateur avec l'ID ${userId} !`));
            else resolve(true);
        });
    });
}
