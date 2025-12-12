function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async (req, res) => {
  setCorsHeaders(res);

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const pixelId = process.env.TIKTOK_PIXEL_ID;
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    return res.status(500).json({
      ok: false,
      error: "Missing TikTok env variables (TIKTOK_PIXEL_ID / TIKTOK_ACCESS_TOKEN)",
    });
  }

  try {
    const rawBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const body = rawBody ? JSON.parse(rawBody) : {};

    const eventName = body.event || "CompletePayment";
    const eventId = body.event_id || "server_" + Date.now();
    const value = Number(body.value || 0);
    const currency = body.currency || "SAR";
    const testEventCode = body.test_event_code || undefined;

    const page = body.page || {};
    const user = body.user || {};

    const clientIp =
      (req.headers["x-forwarded-for"] || "")
        .toString()
        .split(",")[0]
        .trim() || undefined;

    const tiktokPayload = {
      pixel_code: pixelId,
      event: eventName,
      event_id: eventId,
      timestamp: Math.floor(Date.now() / 1000),
      context: {
        page: {
          url: page.url || "",
          referrer: page.referrer || "",
        },
        user: {
          email: user.email || undefined,
          phone_number: user.phone || undefined,
        },
        ip: clientIp,
        user_agent: req.headers["user-agent"],
      },
      properties: {
        value,
        currency,
      },
    };

    if (testEventCode) {
      tiktokPayload.test_event_code = testEventCode;
    }

    const ttResponse = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/pixel/track/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": accessToken,
        },
        body: JSON.stringify(tiktokPayload),
      }
    );

    const ttText = await ttResponse.text();
    let ttJson;
    try {
      ttJson = JSON.parse(ttText);
    } catch {
      ttJson = { raw: ttText };
    }

    return res.status(200).json({
      ok: true,
      tiktok_status: ttResponse.status,
      tiktok_response: ttJson,
      sent_payload: tiktokPayload,
    });
  } catch (err) {
    console.error("TikTok server events error:", err);
    return res.status(500).json({
      ok: false,
      error: "Internal error while calling TikTok",
      details: err.message,
    });
  }
};
