import bcrypt from "bcrypt";

class HashUtil {
    private static SALT_ROUNDS: number = 10;

    public static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, HashUtil.SALT_ROUNDS);
    }

    public static async comparePasswords(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}

export default HashUtil;
