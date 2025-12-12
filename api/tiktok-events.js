const fetch = require("node-fetch");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { event, event_id, value, currency, page, user, test_event_code } = req.body;

  const payload = {
    event: event,
    event_id: event_id,
    timestamp: Math.floor(Date.now() / 1000),
    context: {
      page: {
        url: page?.url || "",
        referrer: page?.referrer || ""
      },
      user: {
        email: user?.email || null,
        phone_number: user?.phone || null
      }
    },
    properties: {
      value: value,
      currency: currency
    },
    test_event_code: test_event_code || null
  };

  try {
    const response = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/pixel/track/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": process.env.TIKTOK_ACCESS_TOKEN
        },
        body: JSON.stringify({
          pixel_code: process.env.TIKTOK_PIXEL_ID,
          event: event,
          event_id: event_id,
          test_event_code: test_event_code,
          context: payload.context,
          properties: payload.properties
        })
      }
    );

    const result = await response.json();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: "Server Error", details: err.message });
  }
};
