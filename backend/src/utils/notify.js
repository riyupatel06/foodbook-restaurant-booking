import nodemailer from "nodemailer";
import twilio from "twilio";

export function buildBookingNotification({ restaurantName, city, date, time, tableId, total, bookingId }) {
  const subject = `RestorantBooking booking confirmed for ${restaurantName}`;
  const message = [
    `Your booking is confirmed.`,
    `Restaurant: ${restaurantName}`,
    `Location: ${city}`,
    `Table: ${tableId}`,
    `Date: ${date}`,
    `Time: ${time}`,
    total != null ? `Amount paid: ₹${total}` : null,
    bookingId ? `Booking ID: ${bookingId}` : null,
    `Thanks for booking with RestorantBooking.`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, message };
}

export async function sendNotification({ email, phone, subject, message, channels = ["email", "text"] }) {
  const requestedChannels = Array.isArray(channels) && channels.length ? channels : ["email", "text"];
  let emailSent = false;
  let smsSent = false;
  const smtpHost = process.env.SMTP_HOST;

  if (requestedChannels.includes("email") && email && smtpHost && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject,
      text: message,
    });
    emailSent = true;
  }

  if (
    requestedChannels.includes("text") &&
    phone &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  ) {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_FROM_NUMBER,
      to: phone,
      body: message,
    });
    smsSent = true;
  }

  return {
    email,
    phone,
    subject,
    message,
    emailSent,
    smsSent,
    inAppOnly: !emailSent && !smsSent,
    delivered: Number(emailSent) + Number(smsSent),
  };
}
