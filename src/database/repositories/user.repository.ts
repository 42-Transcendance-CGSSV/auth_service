import { dbPool } from "../database";
import { IPublicUser, IUser } from "../../interfaces/user.interface";
import { env } from "../../utils/environment";
import LocalUser from "../../classes/LocalUser";
import ExternalUser from "../../classes/ExternalUser";
import { ApiError, ApiErrorCode } from "../../utils/errors.util";
import { camelCase, mapKeys } from "lodash";

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
    await new Promise<void>((resolve, reject) => {
        db.run(query, (err) => {
            dbPool.release(db);
            if (err) reject(err);
            else resolve();
        });
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
            } else resolve(mapKeys(row, (_, key) => camelCase(key)) as unknown as IUser);
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
            } else resolve(mapKeys(row, (_, key) => camelCase(key)) as unknown as IUser);
        });
    });
}

export async function updateUser(user: IUser): Promise<boolean> {
    const query = `UPDATE ${env.DB_USERS_TABLE} 
                    SET name = ?, email = ?, password = ?
                    WHERE id = ?`;

    const password = user.authProvider === "LOCAL" ? await (user as LocalUser).hashPassword() : null;

    const db = await dbPool.acquire();

    return new Promise<boolean>((resolve, reject) => {
        db.run(query, [user.name, user.email, password, user.verified, user.id], (err: Error | null) => {
            dbPool.release(db);
            if (err) reject(err);
            else resolve(true);
        });
    });
}

export async function activateUser(userId: number): Promise<void> {
    const query = "UPDATE ${env.DB_USERS_TABLE} SET verified = 1 WHERE id = ?";
    const db = await dbPool.acquire();

    return new Promise<void>((resolve, reject) => {
        db.run(query, [userId], (err: Error | null) => {
            dbPool.release(db);
            if (err) reject(err);
            else resolve();
        });
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
