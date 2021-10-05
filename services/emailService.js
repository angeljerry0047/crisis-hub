const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.sendinblue.com',
    // service: 'smtp-relay.sendinblue.com',
    // secure: true,
    port: 587,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    },


    // apiKey: process.env.SENDGRID_API_KEY,

    tls: {
        rejectUnauthorized: false,
        secureProtocol: "TLSv1_method",
    }
})

module.exports = transporter;