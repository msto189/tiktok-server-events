// api/tiktok-events.js

const TIKTOK_API_URL =
  "https://business-api.tiktok.com/open_api/v1.3/event/track/";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      event,
      event_id,
      value,
      currency,
      test_event_code,
      user,
      page,
    } = req.body || {};

    if (!event || !event_id) {
      return res.status(400).json({ error: "Missing event or event_id" });
    }

    const pixelCode = process.env.TIKTOK_PIXEL_ID;
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

    if (!pixelCode || !accessToken) {
      return res
        .status(500)
        .json({ error: "Missing TIKTOK_PIXEL_ID or TIKTOK_ACCESS_TOKEN" });
    }

    const payload = {
      event_source: "web",
      event_source_id: pixelCode,
      test_event_code: test_event_code || undefined,
      data: [
        {
          event: event,
          event_id: event_id,
          timestamp: new Date().toISOString(),
          context: {
            page: {
              url: (page && page.url) || null,
              referrer: (page && page.referrer) || null,
            },
            user: {
              email: user && user.email ? user.email : null,
              phone: user && user.phone ? user.phone : null,
              external_id:
                user && user.external_id ? user.external_id : null,
            },
          },
          properties: {
            value: typeof value === "number" ? value : 0,
            currency: currency || "SAR",
          },
        },
      ],
    };

    const response = await fetch(TIKTOK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify(payload),
    });

    const dataResp = await response.json();

    if (!response.ok) {
      console.error("TikTok API Error", dataResp);
      return res.status(500).json({
        error: "TikTok API error",
        details: dataResp,
      });
    }

    return res.status(200).json({
      success: true,
      tiktok_response: dataResp,
    });
  } catch (err) {
    console.error("Server error", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
