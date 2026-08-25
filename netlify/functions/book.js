/**
 * Netlify Serverless Function: Book Shoot Inquiry Handler
 * Endpoint: POST /.netlify/functions/book (or POST /api/book via Netlify redirect)
 * Dispatches notifications using Brevo Transactional Email API
 */

import { getPhotographerAlertEmail, getClientConfirmationEmail } from './emailTemplates.js';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

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

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
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

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS
    };
  }

  // Only POST method is supported
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed. Please use POST.'
      })
    };
  }

  try {
    // Parse request body
    let body = {};
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : event.body || {};
    } catch {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: 'Invalid JSON payload received.'
        })
      };
    }

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
    } = body;

    // Validation: fullName and email are required
    if (!fullName || typeof fullName !== 'string' || fullName.trim() === '' || !email || typeof email !== 'string' || email.trim() === '') {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: 'Full Name and Email Address are required.'
        })
      };
    }

    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: 'Please provide a valid email address.'
        })
      };
    }

    // Generate unique recognizable booking reference
    const bookingRef = 'UP-' + Math.floor(100000 + Math.random() * 900000);
    const createdAt = new Date().toISOString();

    const bookingData = {
      bookingRef,
      fullName: fullName.trim(),
      email: cleanEmail,
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

    console.log(`[BOOKING RECEIVED] Ref: ${bookingRef} | Client: ${bookingData.fullName} (${bookingData.email}) | Service: ${bookingData.service}`);

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
      // Mock mode: simulate successful email dispatch
      console.log('\n======================================================');
      console.log('📧 [MOCK EMAIL DISPATCH - BREVO_API_KEY not configured]');
      console.log(`Photographer Alert To: ${photographerEmail} (ReplyTo: ${bookingData.email})`);
      console.log(`Client Confirmation To: ${bookingData.email}`);
      console.log(`Booking Reference:      ${bookingRef}`);
      console.log('======================================================\n');
      emailSent = true;
      photographerEmailSent = true;
      clientEmailSent = true;
    } else {
      // 1. Dispatch alert email to photographer
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
          console.log(`✅ Photographer alert dispatched. ID: ${photogResult.id}`);
        } else {
          console.error('❌ Failed to dispatch photographer alert:', photogResult.error);
          emailErrors.push(`Photographer alert: ${photogResult.error}`);
        }
      } catch (err) {
        console.error('❌ Exception during photographer email dispatch:', err.message);
        emailErrors.push(`Photographer alert exception: ${err.message}`);
      }

      // 2. Dispatch confirmation email to client
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
          console.log(`✅ Client confirmation dispatched. ID: ${clientResult.id}`);
        } else {
          console.error('❌ Failed to dispatch client confirmation:', clientResult.error);
          emailErrors.push(`Client confirmation: ${clientResult.error}`);
        }
      } catch (err) {
        console.error('❌ Exception during client confirmation email dispatch:', err.message);
        emailErrors.push(`Client confirmation exception: ${err.message}`);
      }

      // Both emails must succeed for emailSent to be true
      emailSent = photographerEmailSent && clientEmailSent;
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
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
      })
    };
  } catch (error) {
    console.error('🔥 Serverless Function Error:', error.message || error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: 'An internal server error occurred while processing your booking inquiry.'
      })
    };
  }
}
