module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS,GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method === "GET") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ status: "ok", message: "TikTok server events API is running" }));
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ status: "error", message: "Method not allowed" }));
  }

  try {
    var pixelId = process.env.TIKTOK_PIXEL_ID;
    var accessToken = process.env.TIKTOK_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ status: "error", message: "Missing env vars" }));
    }

    var body = req.body || {};
    var eventName = body.event;
    var eventId = body.event_id;
    var value = body.value;
    var currency = body.currency;
    var testEventCode = body.test_event_code;
    var user = body.user || {};
    var page = body.page || {};

    var ip =
      (req.headers["x-forwarded-for"] && String(req.headers["x-forwarded-for"]).split(",")[0].trim()) ||
      req.socket.remoteAddress ||
      "";

    var ua = req.headers["user-agent"] || "";

    var payload = {
      pixel_code: pixelId,
      event: eventName,
      event_id: eventId,
      timestamp: Math.floor(Date.now() / 1000),
      properties: {
        value: value,
        currency: currency
      },
      context: {
        page: {
          url: page.url || "",
          referrer: page.referrer || ""
        },
        user: {
          ip: ip,
          user_agent: ua,
          email: user.email || null,
          phone_number: user.phone || null
        }
      }
    };

    if (testEventCode) payload.test_event_code = testEventCode;

    var resp = await fetch("https://business-api.tiktok.com/open_api/v1.3/pixel/track/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken
      },
      body: JSON.stringify(payload)
    });

    var text = await resp.text();
    res.statusCode = resp.status;
    res.setHeader("Content-Type", "application/json");
    return res.end(text);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ status: "error", message: "Server error" }));
  }
};
