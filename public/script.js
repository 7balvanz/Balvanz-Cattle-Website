(() => {
  // Year in footer
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Header background once you scroll past the top
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
    header.classList.toggle("menu-open", open);
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

  // Gallery lightbox
  const box = document.getElementById("lightbox");
  if (box && typeof box.showModal === "function") {
    const img = box.querySelector("img");
    document.querySelectorAll(".gallery a").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        img.src = a.getAttribute("href");
        img.alt = a.querySelector("img").alt;
        box.showModal();
      });
    });
    box.addEventListener("click", () => box.close());
  }

  // Contact form
  const form = document.getElementById("contact-form");
  if (!form) return;
  const status = form.querySelector(".form-status");
  const button = form.querySelector("button[type=submit]");
  const say = (msg, kind) => { status.textContent = msg; status.className = "form-status " + (kind || ""); };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get("name") || "").trim();
    const email = (data.get("email") || "").trim();
    const message = (data.get("message") || "").trim();
    if (!name || !message) return say("Please add your name and a message.", "err");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return say("Please enter a valid email address.", "err");

    button.disabled = true;
    say("Sending…");
    try {
      const res = await fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error || "Something went wrong.");
      form.reset();
      if (window.turnstile) window.turnstile.reset();
      say("Thanks, your message is on its way. We'll be in touch soon.", "ok");
    } catch (err) {
      say(err.message + " Please try again shortly.", "err");
      if (window.turnstile) window.turnstile.reset();
    } finally {
      button.disabled = false;
    }
  });
})();
