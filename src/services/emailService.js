const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

async function sendPasswordResetEmail(userEmail, token) {
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`; // Em produção, será o link do seu app

    const message = {
        from: '"Plataforma JOBAH" <no-reply@jobah.com>',
        to: userEmail,
        subject: 'Redefinição de Senha',
        html: `
            <p>Você solicitou uma redefinição de senha para sua conta na JOBAH.</p>
            <p>Clique neste link para redefinir sua senha: <a href="${resetUrl}">${resetUrl}</a></p>
            <p>Este link irá expirar em 10 minutos.</p>
            <p>Se você não solicitou isso, por favor, ignore este e-mail.</p>
        `,
    };

    try {
        await transporter.sendMail(message);
        console.log(`E-mail de redefinição enviado para ${userEmail}. Verifique sua caixa do Mailtrap.`);
    } catch (error) {
        console.error("Erro ao enviar e-mail de redefinição:", error);
        throw new Error("Não foi possível enviar o e-mail de redefinição.");
    }
}

module.exports = { sendPasswordResetEmail };