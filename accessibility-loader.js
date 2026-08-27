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
    })
    .catch(error => {
      console.error("Accessibility Widget:", error);
    });
});
