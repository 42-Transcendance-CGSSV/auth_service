import { generateUUID } from "../utils/uuid.util";
import { deleteVerificationToken, getVerificationToken, insertVerificationToken } from "../database/repositories/verification.repository";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { FastifyRequest } from "fastify";
import { activateUser } from "../database/repositories/user.repository";
import { MultipartFile } from "@fastify/multipart";
import fs from "fs";
import { updatePicturePath } from "../database/repositories/pictures.repository";

export async function sendVerificationToken(userId: number): Promise<void> {
    await createVerificationToken(userId);
    //TODO: send email !
}

export async function createVerificationToken(userId: number): Promise<string> {
    let simplyToken: string = userId.toString();
    simplyToken += generateUUID();
    simplyToken += userId.toString();

    const token: string = Buffer.from(simplyToken).toString("base64");

    await insertVerificationToken(userId, token);
    return Promise.resolve(token);
}

export async function activateAccount(req: FastifyRequest): Promise<void> {
    const { token } = req.query as { token: string };
    if (!token) {
        throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Le token est necessaire pour l'activation du compte");
    }

    const result: boolean = await verificationTokenIsValid(token);

    if (result) {
        try {
            await activateUser(Buffer.from(token, "base64").toString("ascii").charAt(0) as unknown as number);
            await deleteVerificationToken(token);
        } catch {
            throw new ApiError(ApiErrorCode.INVALID_TOKEN, "Le token de verification est invalide !");
        }
        return;
    }
    throw new ApiError(ApiErrorCode.INVALID_TOKEN, "Le token de verification est invalide !");
}

async function verificationTokenIsValid(token: string): Promise<boolean> {
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

const acceptedMimeTypes: string[] = ["image/png", "image/jpeg", "image/jpg", "image/gif"];

export async function changeAccountPicture(multipart: MultipartFile | undefined, userId: number): Promise<void> {
    if (!multipart) {
        throw new ApiError(ApiErrorCode.MISSING_REQUIRED_FIELD, "Aucun fichier n'a été envoyé");
    }

    if (!acceptedMimeTypes.includes(multipart.mimetype)) {
        throw new ApiError(ApiErrorCode.INVALID_FILE_TYPE, "Ce format de fichier n'est pas pris en charge pour les photos de profil.");
    }

    let hasGoodExtension: boolean = false;
    for (const accpetedMimeType of acceptedMimeTypes) {
        if (accpetedMimeType.split("/")[1] === multipart.filename.split(".")[1]) {
            hasGoodExtension = true;
            break;
        }
    }

    if (!hasGoodExtension) {
        throw new ApiError(ApiErrorCode.INVALID_FILE_TYPE, "Ce format de fichier n'est pas pris en charge pour les photos de profil.");
    }

    const path: string = "./data/static/profiles_pictures/uploads/" + generateUUID() + "." + multipart.filename.split(".")[1];
    const buffer: Buffer<ArrayBufferLike> = await multipart.toBuffer();

    /*
    TODO: check if the image is really an image
    https://en.wikipedia.org/wiki/List_of_file_signatures 
     */
    fs.writeFileSync(path, buffer);

    await updatePicturePath(userId, path);
}
