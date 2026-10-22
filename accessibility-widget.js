(function () {
  "use strict";

  function initAccessibilityWidget() {
    const widget = document.getElementById("accessibility-widget");
    const toggle = document.getElementById("accessibility-toggle");
    const panel = document.getElementById("accessibility-panel");
    const close = document.getElementById("accessibility-close");
    const increase = document.getElementById("font-increase");
    const decrease = document.getElementById("font-decrease");
    const contrast = document.getElementById("contrast-toggle");
    const read = document.getElementById("read-toggle");
    const reset = document.getElementById("reset-accessibility");
    const status = document.getElementById("accessibility-status");

    if (!widget || !toggle || !panel || widget.dataset.initialized === "true") {
      return;
    }

    widget.dataset.initialized = "true";

    let fontScale = 1;
    let speaking = false;

    function announce(message) {
      if (status) status.textContent = message;
    }

    function setPanel(open) {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute(
        "aria-label",
        open ? "إغلاق أدوات إمكانية الوصول" : "فتح أدوات إمكانية الوصول"
      );
    }

    toggle.addEventListener("click", function () {
      setPanel(panel.hidden);
    });

    if (close) {
      close.addEventListener("click", function () {
        setPanel(false);
      });
    }

    function changeFont(amount) {
      fontScale = Math.max(0.8, Math.min(1.5, fontScale + amount));

      document.querySelectorAll("body *").forEach(function (el) {
        if (widget.contains(el) || el === widget) return;
        if (["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT"].includes(el.tagName)) return;

        if (!el.hasAttribute("data-a11y-font-original")) {
          const computed = window.getComputedStyle(el).fontSize;
          el.setAttribute("data-a11y-font-original", computed);
          el.setAttribute("data-a11y-font-inline", el.style.fontSize || "");
        }

        const original = parseFloat(el.getAttribute("data-a11y-font-original"));
        if (Number.isFinite(original)) {
          el.style.fontSize = (original * fontScale) + "px";
        }
      });

      announce("حجم الخط: " + Math.round(fontScale * 100) + "%");
    }

    if (increase) {
      increase.addEventListener("click", function () {
        changeFont(0.1);
      });
    }

    if (decrease) {
      decrease.addEventListener("click", function () {
        changeFont(-0.1);
      });
    }


    if (contrast) {
      contrast.addEventListener("click", function () {
        const enabled = document.body.classList.toggle("high-contrast");
        contrast.setAttribute("aria-pressed", String(enabled));
        announce(enabled ? "تم تفعيل التباين العالي" : "تم إيقاف التباين العالي");
      });
    }

    if (read) {
      read.addEventListener("click", function () {
        if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
          announce("عذرًا، القراءة الصوتية غير مدعومة في هذا المتصفح");
          return;
        }

        if (window.speechSynthesis.speaking || speaking) {
          window.speechSynthesis.cancel();
          speaking = false;
          read.textContent = "🔊 قراءة المقال";
          announce("تم إيقاف القراءة الصوتية");
          return;
        }

        const source =
          document.querySelector("article") ||
          document.querySelector("main") ||
          document.querySelector(".article-content") ||
          document.querySelector(".content") ||
          document.body;

        const copy = source.cloneNode(true);
        const clonedWidget = copy.querySelector("#accessibility-widget");
        if (clonedWidget) clonedWidget.remove();

        copy.querySelectorAll("script, style, nav, footer, button, input, textarea, select")
          .forEach(function (el) { el.remove(); });

        const text = copy.innerText || copy.textContent || "";
        if (!text.trim()) {
          announce("لا يوجد نص متاح للقراءة في هذه الصفحة");
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = document.documentElement.lang || "ar";
        utterance.rate = 0.9;

        utterance.onstart = function () {
          speaking = true;
          read.textContent = "⏹ إيقاف القراءة";
          announce("بدأت القراءة الصوتية");
        };

        utterance.onend = utterance.onerror = function () {
          speaking = false;
          read.textContent = "🔊 قراءة المقال";
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });
    }

    if (reset) {
      reset.addEventListener("click", function () {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        speaking = false;
        fontScale = 1;

        document.body.classList.remove("high-contrast");

        document.querySelectorAll("[data-a11y-font-original]").forEach(function (el) {
          const originalInline = el.getAttribute("data-a11y-font-inline");
          if (originalInline) {
            el.style.fontSize = originalInline;
          } else {
            el.style.removeProperty("font-size");
          }

          el.removeAttribute("data-a11y-font-original");
          el.removeAttribute("data-a11y-font-inline");
        });

        if (grayscale) grayscale.setAttribute("aria-pressed", "false");
        if (contrast) contrast.setAttribute("aria-pressed", "false");
        if (read) read.textContent = "🔊 قراءة المقال";

        announce("تمت إعادة ضبط إعدادات إمكانية الوصول");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAccessibilityWidget);
  } else {
    initAccessibilityWidget();
  }
})();
