import { dbPool } from "../database";
import { AuthProvider, IExternalUser, ILocalUser, IUser } from "../../interfaces/user.interface";

export async function createUsersTable(): Promise<void> {
    const query = `
        CREATE TABLE IF NOT EXISTS ${process.env.DB_USERS_TABLE}
        (
            id                 INTEGER PRIMARY KEY,
            name               TEXT    NOT NULL,
            email              TEXT    NOT NULL UNIQUE,
            passwordHash       TEXT,
            authProvider       INTEGER NOT NULL,
            externalProviderId TEXT,
            createdAt          INTEGER NOT NULL,
            isVerified         BOOLEAN NOT NULL
        )
    `;
    const db = await dbPool.acquire();

    return new Promise<void>((resolve, reject) => {
        db.run(query, (err) => {
            dbPool.release(db);
            if (err) {
                reject(new Error("Failed to create users table: " + err.message));
            } else {
                resolve();
            }
        });
    });
}

export async function insertUser(user: IUser): Promise<IUser> {
    const query = `
        INSERT INTO users (id, name, email, passwordHash, authProvider, externalProviderId, createdAt, isVerified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const password = user.authProvider === AuthProvider.LOCAL ? (user as ILocalUser).passwordHash : null;
    const externalProviderId = !password ? (user as IExternalUser).externalProviderId : null;

    const db = await dbPool.acquire();

    return new Promise<IUser>((resolve, reject) => {
        db.run(
            query,
            [null, user.name, user.email, password, user.authProvider.valueOf(), externalProviderId, user.createdAt, user.isVerified],
            function (err) {
                dbPool.release(db);
                if (err) {
                    reject(new Error("Failed to insert user: " + err.message));
                } else {
                    user.id = this.lastID;
                    resolve(user);
                }
            }
        );
    });
}

export async function userExists(email: string, username: string): Promise<boolean> {
    const query = `SELECT EXISTS(SELECT 1 FROM users WHERE email = ? OR name = ?) AS userExists;`;

    const db = await dbPool.acquire();

    return new Promise<boolean>((resolve, reject) => {
        db.get<{ userExists: boolean }>(query, [email, username], (err, row) => {
            dbPool.release(db);
            if (err) {
                reject(new Error("Unable to check if the user exists: " + err.message));
            } else {
                resolve(row.userExists);
            }
        });
    });
}
