import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendMail = async (
  to: string,
  subject: string,
  html: string
) => {
  try {
    const data = await transporter.sendMail({
      from: `MaRide <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return data;
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};
