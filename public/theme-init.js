// Apply the saved theme before stylesheets and the application can paint.
(() => {
  let theme = "system";
  try {
    theme = localStorage.getItem("theme") || "system";
  } catch {
    // Storage may be unavailable; the system preference still applies.
  }
  const isDark =
    theme === "dark" ||
    (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
})();
