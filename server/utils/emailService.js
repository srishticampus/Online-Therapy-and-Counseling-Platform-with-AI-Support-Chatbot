const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS // Use Google App Password
            }
        });

        const mailOptions = {
            from: `"MindHeal Support" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Email Error: ", error);
        return false;
    }
};

module.exports = sendEmail;