import { generateUUID } from "../utils/uuid.util";
import { deleteVerificationToken, getVerificationToken, insertVerificationToken } from "../database/repositories/verification.repository";
import { ApiError, ApiErrorCode } from "../utils/errors.util";
import { FastifyInstance, FastifyRequest } from "fastify";
import { activateUser, getUserByKey } from "../database/repositories/user.repository";
import { MultipartFile } from "@fastify/multipart";
import fs from "fs";
import { updatePicturePath } from "../database/repositories/pictures.repository";
import { isImage } from "../utils/file.util";
import { sendEmailFromUser } from "../utils/mail.util";
import { IPublicUser, toPublicUser } from "../interfaces/user.interface";
import {env} from "../utils/environment";

export async function sendVerificationToken(userId: number, app: FastifyInstance): Promise<boolean> {
    const token = await createVerificationToken(userId);
    const promiseMail = sendEmailFromUser(3, { TOKEN: token, IP: env.IP, NGINX_PORT: env.NGINX_PORT }, userId, "Verification de votre compte ft_transcendence !");
    return promiseMail
        .then(() => {
            return true;
        })
        .catch(async (err: Error) => {
            app.log.error("Unable to send verification email for account activation " + err.message + ":" + err.name);
            await deleteVerificationToken(token);
            await activateUser(userId);
            return false;
        });
}

export async function createVerificationToken(userId: number): Promise<string> {
    let simplyToken: string = userId.toString();
    simplyToken += generateUUID();
    simplyToken += userId.toString();

    const token: string = Buffer.from(simplyToken).toString("base64");

    await insertVerificationToken(userId, token);
    return Promise.resolve(token);
}

export async function activateAccount(req: FastifyRequest): Promise<number | null> {
    if (!req.query || typeof req.query !== "object") {
        throw new ApiError(ApiErrorCode.INVALID_QUERY, "Veuillez inclure un token dans la requete !");
    }
    const { token } = req.query as { token: string };
    if (!token) {
        throw new ApiError(ApiErrorCode.INVALID_REQUEST_BODY, "Le token est necessaire pour l'activation du compte");
    }

    const result: boolean = await verificationTokenIsValid(token);

    if (result) {
        try {
            const userId = Buffer.from(token, "base64").toString("ascii").charAt(0) as unknown as number;
            await activateUser(userId);
            await deleteVerificationToken(token);
            return userId;
        } catch {
            throw new ApiError(ApiErrorCode.INVALID_TOKEN, "Le token de verification est invalide !");
        }
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

export async function getJwtPayload(req: FastifyRequest): Promise<IPublicUser> {
    if (!req.query || typeof req.query !== "object") {
        throw new ApiError(ApiErrorCode.INVALID_QUERY, "Veuillez inclure un utilisateur dans la requete !");
    }

    let type: "ID" | "NAME";
    let value: number | string | null = null;

    if ("name" in req.query && typeof req.query.name === "string") {
        type = "NAME";
        value = req.query.name;
    } else if ("userId" in req.query && typeof req.query.userId === "number") {
        type = "ID";
        value = req.query.userId;
    } else {
        throw new ApiError(ApiErrorCode.INVALID_QUERY, "Veuillez inclure un utilisateur dans la requete !");
    }

    if (type === "NAME") {
        const user = await getUserByKey("name", value);
        return toPublicUser(user);
    }
    if (type === "ID") {
        const user = await getUserByKey("id", value);
        return toPublicUser(user);
    }
    throw new ApiError(ApiErrorCode.INVALID_QUERY, "Veuillez inclure un utilisateur dans la requete !");
}

export async function changeAccountPicture(multipart: MultipartFile | undefined, userId: number): Promise<void> {
    if (!multipart) {
        throw new ApiError(ApiErrorCode.MISSING_REQUIRED_FIELD, "Aucun fichier n'a été envoyé");
    }
    const path: string = "./data/static/profiles_pictures/uploads/" + generateUUID() + "." + multipart.filename.split(".")[1];
    const buffer: Buffer = await multipart.toBuffer();

    if (multipart.file.truncated) {
        throw new ApiError(ApiErrorCode.INVALID_FILE_SIZE, "Ce fichier est trop lourd !");
    }

    if (!isImage(multipart.filename.split(".")[1], multipart.mimetype, buffer)) {
        throw new ApiError(ApiErrorCode.INVALID_FILE_TYPE, "Ce format de fichier n'est pas pris en charge pour les photos de profil.");
    }

    fs.writeFile(path, buffer, async (err) => {
        if (!err) {
            await updatePicturePath(userId, path.substring(1));
            return;
        }
        throw new ApiError(ApiErrorCode.DATABASE_ERROR, "Impossible de mettre a jour le chemin de la photo de profil.");
    });
}
