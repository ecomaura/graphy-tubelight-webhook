module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'Webhook is live!' });
  }

  try {
    const body = req.body;

    // ═══════════════════════════════════════════
    // ✏️ YOUR 4 SETTINGS — ONLY EDIT THESE
    // ═══════════════════════════════════════════

    const IS_TEST_MODE = false;
    const TEST_PHONE = '919930XXXXXX';
    const LOGIN_LINK = 'https://YOUR-SITE.graphy.com/login'; // ✏️
    const TEMPLATE_NAME = 'payment_success'; // ✏️

    // ═══════════════════════════════════════════
    // DO NOT EDIT ANYTHING BELOW THIS LINE
    // ═══════════════════════════════════════════

    // Log incoming payload
    console.log('📩 Graphy Payload:', JSON.stringify(body));

    // Extract student details
    const name = body?.Name || body?.data?.Name || 'Student';
    const phone = body?.Mobile || body?.data?.Mobile || '';

    console.log('👤 Name:', name);
    console.log('📱 Phone:', phone);

    if (!phone && !IS_TEST_MODE) {
      return res.status(400).json({ error: 'No phone number found' });
    }

    // Format phone
    const cleanPhone = phone.replace(/\D/g, '');
    const realPhone = cleanPhone.startsWith('91')
      ? cleanPhone
      : '91' + cleanPhone;

    const formattedPhone = IS_TEST_MODE ? TEST_PHONE : realPhone;
    console.log('📞 Formatted Phone:', formattedPhone);

    // Step 1: Login to Tubelight
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
    console.log('🔐 Tubelight Login Response:', JSON.stringify(loginData));

    const token = loginData?.accessToken || loginData?.token || loginData?.data?.token;
    console.log('🎟️ Token:', token ? 'FOUND ✅' : 'NOT FOUND ❌');

    if (!token) {
      return res.status(500).json({ 
        error: 'Tubelight login failed',
        loginResponse: loginData 
      });
    }

    // Step 2: Send WhatsApp
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
    console.log('📨 WhatsApp Send Response:', JSON.stringify(msgData));

    return res.status(200).json({ success: true, response: msgData });

  } catch (err) {
    console.log('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
