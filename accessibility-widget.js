(function () {
  "use strict";

  function initAccessibilityWidget() {
    const toggle = document.getElementById("accessibility-toggle");
    const panel = document.getElementById("accessibility-panel");
    const close = document.getElementById("accessibility-close");

    if (!toggle || !panel) {
      return;
    }

    /* فتح وإغلاق لوحة إمكانية الوصول */
    toggle.addEventListener("click", function () {
      const isOpen = !panel.hidden;

      panel.hidden = isOpen;
      toggle.setAttribute("aria-expanded", String(!isOpen));
      toggle.setAttribute(
        "aria-label",
        isOpen
          ? "فتح أدوات إمكانية الوصول"
          : "إغلاق أدوات إمكانية الوصول"
      );
    });

    /* زر الإغلاق */
    if (close) {
      close.addEventListener("click", function () {
        panel.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute(
          "aria-label",
          "فتح أدوات إمكانية الوصول"
        );
      });
    }
  }

  /* لأن الـ HTML يتم تحميله ديناميكيًا بواسطة loader */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAccessibilityWidget);
  } else {
    initAccessibilityWidget();
  }
})();
