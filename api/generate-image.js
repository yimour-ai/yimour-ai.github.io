
module.exports = async (req, res) => {
  const allowedOrigin = "https://yimour-ai.github.io";

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Image-Test-Secret"
  );
  res.setHeader("Vary", "Origin");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (
    req.headers.origin &&
    req.headers.origin !== allowedOrigin
  ) {
    return res.status(403).json({
      error: "Origin not allowed"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const testSecret = process.env.IMAGE_TEST_SECRET;
  const suppliedSecret = req.headers["x-image-test-secret"];

  if (!testSecret || suppliedSecret !== testSecret) {
    return res.status(401).json({
      error: "Unauthorized"
    });
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
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return res.status(500).json({
      error: "Server configuration is incomplete"
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

    const data = await response.json();

    if (
      !response.ok ||
      !data.success ||
      !data.result?.image
    ) {
      const errorDetails = {
        status: response.status,
        errors: data.errors || [],
        messages: data.messages || []
      };

      console.error(
        "Cloudflare image API error:",
        JSON.stringify(errorDetails)
      );

      return res.status(502).json({
        error: "Image generation failed",
        cloudflareStatus: response.status,
        details: data.errors || [],
        messages: data.messages || []
      });
    }

    return res.status(200).json({
      dataURI: `data:image/jpeg;base64,${data.result.image}`
    });
  } catch (error) {
    console.error(
      "Image API request failed:",
      error.message
    );

    return res.status(502).json({
      error: "Could not connect to the image service"
    });
  }
};
