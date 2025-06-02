import * as Brevo from "@getbrevo/brevo";
import { env } from "./environment";
import { getUserByKey } from "../database/repositories/user.repository";

export async function sendEmail(templateId: number, params: object, name: string, email: string, subject: string): Promise<any> {
    const apiInstance = new Brevo.TransactionalEmailsApi();

    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, env.BREVO_API_KEY);
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.to = [
        {
            email: email,
            name: name
        }
    ];
    sendSmtpEmail.params = params;
    sendSmtpEmail.templateId = templateId;
    return apiInstance.sendTransacEmail(sendSmtpEmail);
}

export async function sendEmailFromUser(templateId: number, params: object, userId: number, subject: string): Promise<any> {
    const user = await getUserByKey("id", userId);
    return sendEmail(templateId, params, user.name, user.email, subject);
}
