import { IExternalUser, ILocalUser, AuthProvider } from "../interfaces/user.interface";

class FactoryUser {
    public static createLocalUser(name: string, email: string, passwordHash: string): ILocalUser {
        return {
            id: -1,
            name,
            email,
            passwordHash,
            createdAt: Date.now(),
            isVerified: false,
            authProvider: AuthProvider.LOCAL
        };
    }

    public static createGoogleUser(name: string, email: string, externalProviderId: string): IExternalUser {
        return {
            id: -1,
            name,
            email,
            externalProviderId,
            createdAt: Date.now(),
            isVerified: true,
            authProvider: AuthProvider.EXTERNAL
        };
    }
}

export default FactoryUser;
