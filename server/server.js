import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getPhotographerAlertEmail, getClientConfirmationEmail } from './emailTemplates.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// In-memory record store (for local session tracking only)
const bookingRecords = [];

/**
 * Send email via Brevo Transactional Email API
 * https://developers.brevo.com/reference/sendtransacemail
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
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: from.name,
          email: from.email
        },
        to: Array.isArray(to)
          ? to.map(email => ({ email }))
          : [{ email: to }],
        replyTo: replyTo ? { email: replyTo } : undefined,
        subject,
        htmlContent: html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `Brevo API error: ${response.status}`,
        id: null
      };
    }

    return {
      success: true,
      error: null,
      id: data.messageId
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to send email via Brevo',
      id: null
    };
  }
}

/**
 * Parse sender email string into name and email components
 * Accepts formats like "Name <email@example.com>" or just "email@example.com"
 */
function parseSenderEmail(senderString) {
  const match = senderString.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return {
      name: match[1].trim(),
      email: match[2].trim()
    };
  }
  return {
    name: 'Dream Photo\'s & Film\'s',
    email: senderString.trim()
  };
}

/**
 * Health Check
 */
app.get('/api/health', (req, res) => {
  const isEmailConfigured = Boolean(
    process.env.BREVO_API_KEY &&
    process.env.BREVO_API_KEY.trim() !== '' &&
    !process.env.BREVO_API_KEY.includes('your_brevo_api_key')
  );

  res.json({
    status: 'ok',
    service: "Dream Photo's & Film's Booking API (Express Local Dev)",
    timestamp: new Date().toISOString(),
    emailConfigured: isEmailConfigured
  });
});

/**
 * POST /api/book
 * Handles new shoot booking inquiry and dispatches notifications via Brevo
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

    // Basic Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim() === '' || !email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Full Name and Email Address are required.'
      });
    }

    // Generate Unique Booking Reference Code
    const bookingRef = 'UP-' + Math.floor(100000 + Math.random() * 900000);
    const createdAt = new Date().toISOString();

    const bookingData = {
      bookingRef,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone ? String(phone).trim() : '',
      company: company ? String(company).trim() : '',
      service: service ? String(service).trim() : 'General Photography',
      state: state ? String(state).trim() : '',
      district: district ? String(district).trim() : '',
      city: city ? String(city).trim() : '',
      shootDate: shootDate ? String(shootDate).trim() : 'TBD',
      budget: budget ? String(budget).trim() : 'Standard',
      vision: vision ? String(vision).trim() : '',
      createdAt
    };

    // Save record to memory
    bookingRecords.push(bookingData);
    console.log(`\n📸 [NEW BOOKING RECEIVED] Ref: ${bookingRef} | Client: ${bookingData.fullName} (${bookingData.email}) | Service: ${bookingData.service}`);

    // Configuration & Credentials
    const apiKey = (process.env.BREVO_API_KEY || '').trim();
    const isMock = !apiKey || apiKey.includes('your_brevo_api_key');

    const rawPhotogEmail = process.env.PHOTOGRAPHER_EMAIL || 'sutarnitin2525@gmail.com';
    const photographerEmail = rawPhotogEmail.split('#')[0].trim();
    
    const emailFromString = process.env.EMAIL_FROM || "Dream Photo's & Film's <bookings@yourdomain.com>";
    const senderInfo = parseSenderEmail(emailFromString);
    
    const studioName = process.env.STUDIO_NAME || "Dream Photo's & Film's";

    let emailSent = false;
    let photographerEmailSent = false;
    let clientEmailSent = false;
    let emailErrors = [];

    if (isMock) {
      console.log('\n======================================================');
      console.log('📧 [MOCK EMAIL DISPATCH - BREVO_API_KEY not configured in local .env]');
      console.log(`Photographer Alert To: ${photographerEmail} (ReplyTo: ${bookingData.email})`);
      console.log(`Client Confirmation To: ${bookingData.email}`);
      console.log(`Booking Reference:      ${bookingRef}`);
      console.log('======================================================\n');
      emailSent = true;
      photographerEmailSent = true;
      clientEmailSent = true;
    } else {
      // 1. Send Notification Email to Photographer
      try {
        const photographerEmailHtml = getPhotographerAlertEmail(bookingData);
        const photogResult = await sendBrevoEmail({
          from: senderInfo,
          to: photographerEmail,
          replyTo: bookingData.email,
          subject: `New Booking Inquiry [${bookingRef}] — ${bookingData.fullName}`,
          html: photographerEmailHtml
        });

        if (photogResult.success) {
          photographerEmailSent = true;
          console.log(`✅ Photographer alert email dispatched. ID: ${photogResult.id}`);
        } else {
          console.error('❌ Failed to send email to photographer:', photogResult.error);
          emailErrors.push(`Photographer email: ${photogResult.error}`);
        }
      } catch (err) {
        console.error('❌ Failed to send email to photographer:', err.message);
        emailErrors.push(`Photographer email exception: ${err.message}`);
      }

      // 2. Send Confirmation Receipt Email to Client
      try {
        const clientEmailHtml = getClientConfirmationEmail(bookingData);
        const clientResult = await sendBrevoEmail({
          from: senderInfo,
          to: bookingData.email,
          replyTo: undefined,
          subject: `Booking Inquiry Confirmed [${bookingRef}] — ${studioName}`,
          html: clientEmailHtml
        });

        if (clientResult.success) {
          clientEmailSent = true;
          console.log(`✅ Client confirmation email dispatched. ID: ${clientResult.id}`);
        } else {
          console.error('❌ Failed to send confirmation email to client:', clientResult.error);
          emailErrors.push(`Client email: ${clientResult.error}`);
        }
      } catch (err) {
        console.error('❌ Failed to send confirmation email to client:', err.message);
        emailErrors.push(`Client email exception: ${err.message}`);
      }

      emailSent = photographerEmailSent && clientEmailSent;
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
      }
    });

  } catch (error) {
    console.error('🔥 Server Error processing booking:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while processing your booking.'
    });
  }
});

// Start Server (Optional for local development)
app.listen(PORT, () => {
  console.log(`
  🚀 ===================================================
  📸 DREAM PHOTO'S & FILM'S - LOCAL DEV BACKEND
  🌐 Server Running at: http://localhost:${PORT}
  📡 Health Check:      http://localhost:${PORT}/api/health
  📩 Booking Endpoint:  http://localhost:${PORT}/api/book
  ===================================================
  `);
});
