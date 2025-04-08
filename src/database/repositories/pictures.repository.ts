import { dbPool } from "../database";
import { env } from "../../utils/environment";
import { FastifyInstance } from "fastify";
import { getTimestamp } from "../../utils/timestamp.util";

export async function createPicturesTable(app: FastifyInstance): Promise<void> {
    //@formatter:off
    const query = `
        CREATE TABLE IF NOT EXISTS ${env.DB_PICTURES_TABLES} 
        (
            user_id INTEGER UNIQUE PRIMARY KEY,
            picture_path  VARCHAR(50) NOT NULL UNIQUE, 
            changed_at INTEGER NOT NULL,
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
        app.log.error("Error creating pictures table:", error);
        throw error;
    }
}

export async function updatePicturePath(userId: number, picturePath: string): Promise<void> {
    const query = `REPLACE INTO ${env.DB_PICTURES_TABLES} (user_id, picture_path, changed_at) VALUES (?, ?, ?)`;

    const db = await dbPool.acquire();
    db.run(query, [userId, picturePath, getTimestamp()], function (err) {
        dbPool.release(db);
        if (err) throw err;
    });
}

export async function getPicturePath(userId: number): Promise<string> {
    const query = `SELECT picture_path FROM ${env.DB_PICTURES_TABLES} WHERE user_id = ?`;
    const db = await dbPool.acquire();
    return new Promise<string>((resolve) => {
        db.get(query, userId, (err, row) => {
            dbPool.release(db);
            if (err) resolve("/data/static/profiles_pictures/sets/default.jpg");
            const typedRow = row as { picture_path: string };
            if (!row || !typedRow || !("picture_path" in typedRow) || typeof typedRow.picture_path === "undefined") {
                resolve("/data/static/profiles_pictures/sets/default.jpg");
                return;
            }
            resolve(typedRow.picture_path);
        });
    });
}
