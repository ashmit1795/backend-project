import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.GOOGLE_APP_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD
    },
});

const sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: process.env.GOOGLE_APP_EMAIL,
        to: to,
        subject: subject,
        html: html,
    };

    try {
        const x = await transporter.sendMail(mailOptions);
        console.log(x);
        console.log("Verification email sent!");
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

export default sendEmail;