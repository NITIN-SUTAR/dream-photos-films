import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  getPhotographerAlertEmail,
  getClientConfirmationEmail
} from './emailTemplates.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const bookingRecords = [];

/**
 * Send email using Brevo Transactional Email API
 */
async function sendBrevoEmail({
  from,
  to,
  replyTo,
  subject,
  html
}) {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();

  if (!apiKey || apiKey.includes('your_brevo_api_key')) {
    return {
      success: false,
      error: 'Brevo API key not configured',
      id: null
    };
  }

  try {
    const response = await fetch(
      'https://api.brevo.com/v3/smtp/email',
      {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: from.name,
            email: from.email
          },

          to: Array.isArray(to)
            ? to.map(email => ({ email }))
            : [{ email: to }],

          ...(replyTo
            ? {
              replyTo: {
                email: replyTo
              }
            }
            : {}),

          subject,
          htmlContent: html
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          data.message ||
          `Brevo API error: ${response.status}`,
        id: null
      };
    }

    return {
      success: true,
      error: null,
      id: data.messageId || null
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.message ||
        'Failed to send email via Brevo',
      id: null
    };
  }
}

/**
 * Parse:
 * Name <email@example.com>
 */
function parseSenderEmail(senderString) {
  const match = senderString.match(
    /^(.+?)\s*<(.+?)>$/
  );

  if (match) {
    return {
      name: match[1].trim(),
      email: match[2].trim()
    };
  }

  return {
    name: "Dream Photo's & Film's",
    email: senderString.trim()
  };
}

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  const apiKey = (
    process.env.BREVO_API_KEY || ''
  ).trim();

  const emailConfigured = Boolean(
    apiKey &&
    !apiKey.includes('your_brevo_api_key')
  );

  res.json({
    status: 'ok',
    service: "Dream Photo's & Film's Booking API",
    timestamp: new Date().toISOString(),
    emailConfigured
  });
});

/**
 * POST /api/book
 */
app.post('/api/book', async (req, res) => {
  try {
    const {
      service,
      state,
      district,
      city,
      shootDate,
      budget,
      vision,
      fullName,
      email,
      company,
      phone
    } = req.body;

    // Validation
    if (
      !fullName ||
      typeof fullName !== 'string' ||
      fullName.trim() === '' ||
      !email ||
      typeof email !== 'string' ||
      email.trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Full Name and Email Address are required.'
      });
    }

    // Booking reference
    const bookingRef =
      'UP-' +
      Math.floor(
        100000 + Math.random() * 900000
      );

    const createdAt =
      new Date().toISOString();

    const bookingData = {
      bookingRef,

      fullName: fullName.trim(),

      email: email.trim(),

      phone: phone
        ? String(phone).trim()
        : '',

      company: company
        ? String(company).trim()
        : '',

      service: service
        ? String(service).trim()
        : 'General Photography',

      state: state
        ? String(state).trim()
        : '',

      district: district
        ? String(district).trim()
        : '',

      city: city
        ? String(city).trim()
        : '',

      shootDate: shootDate
        ? String(shootDate).trim()
        : 'TBD',

      budget: budget
        ? String(budget).trim()
        : 'Standard',

      vision: vision
        ? String(vision).trim()
        : '',

      createdAt
    };

    bookingRecords.push(bookingData);

    console.log(
      `\n📸 NEW BOOKING`
    );

    console.log(
      `Reference: ${bookingRef}`
    );

    console.log(
      `Client: ${bookingData.fullName}`
    );

    console.log(
      `Email: ${bookingData.email}`
    );

    console.log(
      `Service: ${bookingData.service}\n`
    );

    // Environment configuration
    const apiKey = (
      process.env.BREVO_API_KEY || ''
    ).trim();

    const isMock =
      !apiKey ||
      apiKey.includes('your_brevo_api_key');

    const rawPhotographerEmail =
      process.env.PHOTOGRAPHER_EMAIL ||
      'sutarnitin2525@gmail.com';

    const photographerEmail =
      rawPhotographerEmail
        .split('#')[0]
        .trim();

    const emailFromString =
      process.env.EMAIL_FROM ||
      "Dream Photo's & Film's <bookings@yourdomain.com>";

    const senderInfo =
      parseSenderEmail(emailFromString);

    const studioName =
      process.env.STUDIO_NAME ||
      "Dream Photo's & Film's";

    let emailSent = false;

    let photographerEmailSent = false;

    let clientEmailSent = false;

    const emailErrors = [];

    // Mock mode
    if (isMock) {
      console.log(
        '======================================'
      );

      console.log(
        '📧 MOCK EMAIL MODE'
      );

      console.log(
        `Photographer: ${photographerEmail}`
      );

      console.log(
        `Client: ${bookingData.email}`
      );

      console.log(
        `Booking Ref: ${bookingRef}`
      );

      console.log(
        '======================================'
      );

      emailSent = true;
      photographerEmailSent = true;
      clientEmailSent = true;
    } else {
      // Photographer email
      try {
        const html =
          getPhotographerAlertEmail(
            bookingData
          );

        const result =
          await sendBrevoEmail({
            from: senderInfo,
            to: photographerEmail,
            replyTo: bookingData.email,
            subject:
              `New Booking Inquiry [${bookingRef}] — ${bookingData.fullName}`,
            html
          });

        if (result.success) {
          photographerEmailSent = true;

          console.log(
            `✅ Photographer email sent: ${result.id}`
          );
        } else {
          emailErrors.push(
            `Photographer email: ${result.error}`
          );
        }
      } catch (error) {
        emailErrors.push(
          `Photographer email: ${error.message}`
        );
      }

      // Client confirmation
      try {
        const html =
          getClientConfirmationEmail(
            bookingData
          );

        const result =
          await sendBrevoEmail({
            from: senderInfo,
            to: bookingData.email,
            subject:
              `Booking Inquiry Confirmed [${bookingRef}] — ${studioName}`,
            html
          });

        if (result.success) {
          clientEmailSent = true;

          console.log(
            `✅ Client email sent: ${result.id}`
          );
        } else {
          emailErrors.push(
            `Client email: ${result.error}`
          );
        }
      } catch (error) {
        emailErrors.push(
          `Client email: ${error.message}`
        );
      }

      emailSent =
        photographerEmailSent &&
        clientEmailSent;
    }

    return res.status(200).json({
      success: true,
      bookingRef,

      message: emailSent
        ? 'Booking inquiry received and email notifications dispatched successfully!'
        : 'Booking inquiry received. Some notifications may be pending dispatch.',

      timestamp: createdAt,

      emailSent,

      details: {
        clientName: bookingData.fullName,
        service: bookingData.service,
        shootDate: bookingData.shootDate,
        budget: bookingData.budget
      },

      ...(emailErrors.length > 0
        ? { emailErrors }
        : {})
    });
  } catch (error) {
    console.error(
      '🔥 Server Error:',
      error
    );

    return res.status(500).json({
      success: false,
      error:
        'An internal server error occurred while processing your booking.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`
🚀 =========================================
📸 DREAM PHOTO'S & FILM'S
🚀 Backend Server Started

🌐 http://localhost:${PORT}

❤️ Health:
http://localhost:${PORT}/api/health

📩 Booking:
http://localhost:${PORT}/api/book
=========================================
`);
});
