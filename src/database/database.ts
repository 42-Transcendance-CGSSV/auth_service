import fpSqlitePlugin from "fastify-sqlite-typed";
import { FastifyInstance } from "fastify";
import CreateUsersTable from "./migrations/create.users.table";
import fs from "fs";

export async function initDatabase(app: FastifyInstance): Promise<boolean> {
    try {
        fs.mkdir("./data", { recursive: true }, (err) => {
            if (err) {
                app.log.error("An error occurred while creating the data directory", err);
                return;
            }
        });
        const createStream = fs.createWriteStream("./data/auth_database.db");
        createStream.end();

        await openDatabase(app);
        app.log.debug("DataSource is now open!");

        if (!(await isOpen(app))) {
            return Promise.resolve(false);
        }

        await CreateUsersTable(app);
        app.log.debug("Table users has been created!");

        return Promise.resolve(true);
    } catch (err) {
        app.log.error("An error occurred while initializing the database", err);
        return Promise.reject(err);
    }
}

export async function openDatabase(app: FastifyInstance): Promise<void> {
    return app.register(fpSqlitePlugin, {
        dbFilename: "./data/auth_database.db",
        mode: 6
    });
}

export async function isOpen(app: FastifyInstance): Promise<boolean> {
    return app.db
        .get("SELECT 1")
        .catch(() => {
            Promise.reject(false);
        })
        .then(() => Promise.resolve(true));
}

export async function closeDatabase(app: FastifyInstance): Promise<void> {
    return app.db.close();
}
