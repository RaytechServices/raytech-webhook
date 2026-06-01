import express from "express";
import { sendCallEmail } from "./gmail.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Raytech webhook server is running");
});

app.get("/webhook", (req, res) => {
  res.status(200).send("Webhook endpoint is live. Use POST to send events.");
});

app.post("/webhook", (req, res) => {
  const data = req.body || {};

  const name = data.customer_name || "Not provided";
  const phone = data.phone_number || "Not provided";
  const address = data.address || "Not provided";
  const business = data.business_name || "Not provided";
  const summary = data.call_summary || "No summary provided";

  console.log("Webhook received:", {
    customer_name: name,
    phone_number: phone,
    address,
    business_name: business,
  });

  // Respond immediately so the webhook sender does not timeout
  res.status(200).json({
    status: "received",
  });

  // Send email after responding
  setImmediate(async () => {
    try {
      await sendCallEmail({
        subject: `New Client Lead: ${name} - ${business}`,
        text: `
New Client Inquiry

Name: ${name}
Phone: ${phone}
Address: ${address}
Business: ${business}

Call Summary:
${summary}

Sent by LiveKit Receptionist Agent
        `.trim(),
      });

      console.log(`Lead email sent: ${name}`);
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