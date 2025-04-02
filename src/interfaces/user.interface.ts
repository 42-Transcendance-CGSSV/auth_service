export interface IUser {
    id: number;
    name: string;
    email: string;
    createdAt: number;
    verified: boolean;
    authProvider: string; //LOCAL or EXTERNAL
}

export interface IPublicUser {
    id: number;
    name: string;
    authProvider: string; //LOCAL or EXTERNAL
    verified: boolean;
}

export interface ILocalUser extends IUser {
    password: string;
}

export interface IExternalUser extends IUser {
    externalToken: string;
}
