// api/tiktok-events.js

const TIKTOK_API_URL =
  "https://business-api.tiktok.com/open_api/v1.3/event/track/";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      event,
      event_id,
      value,
      currency,
      test_event_code,
      user = {},
      page = {},
    } = req.body || {};

    if (!event || !event_id) {
      return res.status(400).json({
        error: "Missing required fields: event, event_id",
      });
    }

    const eventTime = Math.floor(Date.now() / 1000);

    const ipHeader = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const ip =
      typeof ipHeader === "string" ? ipHeader.split(",")[0].trim() : null;

    const userAgent = req.headers["user-agent"] || null;

    const payload = {
      event_source: "web",
      event_source_id: process.env.TIKTOK_PIXEL_ID,
      data: [
        {
          event,
          event_time: eventTime,
          event_id,
          user: {
            email: user.email || null,
            phone: user.phone || null,
            external_id: user.external_id || null,
            ip,
            user_agent: userAgent,
          },
          properties: {
            value: value ?? null,
            currency: currency || "USD",
            ...user.properties,
          },
          page: {
            url: page.url || null,
            referrer: page.referrer || null,
          },
          test_event_code: test_event_code || undefined,
        },
      ],
    };

    const response = await fetch(TIKTOK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": process.env.TIKTOK_ACCESS_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("TikTok API Error:", data);
      return res
        .status(500)
        .json({ error: "TikTok API error", details: data });
    }

    return res.status(200).json({
      success: true,
      tiktok_response: data,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
