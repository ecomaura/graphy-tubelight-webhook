module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'Webhook is live!' });
  }

  try {
    const body = req.body;

    // ═══════════════════════════════════════════
    // ✏️ YOUR 4 SETTINGS — ONLY EDIT THESE
    // ═══════════════════════════════════════════

    const IS_TEST_MODE = false; // 🔁 change to false when going live
    const TEST_PHONE = '919930XXXXXX'; // ✏️ your WhatsApp number (91 + 10 digits, no + or spaces)
    const LOGIN_LINK = 'https://YOUR-SITE.graphy.com/login'; // ✏️ your Graphy login URL
    const TEMPLATE_NAME = 'payment_success'; // ✏️ your approved Tubelight template name

    // ═══════════════════════════════════════════
    // DO NOT EDIT ANYTHING BELOW THIS LINE
    // ═══════════════════════════════════════════

    // Extract student details from Graphy payload
    const name = body?.Name || body?.data?.Name || 'Student';
    const phone = body?.Mobile || body?.data?.Mobile || '';

    if (!phone && !IS_TEST_MODE) {
      return res.status(400).json({ error: 'No phone number found' });
    }

    // Format phone: remove +, spaces, ensure 91 prefix
    const cleanPhone = phone.replace(/\D/g, '');
    const realPhone = cleanPhone.startsWith('91')
      ? cleanPhone
      : '91' + cleanPhone;

    // Use test number or real student number
    const formattedPhone = IS_TEST_MODE ? TEST_PHONE : realPhone;

    // Step 1: Login to Tubelight to get token
    const loginRes = await fetch(
      'https://portal.tubelightcommunications.com/api/authentication/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: process.env.TUBELIGHT_USERNAME,
          password: process.env.TUBELIGHT_PASSWORD,
        }),
      }
    );

    const loginData = await loginRes.json();
    const token = loginData?.token || loginData?.data?.token;

    if (!token) {
      return res.status(500).json({ error: 'Tubelight login failed' });
    }

    // Step 2: Send WhatsApp message
    const msgRes = await fetch(
      'https://portal.tubelightcommunications.com/whatsapp/api/v1/send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: [formattedPhone],
          message: {
            template_name: TEMPLATE_NAME,
            language: 'en',
            type: 'template',
            body_params: [name, LOGIN_LINK],
          },
        }),
      }
    );

    const msgData = await msgRes.json();
    return res.status(200).json({ success: true, response: msgData });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
