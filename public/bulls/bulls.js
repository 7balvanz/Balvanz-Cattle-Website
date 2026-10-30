// Renders bull listings from /bulls/bulls.json.
// Each entry can include: name, tag, registration, breed, born, sire, dam, notes, photo, status.
(async () => {
  const list = document.getElementById("bull-list");
  const empty = document.getElementById("bull-empty");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let bulls = [];
  try {
    const res = await fetch("/bulls/bulls.json", { cache: "no-cache" });
    if (res.ok) bulls = await res.json();
  } catch { /* fall through to empty state */ }

  if (!Array.isArray(bulls) || bulls.length === 0) {
    empty.hidden = false;
    return;
  }

  const rows = [
    ["Tag", "tag"], ["Registration", "registration"], ["Breed", "breed"],
    ["Born", "born"], ["Sire", "sire"], ["Dam", "dam"],
  ];

  list.innerHTML = bulls.map((b) => `
    <article class="bull">
      <div class="bull-photo">
        ${b.photo ? `<img src="${esc(b.photo)}" alt="${esc(b.name)}" loading="lazy">` : `<svg class="bull-photo-mark" aria-hidden="true"><use href="#brand"/></svg>`}
        ${b.status ? `<span class="bull-status">${esc(b.status)}</span>` : ""}
      </div>
      <div class="bull-body">
        <h2>${esc(b.name || "Unnamed")}</h2>
        <dl>
          ${rows.filter(([, k]) => b[k]).map(([label, k]) => `<div><dt>${label}</dt><dd>${esc(b[k])}</dd></div>`).join("")}
        </dl>
        ${b.notes ? `<p class="bull-notes">${esc(b.notes)}</p>` : ""}
        <a class="btn-link" href="/#contact">Inquire <span aria-hidden="true">→</span></a>
      </div>
    </article>`).join("");
})();
