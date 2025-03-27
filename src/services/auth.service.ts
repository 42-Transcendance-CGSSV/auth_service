import { AuthProvider, ILocalUser, IUser } from "../interfaces/user.interface";
import HashUtil from "../utils/hash.util";

export class AuthService {
    public async registerUser(user: IUser) {
        //Check if the user with the same name or email already exists in database

        if (user.authProvider === AuthProvider.LOCAL) {
            return this.registerLocalUser(user as ILocalUser);
        } else if (user.authProvider === AuthProvider.GOOGLE) {
            // Check if the user with the same externalProviderId already exists in database
            // Save google user to database
            return Promise.resolve();
        }
    }

    private async registerLocalUser(user: IUser): Promise<ILocalUser> {
        if (user.authProvider !== AuthProvider.LOCAL) {
            return Promise.reject(new Error("Invalid auth provider, local auth provider is expected"));
        }

        if (!("passwordHash" in user)) {
            return Promise.reject(new Error("Invalid local user: passwordHash is required"));
        }

        const localUser = user as ILocalUser;
        localUser.passwordHash = await HashUtil.hashPassword(localUser.passwordHash);
        // Save local user to database

        return Promise.resolve(localUser);
    }
}
