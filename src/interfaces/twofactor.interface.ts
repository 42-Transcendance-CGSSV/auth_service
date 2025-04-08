interface TwoFactorInterface {
    userId: number;
    token: string;
    backupCodes: string[];
}

export default TwoFactorInterface;
