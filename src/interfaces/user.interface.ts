export interface IPublicUser {
    id: number;
    name: string;
    email: string;
    createdAt: number;
    verified: boolean;

    totpEnabled: boolean;
    hasPassedTotp: boolean;
}

export interface IProtectedUser extends IPublicUser {
    password: string | null;
    totpSecret: string;
    totpBackupCodes: string;
}

export function toPublicUser(objet: IProtectedUser): IPublicUser {
    return {
        id: objet.id,
        name: objet.name,
        verified: objet.verified,
        email: objet.email,
        createdAt: objet.createdAt,
        totpEnabled: objet.totpEnabled && typeof objet.totpBackupCodes !== "undefined" && objet.totpBackupCodes.length > 0,
        hasPassedTotp: objet.totpSecret && objet.totpEnabled ? objet.hasPassedTotp : false
    };
}
