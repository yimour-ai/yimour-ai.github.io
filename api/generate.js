export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://yimour-ai.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { articleText, role, tone, length, format } = req.body;

    if (!articleText || articleText.trim() === '') {
      return res.status(400).json({
        error: 'يرجى إدخال نص المقال أو الفكرة'
      });
    }

    const instructionPrompt = `أنت مساعد متخصص في تحويل الأفكار أو المقالات إلى برومبت (prompt) منظم واحترافي.

المطلوب: حوّل النص التالي إلى برومبت جاهز للاستخدام، وليس إعادة كتابة للمقال نفسه.

الدور المطلوب: ${role || 'غير محدد'}
النبرة المطلوبة: ${tone || 'غير محددة'}
الطول المطلوب للبرومبت الناتج: ${length || 'متوسط'}
صيغة الإخراج: ${format || 'نص متصل'}

النص/الفكرة الأصلية من المستخدم:
"""
${articleText}
"""

اكتب فقط البرومبت النهائي المنظم، بدون أي شرح أو مقدمات.`;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: instructionPrompt
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error:', errText);

      return res.status(500).json({
        error: 'فشل الاتصال بخدمة الذكاء الاصطناعي'
      });
    }

    const data = await response.json();

    const generatedText =
      (data.choices?.[0]?.message?.content || '').trim();

    return res.status(200).json({
      result: generatedText
    });

  } catch (err) {
    console.error('Server error:', err);

    return res.status(500).json({
      error: 'حدث خطأ في الخادم'
    });
  }
}
