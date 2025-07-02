import { IProtectedUser } from "../interfaces/user.interface";
import { getTimestamp } from "../utils/timestamp.util";
import HashUtil from "../utils/hash.util";

export async function createLocalUser(name: string, email: string, password: string): Promise<IProtectedUser> {
    const hashedPass: string = await HashUtil.hashPassword(password);
    return createDefaultUser(-1, name, email.toLowerCase(), false, hashedPass);
}

function createDefaultUser(id: number, name: string, email: string, verified: boolean, password: string): IProtectedUser {
    return {
        id: id,
        name: name,
        email: email,
        verified: verified,
        totpSecret: "DEFAULT_SECRET",
        hasPassedTotp: false,
        totpEnabled: false,
        createdAt: getTimestamp(),
        password: password
    } as IProtectedUser;
}
