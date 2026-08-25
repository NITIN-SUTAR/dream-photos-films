/**
 * Email Templates for Photographer Alert & Client Confirmation
 * Luxury Photography & Cinema Studio Aesthetic
 * Designed for Gmail, Outlook, Apple Mail, and Mobile Clients
 */

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeText(value, fallback = 'Not provided') {
  if (value === null || value === undefined || String(value).trim() === '') {
    return fallback;
  }
  return escapeHtml(String(value).trim());
}

function sanitizePhoneForWhatsApp(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits;
}

function formatBookingDate(createdAt) {
  try {
    const d = createdAt ? new Date(createdAt) : new Date();
    if (isNaN(d.getTime())) {
      return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    }
    return (
      d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' (IST)'
    );
  } catch {
    return 'Recent Submission';
  }
}

/**
 * EMAIL 1: Photographer Booking Alert
 */
export function getPhotographerAlertEmail(data = {}) {
  const {
    bookingRef = 'UP-000000',
    fullName = '',
    email = '',
    phone = '',
    company = '',
    service = 'Photography Production',
    state = '',
    district = '',
    city = '',
    shootDate = 'TBD',
    budget = 'Standard',
    vision = '',
    createdAt = new Date().toISOString()
  } = data;

  const studioName = escapeHtml(process.env.STUDIO_NAME || "Dream Photo's & Film's");
  const photographerName = escapeHtml(process.env.PHOTOGRAPHER_NAME || 'Utkarsh Patel');
  const safeRef = escapeHtml(bookingRef);
  const safeFullName = safeText(fullName);
  const safeEmail = safeText(email);
  const safePhone = safeText(phone);
  const safeCompany = safeText(company, '');
  const safeService = safeText(service);
  const safeShootDate = safeText(shootDate);
  const safeBudget = safeText(budget);

  // Build full location string
  const locParts = [city, district, state].filter((p) => p && String(p).trim() !== '');
  const safeLocation = locParts.length > 0 ? escapeHtml(locParts.join(', ')) : 'India';

  // Format creative vision with preserved linebreaks
  const rawVision = vision && String(vision).trim() !== '' ? String(vision).trim() : 'No specific vision details provided.';
  const safeVision = escapeHtml(rawVision).replace(/\r?\n/g, '<br/>');

  const formattedTime = formatBookingDate(createdAt);

  // WhatsApp Link setup
  const cleanPhone = sanitizePhoneForWhatsApp(phone);
  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hi ${fullName || 'Client'}, thank you for your booking inquiry with ${process.env.STUDIO_NAME || "Dream Photo's & Film's"} (Ref: ${bookingRef}). Let's discuss your shoot requirements!`
      )}`
    : null;

  const replyMailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
    `Regarding Your Booking Inquiry [${bookingRef}] — ${process.env.STUDIO_NAME || "Dream Photo's & Film's"}`
  )}`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Booking Inquiry [${safeRef}]</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #09090b; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; width: 100%; background-color: #121216; border-radius: 12px; border: 1px solid #23232c; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          
          <!-- Top Accent Gold Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #997b2f, #d4af37, #f5e096, #d4af37, #997b2f);"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding: 32px 28px 24px 28px; background-color: #15161d; border-bottom: 1px solid #23232c; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #d4af37; text-transform: uppercase; margin-bottom: 8px;">
                ${studioName}
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3;">
                New Booking Inquiry
              </h1>
              <div style="margin-top: 12px;">
                <span style="display: inline-block; background-color: #1f1b13; border: 1px solid #54441e; color: #e5be58; font-family: 'SFMono-Regular', Consolas, Menlo, monospace; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 4px;">
                  REF: ${safeRef}
                </span>
              </div>
              <div style="margin-top: 8px; font-size: 12px; color: #a1a1aa;">
                Received: ${formattedTime}
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px;">
              
              <!-- Client Information Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #181820; border: 1px solid #282834; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #282834;">
                    <span style="font-size: 11px; font-weight: 700; color: #d4af37; text-transform: uppercase; letter-spacing: 1.5px;">
                      Client Information
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6" border="0" style="font-size: 13px;">
                      <tr>
                        <td width="35%" style="color: #71717a; vertical-align: top;">Full Name:</td>
                        <td style="color: #ffffff; font-weight: 600;">${safeFullName}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; vertical-align: top;">Email Address:</td>
                        <td>
                          <a href="mailto:${safeEmail}" style="color: #d4af37; text-decoration: none; font-weight: 500;">${safeEmail}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; vertical-align: top;">Phone Number:</td>
                        <td style="color: #f4f4f5; font-family: 'SFMono-Regular', Consolas, Menlo, monospace;">${safePhone}</td>
                      </tr>
                      ${
                        safeCompany
                          ? `<tr>
                        <td style="color: #71717a; vertical-align: top;">Organization / Area:</td>
                        <td style="color: #d4d4d8;">${safeCompany}</td>
                      </tr>`
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Shoot Specifications Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #181820; border: 1px solid #282834; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #282834;">
                    <span style="font-size: 11px; font-weight: 700; color: #d4af37; text-transform: uppercase; letter-spacing: 1.5px;">
                      Shoot Specifications
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6" border="0" style="font-size: 13px;">
                      <tr>
                        <td width="35%" style="color: #71717a; vertical-align: top;">Service:</td>
                        <td style="color: #ffffff; font-weight: 600;">${safeService}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; vertical-align: top;">Target Date:</td>
                        <td style="color: #f4f4f5; font-weight: 600; font-family: 'SFMono-Regular', Consolas, Menlo, monospace;">${safeShootDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; vertical-align: top;">Budget Estimate:</td>
                        <td style="color: #e5be58; font-weight: 700; font-family: 'SFMono-Regular', Consolas, Menlo, monospace;">${safeBudget}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; vertical-align: top;">Location:</td>
                        <td style="color: #d4d4d8;">${safeLocation}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Creative Vision Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #181820; border: 1px solid #282834; border-radius: 8px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #282834;">
                    <span style="font-size: 11px; font-weight: 700; color: #d4af37; text-transform: uppercase; letter-spacing: 1.5px;">
                      Creative Vision & Mood Brief
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="background-color: #121217; border-left: 3px solid #d4af37; border-radius: 4px; padding: 14px 16px; font-size: 13px; line-height: 1.6; color: #d4d4d8; font-style: italic;">
                      ${safeVision}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <!-- Reply Button -->
                    <a href="${replyMailto}" style="display: inline-block; background-color: #d4af37; color: #0a0a0c; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 22px; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase; margin: 4px;">
                      ✉ Reply to Client
                    </a>
                    ${
                      waLink
                        ? `<!-- WhatsApp Button -->
                    <a href="${waLink}" target="_blank" style="display: inline-block; background-color: #15803d; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 22px; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase; margin: 4px;">
                      💬 WhatsApp Client
                    </a>`
                        : ''
                    }
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; background-color: #0d0d11; border-top: 1px solid #23232c; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #71717a; line-height: 1.5;">
                Automated booking alert for <strong>${photographerName}</strong> &bull; ${studioName}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * EMAIL 2: Client Booking Confirmation
 */
export function getClientConfirmationEmail(data = {}) {
  const {
    bookingRef = 'UP-000000',
    fullName = 'Valued Client',
    service = 'Photography Production',
    state = '',
    district = '',
    city = '',
    shootDate = 'TBD',
    budget = 'Standard'
  } = data;

  const studioName = escapeHtml(process.env.STUDIO_NAME || "Dream Photo's & Film's");
  const photographerName = escapeHtml(process.env.PHOTOGRAPHER_NAME || 'Utkarsh Patel');
  const businessLocation = escapeHtml(process.env.BUSINESS_LOCATION || 'Shahada, Maharashtra, India');
  const photographerEmail = escapeHtml(process.env.PHOTOGRAPHER_EMAIL || 'sutarnitin2525@gmail.com');
  const websiteUrl = process.env.WEBSITE_URL ? escapeHtml(process.env.WEBSITE_URL) : '';
  const instagramUrl = process.env.INSTAGRAM_URL ? escapeHtml(process.env.INSTAGRAM_URL) : '';
  const whatsappNumber = process.env.WHATSAPP_NUMBER ? escapeHtml(process.env.WHATSAPP_NUMBER) : '';

  const safeRef = escapeHtml(bookingRef);
  const safeFullName = safeText(fullName, 'Valued Client');
  const safeService = safeText(service);
  const safeShootDate = safeText(shootDate);
  const safeBudget = safeText(budget);

  const locParts = [city, district, state].filter((p) => p && String(p).trim() !== '');
  const safeLocation = locParts.length > 0 ? escapeHtml(locParts.join(', ')) : 'India';

  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Booking Inquiry Confirmed [${safeRef}]</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #09090b; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #121216; border-radius: 12px; border: 1px solid #23232c; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          
          <!-- Top Accent Gold Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #997b2f, #d4af37, #f5e096, #d4af37, #997b2f);"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding: 36px 28px 24px 28px; background-color: #15161d; border-bottom: 1px solid #23232c; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #d4af37; text-transform: uppercase; margin-bottom: 8px;">
                ${studioName}
              </div>
              <h1 style="margin: 0; font-size: 23px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3;">
                Booking Inquiry Confirmed
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #a1a1aa;">
                We have received your creative production request.
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 28px;">
              
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #f4f4f5; line-height: 1.6;">
                Dear <strong>${safeFullName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 13px; color: #a1a1aa; line-height: 1.6;">
                Thank you for your interest in collaborating with <strong>${studioName}</strong>. We have successfully logged your inquiry and look forward to bringing your vision to life.
              </p>

              <!-- Reference Badge -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #181610; border: 1px solid #4a3b1a; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px; text-align: center;">
                    <div style="font-size: 11px; color: #d4af37; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 4px;">
                      Your Booking Reference
                    </div>
                    <div style="font-size: 22px; font-weight: 800; color: #ffffff; font-family: 'SFMono-Regular', Consolas, Menlo, monospace; letter-spacing: 2px;">
                      ${safeRef}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Booking Summary Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #181820; border: 1px solid #282834; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #282834;">
                    <span style="font-size: 11px; font-weight: 700; color: #d4af37; text-transform: uppercase; letter-spacing: 1.5px;">
                      Inquiry Summary
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6" border="0" style="font-size: 13px;">
                      <tr>
                        <td width="38%" style="color: #71717a; vertical-align: top;">Service Package:</td>
                        <td style="color: #ffffff; font-weight: 600;">${safeService}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; vertical-align: top;">Target Date:</td>
                        <td style="color: #f4f4f5; font-weight: 600; font-family: 'SFMono-Regular', Consolas, Menlo, monospace;">${safeShootDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; vertical-align: top;">Location:</td>
                        <td style="color: #d4d4d8;">${safeLocation}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; vertical-align: top;">Budget Scope:</td>
                        <td style="color: #e5be58; font-weight: 700; font-family: 'SFMono-Regular', Consolas, Menlo, monospace;">${safeBudget}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- What Happens Next Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #181820; border-left: 3px solid #d4af37; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 12px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                      What Happens Next
                    </div>
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #a1a1aa; line-height: 1.6;">
                      We've received your inquiry and will review your creative requirements and availability. We'll get back to you as soon as possible.
                    </p>
                    <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #71717a; line-height: 1.6;">
                      <li>Photographer <strong>${photographerName}</strong> will review your mood board and vision.</li>
                      <li>We will reach out to discuss shoot coordination, equipment packages, and timeline.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Studio Contacts -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top: 1px solid #23232c; padding-top: 18px;">
                <tr>
                  <td style="font-size: 12px; color: #a1a1aa; line-height: 1.6; text-align: center;">
                    <p style="margin: 0 0 6px 0;">Have immediate questions or need to update your details?</p>
                    <p style="margin: 0; color: #71717a;">
                      ✉ <a href="mailto:${photographerEmail}" style="color: #d4af37; text-decoration: none;">${photographerEmail}</a>
                      &bull; 📍 ${businessLocation}
                      ${whatsappNumber ? ` &bull; 💬 +${whatsappNumber}` : ''}
                    </p>
                    ${
                      websiteUrl || instagramUrl
                        ? `<p style="margin: 8px 0 0 0; font-size: 11px;">
                      ${websiteUrl ? `<a href="${websiteUrl}" style="color: #a1a1aa; text-decoration: underline; margin: 0 6px;">Website</a>` : ''}
                      ${instagramUrl ? `<a href="${instagramUrl}" style="color: #a1a1aa; text-decoration: underline; margin: 0 6px;">Instagram</a>` : ''}
                    </p>`
                        : ''
                    }
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 28px; background-color: #0d0d11; border-top: 1px solid #23232c; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #52525b;">
                &copy; ${currentYear} ${photographerName} &bull; ${studioName}. All Rights Reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
