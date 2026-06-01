import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({
  version: "v1",
  auth: oauth2Client,
});

function encodeEmail(message) {
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendCallEmail({ subject, text }) {
  const rawMessage = [
    `From: ${process.env.GMAIL_FROM}`,
    `To: ${process.env.NOTIFY_EMAIL}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    text,
  ].join("\n");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodeEmail(rawMessage),
    },
  });
}