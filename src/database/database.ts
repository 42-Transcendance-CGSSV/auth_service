import { createPool, Factory, Pool } from "generic-pool";
import sqlite3 from "sqlite3";

const sqlite3Factory: Factory<sqlite3.Database> = {
    create: (): any => {
        return new sqlite3.Database("../data/my-database.db");
    },

    destroy: (db: sqlite3.Database): any => {
        db.close((err) => {
            if (err) {
                console.error("Error closing database:", err.message);
            }
        });
    },
    validate: (db: sqlite3.Database) => {
        return new Promise<boolean>((resolve) => {
            db.get("SELECT 1", [], (err) => {
                resolve(!err);
            });
        });
    }
};

export const dbPool: Pool<sqlite3.Database> = createPool(sqlite3Factory, {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    testOnBorrow: true
});
