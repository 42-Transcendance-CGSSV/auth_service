import { dbPool } from "../database";
import { IPublicUser, IUser } from "../../interfaces/user.interface";
import { env } from "../../utils/environment";
import LocalUser from "../../classes/LocalUser";
import ExternalUser from "../../classes/ExternalUser";
import { ApiError, ApiErrorCode } from "../../utils/errors.util";
import { toCamelCase } from "../../utils/case.util";

export async function createUsersTable(): Promise<void> {
    //@formatter:off
    const query = `CREATE TABLE IF NOT EXISTS ${env.DB_USERS_TABLE}
        (
            id INTEGER PRIMARY KEY,
            name VARCHAR(16) NOT NULL UNIQUE,
            email VARCHAR(320) NOT NULL UNIQUE,
            password VARCHAR(32),
            auth_provider VARCHAR(8) NOT NULL,
            external_token TEXT,
            created_at INTEGER NOT NULL,
            verified boolean NOT NULL
        )`;

    const db = await dbPool.acquire();
    db.run(query, (err) => {
        dbPool.release(db);
        if (err) throw new ApiError(ApiErrorCode.DATABASE_ERROR, err.message);
    });
}

export async function insertUser(user: IUser): Promise<IPublicUser> {
    const query = `INSERT INTO ${env.DB_USERS_TABLE} (id, name, email, password, auth_provider, external_token, created_at, verified)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const password = user.authProvider === "LOCAL" ? await (user as LocalUser).hashPassword() : null;
    const externalProviderId = user.authProvider === "EXTERNAL" ? (user as ExternalUser).externalToken : null;

    const db = await dbPool.acquire();

    return new Promise<IPublicUser>((resolve, reject) => {
        db.run(
            query,
            [null, user.name, user.email, password, user.authProvider, externalProviderId, user.createdAt, user.verified],
            function (err) {
                dbPool.release(db);
                if (err) {
                    reject(
                        new ApiError(
                            ApiErrorCode.RESOURCE_ALREADY_EXISTS,
                            "Un utilisateur ayant le meme pseudo / email est deja present dans la base de donnes !"
                        )
                    );
                } else {
                    user.id = this.lastID;
                    resolve(user);
                }
            }
        );
    });
}

export async function userExists(email: string, username: string): Promise<boolean> {
    const query = `SELECT EXISTS(SELECT 1 FROM ${env.DB_USERS_TABLE} WHERE email = ? OR name = ?) AS userExists;`;

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

export async function getUserByName(name: string): Promise<IUser> {
    const query = `SELECT * FROM ${env.DB_USERS_TABLE} WHERE name = ?`;

    const db = await dbPool.acquire();

    return new Promise<IUser>((resolve, reject) => {
        db.get<IUser>(query, [name], (err, row) => {
            dbPool.release(db);
            if (err) {
                reject(
                    new ApiError(
                        ApiErrorCode.USER_NOT_FOUND,
                        `Impossible de trouver un utilisateur ayant le pseudo ${name} dans la base de donnees !`
                    )
                );
            } else resolve(toCamelCase(row) as unknown as IUser);
        });
    });
}

export async function getUserByEmail(email: string): Promise<IUser> {
    const query = `SELECT * FROM ${env.DB_USERS_TABLE} WHERE email = ?`;

    const db = await dbPool.acquire();

    return new Promise<IUser>((resolve, reject) => {
        db.get<IUser>(query, [email], (err, row) => {
            dbPool.release(db);
            if (err) {
                reject(
                    new ApiError(
                        ApiErrorCode.USER_NOT_FOUND,
                        `Impossible de trouver un utilisateur ayant l'email ${email} dans la base de donnees !`
                    )
                );
            } else resolve(toCamelCase(row) as unknown as IUser);
        });
    });
}

export async function getUserById(id: number): Promise<IUser> {
    const query = `SELECT * FROM ${env.DB_USERS_TABLE} WHERE id = ?`;

    const db = await dbPool.acquire();

    return new Promise<IUser>((resolve, reject) => {
        db.get<IUser>(query, [id], (err, row) => {
            dbPool.release(db);
            if (err) {
                reject(
                    new ApiError(
                        ApiErrorCode.USER_NOT_FOUND,
                        `Impossible de trouver un utilisateur ayant l'id ${id} dans la base de donnees !`
                    )
                );
            } else resolve(toCamelCase(row) as unknown as IUser);
        });
    });
}

export async function updatePartialUser<T>(userId: any, partialData: Partial<T>, fieldsToUpdate: (keyof T)[]): Promise<void> {
    if (!fieldsToUpdate || fieldsToUpdate.length === 0) return;

    const values = fieldsToUpdate.map((field) => partialData[field]);
    const filteredFields = fieldsToUpdate.filter((_, index) => values[index] !== null && values[index] !== undefined);
    const filteredValues = values.filter((value) => value !== null && value !== undefined);

    const setClause = filteredFields.map((fField) => `${String(fField)} = ?`).join(", ");
    const query = `UPDATE ${env.DB_USERS_TABLE} SET ${setClause} WHERE id = ?`;

    filteredValues.push(userId);

    const db = await dbPool.acquire();
    db.run(query, filteredValues, (err: Error | null) => {
        dbPool.release(db);
        if (err) throw err;
    });
}

export async function activateUser(userId: number): Promise<void> {
    const query: string = `UPDATE ${env.DB_USERS_TABLE} SET verified = 1 WHERE id = ?`;
    const db = await dbPool.acquire();

    db.run(query, [userId], (err: Error | null) => {
        dbPool.release(db);
        if (err) throw err;
    });
}

export async function deleteUser(id: number): Promise<boolean> {
    const query = `DELETE FROM ${env.DB_USERS_TABLE} WHERE id = ?`;
    const db = await dbPool.acquire();
    return new Promise<boolean>((resolve, reject) => {
        db.run(query, [id], function (err) {
            dbPool.release(db);
            if (err) reject(err);
            else resolve(true);
        });
    });
}
