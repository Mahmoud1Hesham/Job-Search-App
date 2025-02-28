import nodemailer from 'nodemailer';

export const subjectTypes = {
    confirmEmail: "Confirm-Email",
    resetPassword: "Reset-Password",
    acceptApplication: "Accept-Application",
    rejectApplication: "Reject-Application"
}

export const sendEmail = async({
    to = [],
    cc = [],
    bcc = [],
    subject = "",
    text = "",
    html = "",
    attachments = []
} = {}) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });


    const info = await transporter.sendMail({
        from: `"SocialMediaApp 👻" <${process.env.EMAIL}>`, 
        to,
        cc,
        bcc,
        subject,
        text,
        html,
        attachments
    });

    console.log("Message sent: %s", info.messageId);




}