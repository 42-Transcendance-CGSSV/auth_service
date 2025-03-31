import { dbPool } from "../database";
import { AuthProvider, IExternalUser, ILocalUser, IUser } from "../../interfaces/user.interface";
import { env } from "../../utils/environment";

export async function createUsersTable(): Promise<void> {
    //@formatter:off
    const query = `CREATE TABLE IF NOT EXISTS ${env.DB_USERS_TABLE}
        (
            id INTEGER PRIMARY KEY,
            name text NOT NULL,
            email text NOT NULL UNIQUE,
            passwordhash text,
            authprovider INTEGER NOT NULL,
            externalproviderid text,
            createdat  INTEGER NOT NULL,
            isverified boolean NOT NULL
        )`;

    const db = await dbPool.acquire();
    await new Promise<void>((resolve, reject) => {
        db.run(query, (err) => {
            dbPool.release(db);
            if (err) reject(new Error("Failed to create users table: " + err.message));
            else resolve();
        });
    });
}

export async function insertUser(user: IUser): Promise<IUser> {
    const query = `INSERT INTO ${env.DB_USERS_TABLE} (id, name, email, passwordHash, authProvider, externalProviderId, createdAt, isVerified) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const password = user.authProvider === AuthProvider.LOCAL ? (user as ILocalUser).passwordHash : null;
    const externalProviderId = !password ? (user as IExternalUser).externalProviderId : null;

    const db = await dbPool.acquire();

    return new Promise<IUser>((resolve, reject) => {
        db.run(
            query,
            [null, user.name, user.email, password, user.authProvider.valueOf(), externalProviderId, user.createdAt, user.isVerified],
            function (err) {
                dbPool.release(db);
                if (err) reject(new Error("Failed to insert user: " + err.message));
                else {
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
            if (err) reject(new Error("Unable to check if the user exists: " + err.message));
            else resolve(row.userExists);
        });
    });
}

export async function getUserByEmail(email: string): Promise<IUser | null> {
    const query = `SELECT * FROM ${env.DB_USERS_TABLE} WHERE email = ?`;

    const db = await dbPool.acquire();

    return new Promise<IUser | null>((resolve, reject) => {
        db.get<IUser>(query, [email], (err, row) => {
            dbPool.release(db);
            if (err) reject(new Error("Unable to get user by email: " + err.message));
            else resolve(row);
        });
    });
}

export async function getUserById(id: number): Promise<IUser | null> {
    const query = `SELECT * FROM ${env.DB_USERS_TABLE} WHERE id = ?`;

    const db = await dbPool.acquire();

    return new Promise<IUser | null>((resolve, reject) => {
        db.get<IUser>(query, [id], (err, row) => {
            dbPool.release(db);
            if (err) reject(new Error("Unable to get user by ID: " + err.message));
            else resolve(row);
        });
    });
}

export async function updateUser(user: IUser): Promise<boolean> {
    const query = `UPDATE ${env.DB_USERS_TABLE} 
                    SET name = ?, email = ?, passwordHash = ?, isVerified = ? 
                    WHERE id = ?`;

    const password = user.authProvider === AuthProvider.LOCAL ? (user as ILocalUser).passwordHash : null;

    const db = await dbPool.acquire();

    return new Promise<boolean>((resolve, reject) => {
        db.run(query, [user.name, user.email, password, user.isVerified, user.id], function (err) {
            dbPool.release(db);
            if (err) reject(new Error("Failed to update user: " + err.message));
            else resolve(true);
        });
    });
}

export async function deleteUser(id: number): Promise<boolean> {
    const query = `DELETE FROM ${env.DB_USERS_TABLE} WHERE id = ?`;
    const db = await dbPool.acquire();
    return new Promise<boolean>((resolve, reject) => {
        db.run(query, [id], function (err) {
            dbPool.release(db);
            if (err) reject(new Error("Failed to delete user: " + err.message));
            else resolve(true);
        });
    });
}
