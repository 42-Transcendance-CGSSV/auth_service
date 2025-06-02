export interface IPublicUser {
    id: number;
    name: string;
    email: string;
    createdAt: number;
    verified: boolean;

    isExternal: boolean;
    hasTotpProtection: boolean;
    hasPassedTotp: boolean;
}

export interface IProtectedUser extends IPublicUser {
    externalToken: string | null;
    password: string | null;
    totpSecret: string | null;
}

export function toPublicUser(objet: IProtectedUser): IPublicUser {
    return {
        id: objet.id,
        name: objet.name,
        verified: objet.verified,
        email: objet.email,
        createdAt: objet.createdAt,
        hasTotpProtection: objet.totpSecret != null,
        hasPassedTotp: objet.totpSecret != null && objet.hasPassedTotp ? true : false,
        isExternal: !("password" in objet)
    };
}
