import fpSqlitePlugin from "fastify-sqlite-typed";
import { Dbmode } from "fastify-sqlite-typed/src/types";
import { FastifyInstance } from "fastify";
import CreateAuthDatabase from "./migrations/create.auth.database";
import CreateUsersTable from "./migrations/create.users.table";

export async function initDatabase(app: FastifyInstance): Promise<boolean> {
    try {
        await openDatabase(app);
        app.log.debug("DataSource is now open!");

        await CreateAuthDatabase(app);
        app.log.debug("Database transcendence_auth has been created!");

        await CreateUsersTable(app);
        app.log.debug("Table users has been created!");

        return true;
    } catch (err) {
        app.log.error("An error occurred while initializing the database", err);
        return false;
    }
}

export async function openDatabase(app: FastifyInstance): Promise<void> {
    return app.register(fpSqlitePlugin, {
        dbFilename: "../data/auth_database.db",
        mode: Dbmode.FULLMUTEX
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
