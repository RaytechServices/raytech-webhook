const express = require('express');
const nodemailer = require('nodemailer');
const app = express();

app.use(express.json());

app.post('/webhook', async (req, res) => {
  try {
    const data = req.body;

    const name = data.customer_name || 'Not provided';
    const phone = data.phone_number || 'Not provided';
    const address = data.address || 'Not provided';
    const business = data.business_name || 'Not provided';
    const summary = data.call_summary || 'No summary provided';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Raytech Agent" <${process.env.EMAIL_USER}>`,
      to: "services@raytech.co",
      subject: `New Client Lead: ${name} - ${business}`,
      html: `
        <h2>New Client Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Business:</strong> ${business}</p>
        <hr>
        <p><strong>Call Summary:</strong> ${summary}</p>
        <br>
        <small>Sent by LiveKit Receptionist Agent</small>
      `,
    });

    console.log(`✅ Lead received: ${name}`);
    res.json({ status: "success" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error" });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Webhook running on port ${port}`);
});