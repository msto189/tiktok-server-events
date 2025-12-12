module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const pixelId = process.env.TIKTOK_PIXEL_ID;
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      return res.status(500).json({ ok: false, error: 'Missing TikTok env vars' });
    }

    const event = body.event || 'CompletePayment';
    const eventId = body.event_id || ('srv_' + Date.now());
    const value = Number(body.value || 0);
    const currency = body.currency || 'SAR';
    const testCode = body.test_event_code;

    const user = body.user || {};
    const page = body.page || {};

    const payload = {
      pixel_code: pixelId,
      event: event,
      event_id: eventId,
      timestamp: Math.floor(Date.now() / 1000),
      context: {
        page: {
          url: page.url || '',
          referrer: page.referrer || ''
        },
        user: {
          email: user.email || null,
          phone: user.phone || null
        }
      },
      properties: {
        value: value,
        currency: currency
      },
      test_event_code: testCode
    };

    const tiktokResponse = await fetch(
      'https://business-api.tiktok.com/open_api/v1.3/event/track/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': accessToken
        },
        body: JSON.stringify({
          event_source: 'web',
          data: [payload]
        })
      }
    );

    const result = await tiktokResponse.json();

    return res.status(200).json({
      ok: true,
      tiktok_status: tiktokResponse.status,
      tiktok_response: result
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err && err.message ? err.message : 'Unknown error'
    });
  }
};
