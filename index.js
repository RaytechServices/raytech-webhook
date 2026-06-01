const express = require("express");
const { google } = require("googleapis");

google.options({
  timeout: 8000,
});

const app = express();
app.use(express.json());

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function encodeMessage(message) {
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendLeadEmail(data) {
  const name = data.customer_name || "Not provided";
  const phone = data.phone_number || "Not provided";
  const address = data.address || "Not provided";
  const business = data.business_name || "Not provided";
  const summary = data.call_summary || "No summary provided";

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "http://localhost"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  const from = process.env.GMAIL_FROM;
  const to = process.env.NOTIFY_EMAIL;
  const subject = `New Client Lead: ${name} - ${business}`;

  const html = `
    <h2>New Client Inquiry</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Address:</strong> ${escapeHtml(address)}</p>
    <p><strong>Business:</strong> ${escapeHtml(business)}</p>
    <hr>
    <p><strong>Call Summary:</strong></p>
    <p>${escapeHtml(summary)}</p>
    <br>
    <small>Sent by LiveKit Receptionist Agent</small>
  `;

  const email = [
    `From: "Raytech Agent" <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html,
  ].join("\r\n");

  const raw = encodeMessage(email);

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
    },
  });
}

app.get("/", (req, res) => {
  res.send("Raytech webhook server is running");
});

app.get("/webhook", (req, res) => {
  res.send("Webhook endpoint is live. Use POST to send events.");
});

app.post("/webhook", (req, res) => {
  const data = req.body;

  console.log("Webhook received:", data);

  res.status(200).json({
    status: "received",
  });

  setImmediate(async () => {
    try {
      await sendLeadEmail(data);
      console.log(`Lead email sent: ${data.customer_name || "Unknown"}`);
    } catch (error) {
      console.error("Email Error:", {
        message: error.message,
        code: error.code,
        status: error.status,
        responseData: error.response?.data,
        configUrl: error.config?.url,
      });
    }
  });
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Webhook running on port ${port}`);
});