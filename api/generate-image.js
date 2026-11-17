module.exports = async (req, res) => {
  const allowedOrigin = "https://yimour-ai.github.io";
  const quotaUrl =
    "https://yimour-d1-quota.abdelazizlimour26.workers.dev";

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );
  res.setHeader("Vary", "Origin");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.headers.origin && req.headers.origin !== allowedOrigin) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const prompt =
    typeof req.body?.prompt === "string"
      ? req.body.prompt.trim()
      : "";

  const visitorId = req.body?.visitorId;

  if (!prompt || prompt.length > 2048) {
    return res.status(400).json({
      error: "Enter a prompt of 1 to 2048 characters"
    });
  }

  if (
    typeof visitorId !== "string" ||
    !/^[a-f0-9-]{36}$/i.test(visitorId)
  ) {
    return res.status(400).json({
      error: "Invalid visitor ID"
    });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const quotaSecret = process.env.QUOTA_API_SECRET;

  if (!accountId || !apiToken || !quotaSecret) {
    return res.status(500).json({
      error: "Server configuration is incomplete"
    });
  }

  async function quotaRequest(action) {
    const response = await fetch(quotaUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${quotaSecret}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action,
        visitorId
      })
    });

    const data = await response.json();

    return { response, data };
  }

  try {
    // 1. Check the daily quota without consuming it.
    const check = await quotaRequest("check");

    if (!check.response.ok || !check.data.allowed) {
      return res.status(check.response.status || 503).json({
        error: check.data.message || check.data.error ||
          "Daily image limit reached",
        limit: check.data.limit,
        remaining: check.data.remaining
      });
    }

    // 2. Generate the image using the existing FLUX model.
    const imageResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt,
          steps: 4
        })
      }
    );

    const contentType =
      imageResponse.headers.get("content-type") || "";

    let imageBase64 = "";
    let imageType = "image/png";

    if (contentType.includes("application/json")) {
      const data = await imageResponse.json();

      imageBase64 =
        typeof data.result === "string"
          ? data.result
          : data.result?.image || "";

      if (
        !imageResponse.ok ||
        data.success === false ||
        !imageBase64
      ) {
        console.error("Cloudflare image error:", {
          status: imageResponse.status,
          errors: data.errors || []
        });

        return res.status(502).json({
          error: "Image generation failed",
          cloudflareStatus: imageResponse.status
        });
      }
    } else if (
      imageResponse.ok &&
      contentType.startsWith("image/")
    ) {
      const buffer = Buffer.from(
        await imageResponse.arrayBuffer()
      );

      imageBase64 = buffer.toString("base64");
      imageType = contentType.split(";")[0];
    } else {
      console.error(
        "Unexpected image response:",
        imageResponse.status
      );

      return res.status(502).json({
        error: "Unexpected response from image service",
        cloudflareStatus: imageResponse.status
      });
    }

    // 3. Consume one image only after successful generation.
    const consume = await quotaRequest("consume");

    if (!consume.response.ok || !consume.data.allowed) {
      return res.status(consume.response.status || 503).json({
        error: consume.data.message || consume.data.error ||
          "Could not confirm image quota",
        limit: consume.data.limit,
        remaining: consume.data.remaining
      });
    }

    return res.status(200).json({
      dataURI: `data:${imageType};base64,${imageBase64}`,
      limit: consume.data.limit,
      used: consume.data.used,
      remaining: consume.data.remaining
    });

  } catch (error) {
    console.error("Image API error:", error.message);

    return res.status(502).json({
      error: "Could not complete image generation"
    });
  }
};
