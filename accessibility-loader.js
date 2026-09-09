(function () {
  "use strict";

  function loadAccessibilityWidget() {
    if (document.getElementById("accessibility-widget")) {
      return;
    }

    fetch("accessibility-widget.html?v=2", {
      cache: "no-store"
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error(
            "تعذر تحميل accessibility-widget.html: HTTP " +
              response.status
          );
        }

        return response.text();
      })
      .then(function (html) {
        var container = document.createElement("div");
        container.id = "accessibility-widget-container";
        container.innerHTML = html;

        document.body.appendChild(container);

        var scripts = container.querySelectorAll("script");

        scripts.forEach(function (oldScript) {
          var newScript = document.createElement("script");

          if (oldScript.src) {
            newScript.src = oldScript.src;
          } else {
            newScript.textContent = oldScript.textContent;
          }

          document.body.appendChild(newScript);
          oldScript.remove();
        });

        createBackToTop();
      })
      .catch(function (error) {
        console.error("Accessibility Widget:", error);
      });
  }

  function createBackToTop() {
    if (document.getElementById("backToTop")) {
      return;
    }

    var button = document.createElement("button");

    button.type = "button";
    button.id = "backToTop";
    button.setAttribute(
      "aria-label",
      "الرجوع إلى بداية الصفحة"
    );
    button.title = "الرجوع إلى بداية الصفحة";
    button.textContent = "↑";

    Object.assign(button.style, {
      position: "fixed",
      right: "16px",
      bottom: "16px",
      width: "50px",
      height: "50px",
      border: "0",
      borderRadius: "50%",
      background: "#2563eb",
      color: "#fff",
      fontSize: "25px",
      fontWeight: "bold",
      cursor: "pointer",
      zIndex: "9998",
      boxShadow: "0 4px 14px rgba(0,0,0,.20)",
      display: "none",
      alignItems: "center",
      justifyContent: "center"
    });

    document.body.appendChild(button);

    window.addEventListener(
      "scroll",
      function () {
        button.style.display =
          window.scrollY > 300 ? "flex" : "none";
      },
      { passive: true }
    );

    button.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      loadAccessibilityWidget,
      { once: true }
    );
  } else {
    loadAccessibilityWidget();
  }
})();