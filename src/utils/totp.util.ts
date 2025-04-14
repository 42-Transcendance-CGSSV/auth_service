import { TOTP } from "totp-generator";
import { addSeconds, getTimestamp } from "./timestamp.util";

export function generateCode(totpSecret: string, timestamp: number | null): string {
    return timestamp === null
        ? TOTP.generate(totpSecret, {
              digits: 8,
              period: 30
          }).otp
        : TOTP.generate(totpSecret, {
              digits: 8,
              period: 30,
              timestamp: timestamp
          }).otp;
}

export function isGood(totpSecret: string, code: string): boolean {
    const window = 1;
    const currentTimestamp = getTimestamp();

    const currentCode = generateCode(totpSecret, currentTimestamp);

    if (currentCode === code) return true;

    for (let i = 1; i <= window; i++) {
        const pastTimestamp = addSeconds(currentTimestamp, -i * 30);
        const pastCode = generateCode(totpSecret, pastTimestamp);
        if (pastCode === code) return true;

        const futureTimestamp = addSeconds(currentTimestamp, i * 30);
        const futureCode = generateCode(totpSecret, futureTimestamp);
        if (futureCode === code) return true;
    }

    return false;
}
