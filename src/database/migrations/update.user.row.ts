import { FastifyInstance } from "fastify";
import { ILocalUser, IUser } from "../../interfaces/user.interface";

async function insertOrUpdateInternalUser(user: ILocalUser, app: FastifyInstance): Promise<IUser> {
    const query = `
      INSERT INTO users (id, name, email, passwordHash, authProvider, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO
      UPDATE SET
          name = excluded.name,
          email = excluded.email,
          passwordHash = excluded.passwordHash,
          authProvider = excluded.authProvider,
          createdAt = excluded.createdAt
          RETURNING id, name, email, createdAt, isVerified, authProvider;
  `;

    return app.db
        .get(query, user.id, user.name, user.email, user.passwordHash, user.authProvider.valueOf(), user.createdAt)
        .then((value) => {
            if (!value) {
                return Promise.reject(new Error("Failed to insert or update user"));
            }
            if (typeof value !== "undefined") {
                return value;
            }
            return Promise.reject(new Error("Failed to insert or update user"));
        })
        .catch((err) => {
            return Promise.reject(err);
        });
}

export default insertOrUpdateInternalUser;
