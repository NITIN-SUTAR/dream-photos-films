/**
 * Netlify Serverless Function: Health Check
 * GET /.netlify/functions/health (or /api/health via Netlify redirect)
 */

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  const isEmailConfigured = Boolean(
    process.env.BREVO_API_KEY &&
    process.env.BREVO_API_KEY.trim() !== '' &&
    !process.env.BREVO_API_KEY.includes('your_brevo_api_key')
  );

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      status: 'ok',
      service: "Dream Photo's & Film's Booking API",
      emailConfigured: isEmailConfigured,
      timestamp: new Date().toISOString()
    })
  };
}
