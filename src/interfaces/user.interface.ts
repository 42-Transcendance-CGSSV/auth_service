export interface IUser {
    id: number;
    name: string;
    email: string;
    createdAt: number;
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

export interface IExternalUser extends IUser {
    externalProviderId: string;
}
