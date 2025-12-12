module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res
      .status(200)
      .json({ status: "ok", message: "TikTok server events API is running" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};

    const event = body.event;
    const event_id = body.event_id;
    const value = body.value;
    const currency = body.currency;
    const test_event_code = body.test_event_code || null;
    const user = body.user || {};
    const page = body.page || {};

    const pixelId = process.env.TIKTOK_PIXEL_ID;
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      return res.status(500).json({
        error: "Missing TikTok credentials",
        details: "TIKTOK_PIXEL_ID or TIKTOK_ACCESS_TOKEN is not set"
      });
    }

    const payload = {
      event: event,
      event_id: event_id,
      timestamp: Math.floor(Date.now() / 1000),
      context: {
        page: {
          url: page.url || "",
          referrer: page.referrer || ""
        },
        user: {
          email: user.email || null,
          phone_number: user.phone || null
        }
      },
      properties: {
        value: value,
        currency: currency
      },
      test_event_code: test_event_code
    };

    const response = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/event/track/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": accessToken
        },
        body: JSON.stringify({
          pixel_code: pixelId,
          data: [payload]
        })
      }
    );

    const result = await response.json();

    return res.status(200).json({
      ok: true,
      tiktok_response: result
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server Error",
      details: err && err.message ? err.message : String(err)
    });
  }
};
