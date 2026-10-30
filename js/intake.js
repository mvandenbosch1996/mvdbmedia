(function(){
  var MAIL_TO = "info@mvdbmedia.nl";

  /* ---- eigen items toevoegen ---- */
  document.querySelectorAll(".btn-add").forEach(function(btn){
    var input = document.getElementById(btn.dataset.add);
    var list  = document.getElementById(btn.dataset.list);
    function add(){
      var v = input.value.trim();
      if(!v) return;
      var li = document.createElement("li");
      var span = document.createElement("span");
      span.textContent = v;
      var del = document.createElement("button");
      del.type = "button";
      del.textContent = "✕";
      del.setAttribute("aria-label","Verwijder " + v);
      del.addEventListener("click", function(){ li.remove(); updateProgress(); });
      li.appendChild(span); li.appendChild(del);
      list.appendChild(li);
      input.value = "";
      input.focus();
      updateProgress();
    }
    btn.addEventListener("click", add);
    input.addEventListener("keydown", function(e){
      if(e.key === "Enter"){ e.preventDefault(); add(); }
    });
  });

  /* ---- logo upload tonen/verbergen ---- */
  var logoBox = document.getElementById("logoUpload");
  var logoFile = document.getElementById("logoFile");
  var logoText = document.getElementById("logoFileText");
  document.querySelectorAll('input[name="logo"]').forEach(function(r){
    r.addEventListener("change", function(){
      var show = r.value.indexOf("aanwezig") > -1 || r.value.indexOf("Aanwezig") > -1 || r.value.indexOf("vernieuwd") > -1;
      logoBox.style.display = show ? "block" : "none";
      if(!show){ logoFile.value = ""; logoText.textContent = "Klik hier om uw logobestand(en) te kiezen"; logoText.parentElement.classList.remove("has-file"); }
      updateProgress();
    });
  });
  var LOGO_EXT = /\.(png|jpe?g|webp|gif|svg|pdf|ai|eps)$/i;
  var logoErr = document.getElementById("logoError");
  function checkLogoFiles(){
    var files = Array.prototype.slice.call(logoFile.files);
    var total = files.reduce(function(t, f){ return t + f.size; }, 0);
    var msg = "";
    if(files.length > 5) msg = "Te veel bestanden — maximaal 5 logobestanden.";
    else if(files.some(function(f){ return !LOGO_EXT.test(f.name); })) msg = "Bestandstype niet toegestaan — gebruik PNG, JPG, WebP, GIF, SVG, PDF, AI of EPS.";
    else if(total > 15 * 1024 * 1024) msg = "Logobestand(en) te groot — maximaal 15 MB totaal.";
    logoErr.textContent = msg;
    logoFile.setAttribute("aria-invalid", msg ? "true" : "false");
    if(msg) logoFile.value = "";
    return !msg;
  }
  logoFile.addEventListener("change", function(){
    checkLogoFiles();
    if(logoFile.files.length){
      var names = Array.prototype.map.call(logoFile.files, function(f){ return f.name; });
      logoText.textContent = "✓ " + names.join(", ");
      logoText.parentElement.classList.add("has-file");
    } else {
      logoText.textContent = "Klik hier om uw logobestand(en) te kiezen";
      logoText.parentElement.classList.remove("has-file");
    }
  });

  /* ---- voortgang & sectiestatus ---- */
  var sections = Array.prototype.slice.call(document.querySelectorAll("[data-sec]"));
  function sectionFilled(sec){
    var texts = sec.querySelectorAll("input[type=text],input[type=email],input[type=tel],input[type=url],textarea");
    for(var i=0;i<texts.length;i++){ if(texts[i].value.trim()) return true; }
    var checks = sec.querySelectorAll("input[type=checkbox]:checked,input[type=radio]:checked");
    if(checks.length) return true;
    if(sec.querySelectorAll(".custom-list li").length) return true;
    return false;
  }
  function updateProgress(){
    var done = 0;
    sections.forEach(function(sec){
      var ok = sectionFilled(sec);
      sec.classList.toggle("done", ok);
      if(ok) done++;
    });
    var pct = Math.round((done / sections.length) * 100);
    document.getElementById("bar").style.width = pct + "%";
    document.getElementById("pct").textContent = pct + "%";
  }
  document.addEventListener("input", updateProgress);
  document.addEventListener("change", updateProgress);
  updateProgress();

  /* ---- samenvatting opbouwen ---- */
  function buildSummary(){
    var lines = [];
    lines.push("WEBSITE INTAKE — MVDBmedia");
    lines.push("Ingevuld op: " + new Date().toLocaleDateString("nl-NL"));
    lines.push("");

    sections.forEach(function(sec){
      var title = sec.querySelector("h2").textContent.trim();
      var block = [];

      sec.querySelectorAll("input[data-q],textarea[data-q]").forEach(function(el){
        if(el.value.trim()) block.push(el.dataset.q + ": " + el.value.trim());
      });

      sec.querySelectorAll(".choices").forEach(function(group){
        var checked = group.querySelectorAll("input:checked");
        if(checked.length){
          var vals = Array.prototype.map.call(checked, function(c){ return c.value; });
          block.push(group.dataset.group + ": " + vals.join(", "));
        }
      });

      var lf = sec.querySelector("#logoFile");
      if(lf && lf.files.length){
        var names = Array.prototype.map.call(lf.files, function(f){ return f.name; });
        block.push("Logo-bestand (meegestuurd als bijlage): " + names.join(", "));
      }

      sec.querySelectorAll(".custom-list").forEach(function(list){
        var items = list.querySelectorAll("li span");
        if(items.length){
          var vals = Array.prototype.map.call(items, function(s){ return s.textContent; });
          block.push(list.dataset.group + ": " + vals.join(", "));
        }
      });

      if(block.length){
        lines.push("=== " + title.toUpperCase() + " ===");
        lines = lines.concat(block);
        lines.push("");
      }
    });

    return lines.join("\n");
  }

  function notify(msg){
    var n = document.getElementById("notice");
    n.textContent = msg;
    n.classList.add("show");
    setTimeout(function(){ n.classList.remove("show"); }, 4000);
  }

  /* ---- versturen ---- */
  var sending = false;

  /* ---- Cloudflare Turnstile (alleen actief als geconfigureerd) ---- */
  var tsOn = false, tsToken = "", tsWidget = null;
  function tsReset(){ if(tsOn && window.turnstile && tsWidget !== null){ window.turnstile.reset(tsWidget); } tsToken = ""; }
  fetch("/api/turnstile", { cache: "no-store" })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(!d || !d.sitekey) return;
      tsOn = true;
      var sc = document.createElement("script");
      sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      sc.async = true;
      sc.onload = function(){
        tsWidget = window.turnstile.render("#ts-box", {
          sitekey: d.sitekey, theme: "dark", language: "nl",
          callback: function(t){ tsToken = t; },
          "expired-callback": function(){ tsToken = ""; },
          "error-callback": function(){ tsToken = ""; }
        });
      };
      document.head.appendChild(sc);
    })
    .catch(function(){});
  function mailtoFallback(){
    var body = buildSummary();
    var bedrijf = document.getElementById("bedrijf").value.trim();
    var subject = "Website intake" + (bedrijf ? " — " + bedrijf : "");
    var href = "mailto:" + MAIL_TO +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
    if(href.length > 7500){
      notify("Gebruik 'Kopieer' of 'Download' en stuur de antwoorden naar " + MAIL_TO + ".");
      return;
    }
    window.location.href = href;
    notify("Direct versturen lukte niet — uw e-mailprogramma is geopend als alternatief. Vergeet uw logo niet als bijlage.");
  }

  var emailEl = document.getElementById("email");
  var emailErr = document.getElementById("err-email");
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function validateEmail(){
    var v = emailEl.value.trim();
    var bad = v !== "" && !EMAIL_RE.test(v);
    emailEl.setAttribute("aria-invalid", bad ? "true" : "false");
    emailErr.textContent = bad ? "Dit lijkt geen geldig e-mailadres. Voorbeeld: naam@bedrijf.nl" : "";
    return !bad;
  }
  emailEl.addEventListener("blur", validateEmail);
  emailEl.addEventListener("input", function(){ if(emailEl.getAttribute("aria-invalid") === "true") validateEmail(); });

  document.getElementById("btnSend").addEventListener("click", function(){
    if(sending) return;
    if(tsOn && !tsToken){ notify("Bevestig eerst de beveiligingscontrole."); return; }
    if(!validateEmail()){ emailEl.focus(); notify("Controleer het e-mailadres en probeer het opnieuw."); return; }
    if(logoFile.files.length && !checkLogoFiles()){ logoFile.focus(); notify("Controleer de logobestanden en probeer het opnieuw."); return; }
    var btn = this;
    var summary = buildSummary();
    var fd = new FormData();
    fd.append("summary", summary);
    fd.append("bedrijf", document.getElementById("bedrijf").value.trim());
    fd.append("email", document.getElementById("email").value.trim());
    fd.append("website_hp", document.getElementById("website_hp").value);
    if(tsToken) fd.append("cf-turnstile-response", tsToken);
    if(logoFile && logoFile.files.length){
      Array.prototype.forEach.call(logoFile.files, function(f){ fd.append("logo", f, f.name); });
    }

    sending = true;
    btn.disabled = true;
    var oldLabel = btn.textContent;
    btn.textContent = "Versturen…";

    fetch("/api/intake", { method:"POST", body: fd })
      .then(function(res){ return res.json().catch(function(){ return {}; }).then(function(data){ return {ok:res.ok, data:data}; }); })
      .then(function(r){
        if(r.ok && r.data && r.data.ok !== false){
          var box = document.getElementById("submitBox");
          box.innerHTML = '<h2>Bedankt — uw antwoorden zijn verstuurd</h2>' +
            '<p>We nemen zo snel mogelijk contact met u op. Wilt u nog iets toevoegen of wijzigen? Mail gerust naar <a href="mailto:' + MAIL_TO + '" style="color:var(--gold)">' + MAIL_TO + '</a>.</p>';
          box.setAttribute("role", "status"); box.setAttribute("tabindex", "-1"); box.focus({preventScroll:true});
          box.scrollIntoView({behavior:"smooth", block:"center"});
        } else {
          sending = false;
          btn.disabled = false;
          btn.textContent = oldLabel;
          tsReset();
          notify((r.data && r.data.error) ? r.data.error : "Versturen mislukt — probeer het opnieuw of mail naar " + MAIL_TO + ".");
        }
      })
      .catch(function(){
        sending = false;
        btn.disabled = false;
        btn.textContent = oldLabel;
        tsReset();
        mailtoFallback();
      });
  });
})();
