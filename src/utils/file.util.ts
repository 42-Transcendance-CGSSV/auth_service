import IFile from "../interfaces/file.interface";

const acceptedFile: IFile[] = [
    {
        fileExtension: ["png"],
        fileMimeType: "image/png",
        signatureOffset: 0,
        signatureChecker: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]]
    },
    {
        fileExtension: ["jpeg", "jpg"],
        fileMimeType: "image/jpeg",
        signatureOffset: 0,
        signatureChecker: [[0xff, 0xd8, 0xff]]
    },
    {
        fileExtension: ["gif"],
        fileMimeType: "image/gif",
        signatureOffset: 0,
        signatureChecker: [[0x47, 0x49, 0x46, 0x38]]
    }
];

export function isImage(extension: string, mimeType: string, buffer: Buffer): boolean {
    if (!acceptedFile || acceptedFile.length === 0) return false;
    if (!extension || !buffer) return false;
    const findedFile = acceptedFile.find(
        (value) => value.fileExtension.includes(extension.toLowerCase()) && value.fileMimeType === mimeType
    );
    if (!findedFile) return false;
    const maxLength: number = Math.max(...findedFile.signatureChecker.map((value) => value.length));
    const signatureBuffer: Buffer<ArrayBuffer> = Buffer.copyBytesFrom(buffer, findedFile.signatureOffset, maxLength);
    if (!signatureBuffer) return false;
    for (const signatureCheckerElement of findedFile.signatureChecker) {
        if (Buffer.compare(Buffer.from(signatureCheckerElement), signatureBuffer) === 0) {
            return true;
        }
    }
    return false;
}
