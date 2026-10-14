export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://yimour-ai.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { articleText, role, tone, length, format, mode } = req.body || {};

    if (typeof articleText !== "string" || !articleText.trim()) {
      return res.status(400).json({
        error: "يرجى إدخال نص المقال أو الفكرة"
      });
    }

    let instructionPrompt;

    if (mode === "content") {
      instructionPrompt = `أنت كاتب محتوى عربي محترف.

المطلوب: اكتب المحتوى النهائي مباشرةً اعتمادًا على الفكرة أو النص أدناه. لا تكتب برومبت ولا تعليمات ولا تشرح ما ستفعله.

الدور المطلوب: ${role || "كاتب محتوى"}
النبرة: ${tone || "احترافية"}
الطول: ${length || "متوسط"}
صيغة الإخراج: ${format || "نص متصل"}

الفكرة أو النص:
"""
${articleText}
"""

اكتب المحتوى النهائي باللغة العربية، مع تنظيم العناوين والفقرات عند الحاجة. لا تضف مقدمات عن طريقة عملك.`;

    } else {
      instructionPrompt = `أنت مساعد متخصص في إنشاء البرومبتات الاحترافية.

حوّل الفكرة التالية إلى برومبت منظم وجاهز للاستخدام، ولا تكتب المحتوى النهائي نفسه.

الدور المطلوب: ${role || "غير محدد"}
النبرة: ${tone || "غير محددة"}
الطول: ${length || "متوسط"}
صيغة الإخراج: ${format || "نص متصل"}

الفكرة الأصلية:
"""
${articleText}
"""

اكتب البرومبت النهائي فقط، دون شرح إضافي.`;
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: instructionPrompt
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", errText);

      return res.status(502).json({
        error: "تعذر توليد المحتوى حاليًا",
        details: errText
      });
    }

    const data = await response.json();
    const generatedText =
      (data.choices?.[0]?.message?.content || "").trim();

    if (!generatedText) {
      return res.status(502).json({
        error: "لم يُرجع الذكاء الاصطناعي محتوى. حاول مجددًا."
      });
    }

    return res.status(200).json({
      result: generatedText
    });

  } catch (err) {
    console.error("Server error:", err);

    return res.status(500).json({
      error: "حدث خطأ في الخادم"
    });
  }
}