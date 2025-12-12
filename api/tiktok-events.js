// api/tiktok-events.js

const TIKTOK_PIXEL_ID = process.env.TIKTOK_PIXEL_ID;
const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;

const TIKTOK_EVENTS_URL =
  "https://business-api.tiktok.com/open_api/v1.3/pixel/track/";

async function handler(req, res) {
  // Health check for GET
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      message: "TikTok server events API is running",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!TIKTOK_PIXEL_ID || !TIKTOK_ACCESS_TOKEN) {
    return res.status(500).json({
      error: "Missing TIKTOK_PIXEL_ID or TIKTOK_ACCESS_TOKEN in env",
    });
  }

  try {
    const body = req.body || {};

    const eventName = body.event || "CompletePayment";
    const eventId = body.event_id || `zid_order_${Date.now()}`;
    const value = Number(body.value || 0);
    const currency = body.currency || "SAR";
    const testEventCode = body.test_event_code || undefined;

    const user = body.user || {};
    const page = body.page || {};

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    const payload = {
      pixel_code: TIKTOK_PIXEL_ID,
      event: eventName,
      event_id: eventId,
      timestamp: Math.floor(Date.now() / 1000),
      context: {
        page: {
          url: page.url || "",
          referrer: page.referrer || "",
        },
        user: {
          email: user.email || null,
          phone: user.phone || null,
        },
        ip,
        user_agent: userAgent,
      },
      properties: {
        value,
        currency,
      },
    };

    if (testEventCode) {
      payload.test_event_code = testEventCode;
    }

    const tiktokResponse = await fetch(TIKTOK_EVENTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": TIKTOK_ACCESS_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    const rawText = await tiktokResponse.text();
    let forwardBody;

    try {
      forwardBody = JSON.parse(rawText);
    } catch (e) {
      forwardBody = rawText;
    }

    return res.status(200).json({
      status: "ok",
      forward_status: tiktokResponse.status,
      forward_body: forwardBody,
      sent_payload: payload,
    });
  } catch (err) {
    console.error("TikTok server event error:", err);

    return res.status(500).json({
      status: "error",
      message: "Failed to send event to TikTok",
      error: String(err && err.message ? err.message : err),
    });
  }
}

module.exports = handler;
