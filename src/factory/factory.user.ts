import { UserModel, AuthProvider } from "../models/user.model";

class FactoryUser {
    public static createTranscendenceAccount(name: string, email: string, passwordHash: string): UserModel {
        return new UserModel(name, email, passwordHash, AuthProvider.LOCAL, null, false, Date.now());
    }

    public static createGoogleAccount(name: string, email: string, externalProviderId: string): UserModel {
        return new UserModel(name, email, null, AuthProvider.GOOGLE, externalProviderId, true, Date.now());
    }
}

export default FactoryUser;
