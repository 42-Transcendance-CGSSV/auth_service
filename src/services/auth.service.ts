import { AuthProvider, ILocalUser, IUser } from "../interfaces/user.interface";
import HashUtil from "../utils/hash.util";
import { FastifyInstance } from "fastify";
import insertOrUpdateInternalUser from "../database/migrations/update.user.row";

export class AuthService {
    public async registerUser(user: IUser, app: FastifyInstance): Promise<IUser | number> {
        //Check if the user with the same name or email already exists in database

        if (user.authProvider === AuthProvider.LOCAL) {
            return this.registerLocalUser(user, app);
        } else {
            // Check if the user with the same externalProviderId already exists in database
            // Save google user to database
            return Promise.resolve(0);
        }
    }

    private async registerLocalUser(user: IUser, app: FastifyInstance): Promise<IUser> {
        if (user.authProvider !== AuthProvider.LOCAL) {
            return Promise.reject(new Error("Invalid auth provider, local auth provider is expected"));
        }

        if (!("passwordHash" in user)) {
            return Promise.reject(new Error("Invalid local user: passwordHash is required"));
        }

        const localUser = user as ILocalUser;
        localUser.passwordHash = await HashUtil.hashPassword(localUser.passwordHash);
        // Save local user to database

        return Promise.resolve(insertOrUpdateInternalUser(localUser, app));
    }
}
