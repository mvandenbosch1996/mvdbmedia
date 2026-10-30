// synced met bereken() in admin/factuur/index.html — bij wijziging beide bijwerken.
function bereken(doc) {
  const regels = doc.regels || [];
  const subtotaal = regels.reduce((s, r) => s + ((Number(r.aantal)||0) * (Number(r.stukprijs)||0)), 0);
  const korting = doc.korting || { type:"geen", waarde:0 };
  let kortingBedrag = 0;
  if (korting.type === "bedrag") kortingBedrag = Number(korting.waarde) || 0;
  else if (korting.type === "percentage") kortingBedrag = subtotaal * (Number(korting.waarde) || 0) / 100;
  kortingBedrag = Math.min(kortingBedrag, subtotaal);
  const naKorting = Math.max(0, subtotaal - kortingBedrag);
  const btwVerlegd = !!doc.btwVerlegd;
  const btwTarief = doc.btwTarief ?? 21;
  const btwBedrag = btwVerlegd ? 0 : naKorting * (btwTarief / 100);
  return naKorting + btwBedrag;
}
function euro(n) { return "€ " + (Number(n)||0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function esc(s) { return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

let alleDocs = [];
let huidigFilter = "alle";

function klantNaam(doc) {
  const k = doc.klant || {};
  return k.bedrijf || k.contact || k.email || "—";
}

function statusHtml(doc) {
  if (doc.type === "factuur") return "Factuur";
  if (doc.omgezet_naar) {
    const nr = esc(doc.omgezet_naar);
    return '<a class="status-omgezet" href="/admin/factuur?doc=' + encodeURIComponent(doc.omgezet_naar) + '" data-stop="1">&rarr; ' + nr + '</a>';
  }
  return "Open";
}

function render() {
  const tbody = document.getElementById("tbody");
  const leeg = document.getElementById("leeg");
  const docs = alleDocs.filter((d) => huidigFilter === "alle" || d.type === huidigFilter);
  tbody.innerHTML = "";
  leeg.style.display = docs.length ? "none" : "block";
  for (const doc of docs) {
    const tr = document.createElement("tr");
    const badge = doc.type === "factuur"
      ? '<span class="badge badge-factuur">Factuur</span>'
      : '<span class="badge badge-offerte">Offerte</span>';
    tr.innerHTML =
      '<td><span class="nummer">' + esc(doc.nummer) + '</span>' + badge + '</td>' +
      '<td>' + esc(klantNaam(doc)) + '</td>' +
      '<td>' + esc(doc.datum || "") + '</td>' +
      '<td class="r">' + euro(bereken(doc)) + '</td>' +
      '<td>' + statusHtml(doc) + '</td>';
    tr.addEventListener("click", (e) => {
      // klik op de status-link niet dubbel afhandelen (die navigeert zelf).
      if (e.target.closest("[data-stop]")) return;
      location.href = "/admin/factuur?doc=" + encodeURIComponent(doc.nummer);
    });
    tbody.appendChild(tr);
  }
}

async function laad() {
  const fout = document.getElementById("fout");
  fout.style.display = "none"; // reset vorige foutmelding bij (her)laden
  try {
    const res = await fetch("/api/documenten");
    if (!res.ok) { fout.style.display = "block"; fout.textContent = "Kon documenten niet laden."; return; }
    alleDocs = (await res.json()).documenten || [];
    render();
  } catch { fout.style.display = "block"; fout.textContent = "Kon documenten niet laden (netwerkfout)."; }
}

document.querySelectorAll(".filter-knop").forEach((knop) => {
  knop.addEventListener("click", () => {
    document.querySelectorAll(".filter-knop").forEach((k) => k.classList.remove("actief"));
    knop.classList.add("actief");
    huidigFilter = knop.dataset.filter;
    render();
  });
});
document.getElementById("logout-knop").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/admin/login/";
});

laad();
