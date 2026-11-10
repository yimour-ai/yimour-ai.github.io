module.exports = async (req, res) => {
  const allowedOrigin = "https://yimour-ai.github.io";

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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

  if (!prompt || prompt.length > 2048) {
    return res.status(400).json({
      error: "Enter a prompt of 1 to 2048 characters"
    });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  console.log("Account ID check:", {
  exists: !!accountId,
  length: accountId ? accountId.length : 0,
  isHex32: /^[a-f0-9]{32}$/i.test(accountId || "")
});
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return res.status(500).json({
      error: "Cloudflare configuration is incomplete"
    });
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt,
          steps: 4
        })
      }
    );

    const contentType = response.headers.get("content-type") || "";
    let imageBase64 = "";
    let imageType = "image/png";

    if (contentType.includes("application/json")) {
      const data = await response.json();

      imageBase64 =
        typeof data.result === "string"
          ? data.result
          : data.result?.image || "";

      if (!response.ok || data.success === false || !imageBase64) {
        console.error("Cloudflare error:", {
          status: response.status,
          errors: data.errors || []
        });

        return res.status(502).json({
          error: "Image generation failed",
          cloudflareStatus: response.status
        });
      }
    } else if (response.ok && contentType.startsWith("image/")) {
      const buffer = Buffer.from(await response.arrayBuffer());
      imageBase64 = buffer.toString("base64");
      imageType = contentType.split(";")[0];
    } else {
      console.error("Unexpected Cloudflare response:", response.status);

      return res.status(502).json({
        error: "Unexpected response from image service",
        cloudflareStatus: response.status
      });
    }

    return res.status(200).json({
      dataURI: `data:${imageType};base64,${imageBase64}`
    });

  } catch (error) {
    console.error("Image API error:", error.message);

    return res.status(502).json({
      error: "Could not connect to the image service"
    });
  }
};