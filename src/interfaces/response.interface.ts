interface IBasicResponse {
    success: boolean;
    message: string;
}

export interface ISuccessResponse extends IBasicResponse {
    data: any;
}

export interface IErrorResponse extends IBasicResponse {
    errorCode: string;
}
