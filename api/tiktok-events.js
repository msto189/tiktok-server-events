module.exports = async function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  let body = {};
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = JSON.parse(Buffer.concat(chunks).toString());
  } catch (e) {}

  const pixelId = process.env.TIKTOK_PIXEL_ID;
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return res.status(500).json({ error: "Missing env vars" });

  const event = body.event || body.event_name;
  const event_id = body.event_id;
  if (!event || !event_id) return res.status(400).json({ error: "Missing event or event_id" });

  const payload = {
    pixel_code: pixelId,
    test_event_code: body.test_event_code,
    data: [
      {
        event: event,
        event_id: String(event_id),
        timestamp: Math.floor(Date.now() / 1000),
        properties: body.properties || {
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

  const r = await fetch("https://business-api.tiktok.com/open_api/v1.3/pixel/track/", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Access-Token": accessToken },
    body: JSON.stringify(payload)
  });

  const text = await r.text();
  return res.status(r.status).send(text);
};
