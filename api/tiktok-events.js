module.exports = async function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Only POST allowed" });
    return;
  }

  let body = {};
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = JSON.parse(Buffer.concat(chunks).toString());
  } catch (e) {
    body = {};
  }

  const pixelId = process.env.TIKTOK_PIXEL_ID;
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    res.status(500).json({ error: "Missing env vars" });
    return;
  }

  const payload = {
    pixel_code: pixelId,
    test_event_code: body.test_event_code,
    data: [
      {
        event: body.event,
        event_id: body.event_id,
        timestamp: Math.floor(Date.now() / 1000),
        properties: {
          value: body.value,
          currency: body.currency || "SAR"
        },
        context: {
          page: {
            url: body.page?.url || "",
            referrer: body.page?.referrer || ""
          },
          user: {
            ip: req.headers["x-forwarded-for"]?.split(",")[0] || "",
            user_agent: req.headers["user-agent"] || ""
          }
        }
      }
    ]
  };

  const response = a
