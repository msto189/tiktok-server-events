const fetch = require("node-fetch");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { event, event_id, value, currency, test_event_code, user, page } =
      req.body;

    const pixelId = process.env.TIKTOK_PIXEL_ID;
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      return res.status(500).json({ error: "Missing TikTok credentials" });
    }

    const payload = {
      event,
      event_id,
      timestamp: Math.floor(Date.now() / 1000),
      context: {
        page,
        user,
      },
      properties: {
        value,
        currency,
      },
      test_event_code,
    };

    const response = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/event/track/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": accessToken,
        },
        body: JSON.stringify({
          pixel_code: pixelId,
          data: [payload],
        }),
      }
    );

    const result = await response.json();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
