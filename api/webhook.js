export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'Webhook is live!' });
  }

  try {
    const body = req.body;

    // Extract student details from Graphy payload
    const name = body?.data?.name || body?.name || 'Student';
    const phone = body?.data?.phone || body?.phone || '';
    const loginLink = 'https://www.finearn.in/ // 🔁 Replace this

    if (!phone) {
      return res.status(400).json({ error: 'No phone number found' });
    }

    // Format phone: remove +, spaces, ensure 91 prefix
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91')
      ? cleanPhone
      : '91' + cleanPhone;

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
            template_name: 'payment_success', // 🔁 Replace this
            language: 'en',
            type: 'template',
            body_params: [name, loginLink],
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
