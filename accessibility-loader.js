document.addEventListener("DOMContentLoaded", function () {
  fetch("accessibility-widget.html")
    .then(response => {
      if (!response.ok) throw new Error("تعذر تحميل أداة إمكانية الوصول");
      return response.text();
    })
    .then(html => {
      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);

      const script = container.querySelector("script");
      if (script) {
        const newScript = document.createElement("script");
        newScript.textContent = script.textContent;
        document.body.appendChild(newScript);
      }

      /* زر الرجوع إلى بداية الصفحة */
      const backToTop = document.createElement("button");
      backToTop.type = "button";
      backToTop.id = "backToTop";
      backToTop.setAttribute("aria-label", "الرجوع إلى بداية الصفحة");
      backToTop.title = "الرجوع إلى بداية الصفحة";
      backToTop.textContent = "↑";

      Object.assign(backToTop.style, {
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

      document.body.appendChild(backToTop);

      window.addEventListener("scroll", function () {
        backToTop.style.display =
          window.scrollY > 300 ? "flex" : "none";
      });

      backToTop.addEventListener("click", function () {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      });
    })
    .catch(error => {
      console.error("Accessibility Widget:", error);
    });
});
