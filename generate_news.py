#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_news.py
يجيب آخر أخبار الذكاء الاصطناعي من مصادر RSS ويبني ملف news.html
بنفس ستايل الموقع (Arial + بطاقات بيضاء + أزرق #2563eb).

الاستخدام:
    pip install feedparser --break-system-packages
    python3 generate_news.py

المخرجات:
    news.html (في نفس المجلد الذي تشغل منه السكريبت)
"""

import feedparser
import html
from datetime import datetime

# --------- إعدادات ---------

RSS_FEEDS = [
    "https://techcrunch.com/tag/artificial-intelligence/feed/",
    "https://venturebeat.com/category/ai/feed/",
    "https://www.artificialintelligence-news.com/feed/",
    "https://www.technologyreview.com/feed/",
]

MAX_ARTICLES = 15          # أقصى عدد أخبار تظهر في الصفحة
MAX_DESC_CHARS = 220       # طول الملخص المعروض لكل خبر
OUTPUT_FILE = "news.html"
PAGE_TITLE = "أخبار الذكاء الاصطناعي"

# --------- جلب الأخبار ---------

def fetch_all_news():
    items = []
    for url in RSS_FEEDS:
        try:
            feed = feedparser.parse(url)
            source_name = feed.feed.get("title", "مصدر خارجي")
            for entry in feed.entries[:10]:
                title = entry.get("title", "").strip()
                link = entry.get("link", "").strip()
                summary_raw = entry.get("summary", "") or entry.get("description", "")
                summary = clean_summary(summary_raw)
                published = entry.get("published", "") or entry.get("updated", "")
                pub_date = parse_date(published)

                if title and link:
                    items.append({
                        "title": title,
                        "link": link,
                        "summary": summary,
                        "source": source_name,
                        "date": pub_date,
                        "sort_key": pub_date or datetime.min,
                    })
        except Exception as e:
            print(f"تحذير: تعذر جلب {url}: {e}")

    items.sort(key=lambda x: x["sort_key"], reverse=True)
    return items[:MAX_ARTICLES]


def clean_summary(raw_html):
    import re
    text = re.sub(r"<[^>]+>", "", raw_html or "")
    text = html.unescape(text).strip()
    if len(text) > MAX_DESC_CHARS:
        text = text[:MAX_DESC_CHARS].rsplit(" ", 1)[0] + "..."
    return text


def parse_date(date_str):
    if not date_str:
        return None
    formats = [
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S %Z",
        "%Y-%m-%dT%H:%M:%S%z",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None


# --------- بناء HTML ---------

def build_card(item):
    date_display = item["date"].strftime("%Y-%m-%d") if item["date"] else ""
    title = html.escape(item["title"])
    summary = html.escape(item["summary"])
    source = html.escape(item["source"])
    link = html.escape(item["link"])

    return f"""
        <div class="news-card">
          <h2 class="news-title">{title}</h2>
          <div class="news-meta">{source}{" • " + date_display if date_display else ""}</div>
          <p class="news-summary">{summary}</p>
          <a class="news-link" href="{link}" target="_blank" rel="noopener noreferrer">اقرأ الخبر كاملاً ←</a>
        </div>"""


def build_page(items):
    today = datetime.now().strftime("%Y-%m-%d")
    cards_html = "\n".join(build_card(item) for item in items)

    if not items:
        cards_html = '<p style="text-align:center;color:#666;">تعذر جلب الأخبار حالياً، حاول لاحقاً.</p>'

    return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>{PAGE_TITLE}</title>
<meta name="description" content="آخر أخبار وتطورات الذكاء الاصطناعي محدثة أولاً بأول."
<meta name="robots" content="index, follow">>
<link rel="canonical" href="https://aziz680-blep.github.io/ai-wold/news.html">
<style>
  * {{ box-sizing: border-box; }}
  body {{
    font-family: Arial, sans-serif;
    background-color: #f5f7fb;
    margin: 0;
    padding: 0;
    color: #1f2937;
  }}
  header {{
    background: #ffffff;
    padding: 24px 16px;
    text-align: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  }}
  header h1 {{
    margin: 0 0 6px;
    color: #2563eb;
    font-size: 28px;
  }}
  header p {{
    margin: 0;
    color: #666;
    font-size: 14px;
  }}
  .container {{
    max-width: 900px;
    margin: 30px auto;
    padding: 0 16px;
  }}
  .back-link {{
    display: inline-block;
    margin-bottom: 20px;
    color: #2563eb;
    text-decoration: none;
    font-weight: bold;
  }}
  .back-link:hover {{ text-decoration: underline; }}
  .news-card {{
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    padding: 20px;
    margin-bottom: 18px;
  }}
  .news-title {{
    margin: 0 0 8px;
    font-size: 19px;
    color: #1f2937;
  }}
  .news-meta {{
    font-size: 13px;
    color: #888;
    margin-bottom: 10px;
  }}
  .news-summary {{
    font-size: 15px;
    line-height: 1.7;
    color: #374151;
    margin-bottom: 12px;
  }}
  .news-link {{
    color: #2563eb;
    text-decoration: none;
    font-weight: bold;
    font-size: 14px;
  }}
  .news-link:hover {{ text-decoration: underline; }}
  footer {{
    text-align: center;
    padding: 20px;
    color: #999;
    font-size: 13px;
  }}
</style>
</head>
<body>

<header>
  <h1>{PAGE_TITLE}</h1>
  <p>آخر تحديث: {today}</p>
</header>

<div class="container">
  <a class="back-link" href="index.html">→ العودة إلى الرئيسية</a>
  {cards_html}
</div>

<footer>
  &copy; {datetime.now().year} جميع الحقوق محفوظة.
</footer>

</body>
</html>
"""


def main():
    print("جاري جلب الأخبار...")
    items = fetch_all_news()
    print(f"تم جلب {len(items)} خبر.")

    page = build_page(items)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(page)

    print(f"تم إنشاء {OUTPUT_FILE} بنجاح.")


if __name__ == "__main__":
    main()
