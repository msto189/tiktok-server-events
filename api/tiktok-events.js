// api/tiktok-events.js

const fetch = require("node-fetch");

// -----------------------------
// Environment Variables
// -----------------------------
const PIXEL_ID =
  process.env.TT_PIXEL_ID || process.env.TIKTOK_PIXEL_ID;

const ACCESS_TOKEN =
  process.env.TT_ACCESS_TOKEN || process.env.TIKTOK_ACCESS_TOKEN;

// -----------------------------
// Handler
// -----------------------------
module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const body = req.body;

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      return res.status(500).json({
        error: "Missing TikTok environment variables",
      });
    }

    const tiktokPayload = {
      event: body.event,
      event_id: body.event_id,
      timestamp: Math.floor(Date.now() / 1000),
      source: "web",
      test_event_code: body.test_event_code || undefined,

      properties: {
        value: body.value,
        currency: body.currency,
      },

      context: {
        page: {
          url: body.page?.url || "",
          referrer: body.page?.referrer || "",
        },
        user: {
          email: body.user?.email || null,
          phone: body.user?.phone || null,
        },
      },
    };

    const tiktokResponse = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/event/track/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": ACCESS_TOKEN,
        },
        body: JSON.stringify({
          pixel_code: PIXEL_ID,
          event: tiktokPayload,
        }),
      }
    );

    const result = await tiktokResponse.json();

    return res.status(200).json({
      status: "ok",
      sent: tiktokPayload,
      tiktok_response: result,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Internal Server Error",
      details: err.toString(),
    });
  }
};
