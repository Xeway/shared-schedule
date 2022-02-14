require('dotenv').config();
let nodemailer = require('nodemailer');

async function main(firstEmail, secondEmail, action, day, month, year, place, firstPublisher, secondPublisher, isComment, comment) {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp-mail.outlook.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_ADMIN,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: `"${process.env.EMAIL_NAME}" <${process.env.EMAIL_ADMIN}>`, // sender address
        to: `${firstEmail}, ${secondEmail}`, // list of receivers
        subject: `Calendrier : Ta demande pour le ${day}/${month}/${year} a été ${action === "Accepter" ? "acceptée" : (action === "Rejeter" ? "rejetée" : "")}`, // Subject line
        text: `
        Bonjour ${firstPublisher} et ${secondPublisher},
        Votre demande d'inscription pour le ${day}/${month}/${year} au lieu ${place} a été ${action === "Accepter" ? "acceptée" : (action === "Rejeter" ? "rejetée" : "")}.
        ${isComment ? `Commentaire : ${comment}` : ""}

        Cordialement,
        ${process.env.EMAIL_NAME}
        `, // plain text body
        html: `
        <p>Bonjour ${firstPublisher} et ${secondPublisher},</p>
        <p>Votre demande d'inscription pour le <b>${day}/${month}/${year}</b> au lieu <b>${place}</b> a été ${action === "Accepter" ? "<span style='color: green;'>acceptée</span>" : (action === "Rejeter" ? "<span style='color: red;'>rejetée</span>" : "")}.</p>
        ${isComment ? `<p>Commentaire : ${comment}</p>` : ""}
        <br>
        <p>Cordialement,<br>${process.env.EMAIL_NAME}</p>
        `, // html body
    });

    return info;
}

module.exports = { main };