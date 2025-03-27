import { IGoogleUser, ILocalUser, AuthProvider } from "../interfaces/user.interface";

class FactoryUser {
    public static createLocalUser(id: string, name: string, email: string, passwordHash: string): ILocalUser {
        return {
            id,
            name,
            email,
            passwordHash,
            createdAt: new Date(),
            isVerified: false,
            authProvider: AuthProvider.LOCAL
        };
    }

    public static createGoogleUser(id: string, name: string, email: string, externalProviderId: string): IGoogleUser {
        return {
            id,
            name,
            email,
            externalProviderId,
            createdAt: new Date(),
            isVerified: true,
            authProvider: AuthProvider.GOOGLE
        };
    }
}

export default FactoryUser;
