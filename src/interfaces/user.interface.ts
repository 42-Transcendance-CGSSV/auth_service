export interface IUser {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    isVerified: boolean;
    authProvider: AuthProvider;
}

export enum AuthProvider {
    LOCAL = 0,
    GOOGLE = 1
}

export interface ILocalUser extends IUser {
    passwordHash: string;
}

export interface IGoogleUser extends IUser {
    externalProviderId: string;
}
