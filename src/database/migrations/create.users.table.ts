import { FastifyInstance } from "fastify";

function createUsersTable(app: FastifyInstance): Promise<void> {
    return app.db.all(`
      CREATE TABLE IF NOT EXISTS users
      (
          id
          INTEGER
          PRIMARY
          KEY
          AUTOINCREMENT,
          name
          TEXT
          NOT
          NULL,
          email
          TEXT
          NOT
          NULL
          UNIQUE,
          passwordHash
          TEXT,
          authProvider
          INTEGER
          NOT
          NULL,
          externalProviderId
          TEXT,
          createdAt
          INTEGER
          NOT
          NULL
      )
  `);
}

export default createUsersTable;
