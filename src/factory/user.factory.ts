import { IProtectedUser } from "../interfaces/user.interface";
import { getTimestamp } from "../utils/timestamp.util";
import HashUtil from "../utils/hash.util";

export async function createLocalUser(name: string, email: string, password: string): Promise<IProtectedUser> {
    const hashedPass: string = await HashUtil.hashPassword(password);
    return createDefaultUser(-1, name, email.toLowerCase(), false, hashedPass, null);
}

export function createExternalUser(name: string, email: string, externalToken: string): IProtectedUser {
    return createDefaultUser(-1, name, email, true, null, externalToken);
}

function createDefaultUser(
    id: number,
    name: string,
    email: string,
    verified: boolean,
    password: string | null,
    externalToken: string | null
): IProtectedUser {
    return {
        id: id,
        name: name,
        email: email,
        verified: verified,
        totpSecret: null,
        hasPassedTotp: false,
        hasTotpProtection: false,
        createdAt: getTimestamp(),
        password: password,
        externalToken: externalToken
    } as IProtectedUser;
}
