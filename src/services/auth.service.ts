import { AuthProvider, IExternalUser, ILocalUser, IUser } from "../interfaces/user.interface";
import HashUtil from "../utils/hash.util";
import { insertUser, userExists } from "../database/repositories/user.repository";
import UserFactory from "../factory/factory.user";

export class AuthService {
    public async registerUser(typedBody: any): Promise<IUser> {
        let user: IUser;

        if (typedBody.authProvider === AuthProvider.LOCAL) {
            if (!typedBody.password) throw new Error("Password is required for local users.");
            user = UserFactory.createLocalUser(typedBody.name, typedBody.email, typedBody.password);
        } else if (typedBody.authProvider === AuthProvider.EXTERNAL) {
            if (!typedBody.externalProviderId) throw new Error("External provider ID is required for External users.");
            user = UserFactory.createGoogleUser(typedBody.name, typedBody.email, typedBody.externalProviderId);
        } else {
            throw new Error("Invalid auth provider");
        }

        const exists = await userExists(user.email, user.name);
        if (exists) {
            throw new Error("User already exists");
        }
        if (user.authProvider === AuthProvider.LOCAL) {
            const localUser = user as ILocalUser;
            localUser.passwordHash = await HashUtil.hashPassword(localUser.passwordHash);
            return insertUser(localUser);
        }

        return insertUser(user as IExternalUser);
    }
}
