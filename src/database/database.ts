import { createPool, Factory, Pool } from "generic-pool";
import sqlite3, { Database } from "sqlite3";
import { FastifyInstance } from "fastify";
import fs from "fs";
import { createUsersTable } from "./repositories/user.repository";
import { createTokensTable, evictExpiredTokens } from "./repositories/refreshtokens.repository";
import { createVerificationTokenTable } from "./repositories/verification.repository";
import { createPicturesTable } from "./repositories/pictures.repository";

function buildFactory(app: FastifyInstance): Factory<sqlite3.Database> {
    return {
        create: (): any => {
            return new sqlite3.Database("./data/auth_database.db", (err) => {
                if (err) {
                    app.log.error("Error opening database:", err.message);
                    fs.exists("./data/auth_database.db", (bool) => {
                        if (!bool) {
                            app.log.error("Database file does not exist. Please create the database.");
                            process.exit(1);
                        }
                    });
                }
            });
        },

        destroy: (db: sqlite3.Database): any => {
            db.close((err) => {
                if (err) {
                    app.log.fatal("Error closing database:", err.message);
                }
            });
        },
        validate: (db: sqlite3.Database): any => {
            return new Promise<boolean>((resolve) => {
                db.get("SELECT 1", [], (err) => {
                    resolve(!err);
                });
            });
        }
    };
}

export let dbPool: Pool<Database>;

export async function createDatabase(app: FastifyInstance): Promise<void> {
    try {
        if (!fs.existsSync("./data/auth_database.db")) {
            app.log.info("Creating database file...");
            fs.mkdirSync("./data", { recursive: true });
            fs.createWriteStream("./data/auth_database.db").end();
            app.log.info("Database file created successfully !");
        }

        if (!fs.existsSync("./data/static/profiles_pictures")) {
            app.log.info("Creating static directory for profile pictures...");
            fs.mkdirSync("./data/static/profiles_pictures", { recursive: true });
            app.log.info("Static directory for profile pictures created successfully !");
        }

        dbPool = getPool(app);
        app.log.info("Creating database tables...");
        app.log.info("   Creating users table...");
        await createUsersTable();
        app.log.info("   Users table created successfully !");

        app.log.info("   Creating 'refresh tokens' table...");
        await createTokensTable(app);
        app.log.info("   'Refresh tokens' table created successfully !");

        app.log.info("   Creating 'verifications tokens' table...");
        await createVerificationTokenTable(app);
        app.log.info("   'Verifications' table created successfully !");

        app.log.info("   Creating 'pictures' table...");
        await createPicturesTable(app);
        app.log.info("   'Pictures' table created successfully !");

        setInterval(async () => {
            app.log.info("Flushing old refresh tokens...");
            await evictExpiredTokens();
            app.log.info("Old refresh tokens flushed successfully !\n");
        }, 1000 * 60);
    } catch (error) {
        app.log.error("An error occurred while creating the database");
        return Promise.reject(error);
    }
}

export function getPool(app: FastifyInstance): Pool<Database> {
    try {
        app.log.info("Getting database pool...");
        const pool: Pool<Database> = createPool(buildFactory(app), {
            min: 2,
            max: 10,
            idleTimeoutMillis: 30000,
            testOnBorrow: true
        });
        app.log.info("Database pool created successfully !");
        return pool;
    } catch (error) {
        app.log.error("An error occurred while creating the database pool", error);
        process.exit(1);
    }
}
