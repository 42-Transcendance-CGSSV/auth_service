interface IFile {
    fileExtension: string[];
    fileMimeType: string;
    signatureOffset: number;
    signatureChecker: number[][];
}

export default IFile;
