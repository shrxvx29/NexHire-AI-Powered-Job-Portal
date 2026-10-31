
import nodemailer from "nodemailer";
import type { SentMessageInfo } from "nodemailer";

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

if (!emailUser || !emailPassword) {
    throw new Error(
        "EMAIL_USER or EMAIL_PASSWORD is missing in environment variables"
    );
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: emailUser,
        pass: emailPassword,
    },
});

const sendEmail = async ({
    to,
    subject,
    html,
}: SendEmailOptions): Promise<SentMessageInfo> => {
    try {
        const info = await transporter.sendMail({
            from: `"NexHire" <${emailUser}>`,
            to,
            subject,
            html,
        });

        console.log("Email sent successfully:", info.messageId);

        return info;

    } catch (error: unknown) {
        const message =
            error instanceof Error
                ? error.message
                : "Unknown email sending error";

        console.error("Email sending failed:", message);

        throw error;
    }
};

export default sendEmail;
