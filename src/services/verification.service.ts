import { generateUUID } from "../utils/uuid.util";
import { deleteVerificationToken, getVerificationToken, insertVerificationToken } from "../database/repositories/verification.repository";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { FastifyRequest } from "fastify";
import { activateUser } from "../database/repositories/user.repository";

export class VerificationService {
    public static async sendVerificationToken(userId: number): Promise<void> {
        const token: string = await this.createVerificationToken(userId);
        console.log(token);
    }

    public static async createVerificationToken(userId: number): Promise<string> {
        let simplyToken: string = userId.toString();
        simplyToken += generateUUID();
        simplyToken += userId.toString();

        const token: string = Buffer.from(simplyToken).toString("base64");

        await insertVerificationToken(userId, token);
        return Promise.resolve(token);
    }

    public static async activateAccount(req: FastifyRequest): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const { token } = req.query as { token: string };
            if (!token) {
                reject(new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Le token est necessaire pour l'activation du compte"));
                return;
            }

            this.verificationTokenIsValid(token).then((result) => {
                if (result) {
                    activateUser(Buffer.from(token, "base64").toString("ascii").charAt(0) as unknown as number)
                        .then(() => {
                            deleteVerificationToken(token);
                            resolve();
                        })
                        .catch(() => reject(new ApiError(ApiErrorCode.INVALID_TOKEN, "Le token de verification est invalide !")));
                } else {
                    reject(new ApiError(ApiErrorCode.INVALID_TOKEN, "Le token de verification est invalide !"));
                }
            });
        });
    }

    private static async verificationTokenIsValid(token: string): Promise<boolean> {
        //Weweee j'avais trop la flemme de faire un truc securise pour ce genre projet
        //La bonne chose a faire aurait ete de ne pas inclure le user id dans le token et que mon token soit
        //Seulement un uuid generee et hashe avec du sha256 ou du bcrypt et faire mes requetes sql en cherchant
        //directement le token mais honnetement j'vais pas envie de me casser la tete :)
        const simplyToken: string = Buffer.from(token, "base64").toString("ascii");
        const start: string = simplyToken.charAt(0);
        const end: string = simplyToken.charAt(simplyToken.length - 1);
        if (start !== end) return Promise.resolve(false);
        try {
            const userId = Number.parseInt(start, 10);
            if (isNaN(userId)) return Promise.resolve(false);
            const dbToken: string = await getVerificationToken(userId);
            return Promise.resolve(dbToken === token);
        } catch {
            return Promise.resolve(false);
        }
    }
}
