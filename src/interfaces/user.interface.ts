export interface IPublicUser {
    id: number;
    name: string;
    authProvider: "LOCAL" | "EXTERNAL";
    verified: boolean;
}

export interface IUser extends IPublicUser {
    email: string;
    createdAt: number;
}

export interface ILocalUser extends IUser {
    password: string;
}

export interface IExternalUser extends IUser {
    externalToken: string;
}
