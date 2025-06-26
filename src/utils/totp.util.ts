import { TOTP } from "totp-generator";
import { addSeconds, getTimestamp } from "./timestamp.util";
import QRCode from "qrcode";
import { ApiError, ApiErrorCode } from "./errors.util";

function getTotpIssuer(): string {
    return "FTTRANSANDENCEJGCSS";
}

function getTotpLabel(accountName: string): string {
    return getTotpIssuer() + ":" + accountName;
}

function getTotpURI(totpSecret: string, accountName: string): string {
    return "otpauth://totp/" + getTotpLabel(accountName) + "?secret=" + totpSecret + "&issuer=" + getTotpIssuer();
}

export function generateTotpSecretKey(): string {
    const secretBase: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < 16; i++) {
        const randomIndex = Math.floor(Math.random() * secretBase.length);
        secret += secretBase[randomIndex];
    }
    return secret;
}

export function generateTotpCode(totpSecret: string, timestamp: number | null): string {
    return timestamp === null
        ? TOTP.generate(totpSecret, {
              digits: 6,
              period: 30
          }).otp
        : TOTP.generate(totpSecret, {
              digits: 6,
              period: 30,
              timestamp: timestamp
          }).otp;
}

export function totpCodeIsValid(totpSecret: string, code: string): boolean {
    const window = 1;
    const currentTimestamp = getTimestamp();

    const currentCode = generateTotpCode(totpSecret, currentTimestamp);

    if (currentCode === code) return true;

    for (let i = 1; i <= window; i++) {
        const pastTimestamp = addSeconds(currentTimestamp, -i * 30);
        const pastCode = generateTotpCode(totpSecret, pastTimestamp);
        if (pastCode === code) return true;

        const futureTimestamp = addSeconds(currentTimestamp, i * 30);
        const futureCode = generateTotpCode(totpSecret, futureTimestamp);
        if (futureCode === code) return true;
    }

    return false;
}

export async function generateTotpQrCode(totpSecret: string, accountName: string): Promise<string> {
    try {
        return await QRCode.toDataURL(getTotpURI(totpSecret, accountName), {
            errorCorrectionLevel: "high",
            type: "image/png",
            color: { dark: "#4318D1" }
        });
    } catch {
        throw new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, "Impossible de generer le QR code TOTP !");
    }
}
