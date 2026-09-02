(function () {
  if (document.getElementById("google_translate_element")) return;

  const button = document.createElement("button");
  button.id = "translateBtn";
  button.innerHTML = "🌐";
  button.title = "ترجمة الصفحة";

  button.style.cssText = `
    position: fixed;
    bottom: 145px;
    right: 20px;
    width: 48px;
    height: 48px;
    border: none;
    border-radius: 50%;
    background: #2563eb;
    color: white;
    font-size: 22px;
    cursor: pointer;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,.3);
  `;

  document.body.appendChild(button);

  const box = document.createElement("div");
  box.id = "google_translate_element";

  box.style.cssText = `
    display: none;
    position: fixed;
    bottom: 200px;
    right: 20px;
    z-index: 9999;
    background: white;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,.2);
  `;

  document.body.appendChild(box);

  button.onclick = function () {
    box.style.display =
      box.style.display === "none" ? "block" : "none";
  };

  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement(
      {
        pageLanguage: "ar",
        includedLanguages: "en,fr,es,de,tr,ru,zh-CN,hi,pt,ur",
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
      },
      "google_translate_element"
    );
  };

  const script = document.createElement("script");
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;

  document.body.appendChild(script);
})();
