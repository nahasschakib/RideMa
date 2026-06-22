import * as Brevo from "@getbrevo/brevo";

const client = new Brevo.TransactionalEmailsApi();
client.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    const email = new Brevo.SendSmtpEmail();
    email.to = [{ email: to }];
    email.subject = subject;
    email.htmlContent = html;
    email.sender = { name: "MaRide", email: "cnahass@gmail.com" };
    await client.sendTransacEmail(email);
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};