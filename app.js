(function () {
  /* ── State ─────────────────────────────────────────────────── */
  const state = {
    groupFirst: {},
    groupSecond: {},
    groupThird: {},
    winners: {},
    champion: null,
  };

  const matchMap = Object.fromEntries(BRACKET_MATCHES.map((m) => [m.id, m]));

  /* ── DOM refs ───────────────────────────────────────────────── */
  const playerNameInput = document.getElementById("player-name");
  const groupsGrid      = document.getElementById("groups-grid");
  const bracketEl       = document.getElementById("bracket");
  const shareBtn        = document.getElementById("share-btn");
  const toast           = document.getElementById("toast");
  const rankingsBody    = document.getElementById("rankings-body");

  const COOKIE_NAME = "lind_wc2026_picks";
  const COOKIE_DAYS = 90;
  const BRACKET_VERSION = 3;

  /* ── Cookie persistence ───────────────────────────────────────── */
  function saveState() {
    const data = {
      bracketVersion: BRACKET_VERSION,
      playerName: playerNameInput.value.trim(),
      groupFirst: state.groupFirst,
      groupSecond: state.groupSecond,
      groupThird: state.groupThird,
      winners: state.winners,
      champion: state.champion,
    };
    const expires = new Date();
    expires.setDate(expires.getDate() + COOKIE_DAYS);
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  function loadState() {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`));
    if (!match) return;

    try {
      const data = JSON.parse(decodeURIComponent(match[1]));
      if (data.playerName) playerNameInput.value = data.playerName;
      if (data.groupFirst) state.groupFirst = data.groupFirst;
      if (data.groupSecond) state.groupSecond = data.groupSecond;
      if (data.groupThird) state.groupThird = data.groupThird;
      if (data.bracketVersion === BRACKET_VERSION && data.winners) {
        state.winners = data.winners;
        state.champion = data.champion || data.winners?.final || null;
      } else {
        state.winners = {};
        state.champion = null;
      }
    } catch {
      /* ignore corrupt cookie */
    }
  }


  /* ── Slot resolution ────────────────────────────────────────── */
  function resolveSlot(slot) {
    if (!slot) return null;
    if (slot.type === "group") {
      const picks = slot.position === 1 ? state.groupFirst
        : slot.position === 2 ? state.groupSecond
        : state.groupThird;
      return picks[slot.group] || null;
    }
    if (slot.type === "third") {
      const assignment = getThirdPlaceAssignment(state.groupThird);
      const fromGroup = assignment[slot.winnerGroup];
      return fromGroup ? state.groupThird[fromGroup] || null : null;
    }
    if (slot.type === "winner") return state.winners[slot.matchId] || null;
    return null;
  }

  function getMatchTeams(matchId) {
    const m = matchMap[matchId];
    if (!m) return { home: null, away: null };
    return { home: resolveSlot(m.home), away: resolveSlot(m.away) };
  }

  /* ── Cascade-clear downstream picks ────────────────────────── */
  function clearDownstream(fromMatchId) {
    const m = matchMap[fromMatchId];
    if (!m?.advance) return;
    if (m.advance.match === "champion") { state.champion = null; return; }

    const queue = [m.advance.match];
    while (queue.length) {
      const id = queue.shift();
      delete state.winners[id];
      const next = matchMap[id];
      if (next?.advance) {
        if (next.advance.match === "champion") state.champion = null;
        else queue.push(next.advance.match);
      }
    }
  }

  function invalidateBracket() {
    state.winners  = {};
    state.champion = null;
  }

  /* ── Winner selection ───────────────────────────────────────── */
  function setWinner(matchId, team) {
    const { home, away } = getMatchTeams(matchId);
    if (!home || !away || (team !== home && team !== away)) return;

    const prev = state.winners[matchId];
    if (prev && prev !== team) clearDownstream(matchId);

    state.winners[matchId] = team;

    const m = matchMap[matchId];
    if (m.advance?.match === "champion") state.champion = team;

    renderBracket();
    saveState();
  }

  /* ── Match-card HTML ────────────────────────────────────────── */
  function teamBtnHtml(team, slotDef, matchId, winner, ready) {
    const ph  = slotLabel(slotDef);
    const iso = team ? teamFlagIso(team) : "";

    const cls = ["match-team",
      !team       ? "is-tbd"    : "",
      winner && winner === team         ? "is-winner" : "",
      winner && winner !== team && team ? "is-loser"  : "",
    ].filter(Boolean).join(" ");

    const flagHtml = iso
      ? `<img class="flag-svg" src="${FLAG_CDN}/${iso}.svg" alt="" width="20" height="15" loading="lazy">`
      : `<span class="flag-empty"></span>`;

    return `<button type="button" class="${cls}"
      data-match="${matchId}" data-team="${team || ""}"
      ${!ready || !team ? "disabled" : ""}
    >${flagHtml}<span class="team-name">${team || ph}</span></button>`;
  }

  function matchCardHtml(matchId) {
    const m = matchMap[matchId];
    const { home, away } = getMatchTeams(matchId);
    const winner = state.winners[matchId];
    const ready  = Boolean(home && away);
    const extra  = m.round === "final" ? " match-card--final" : "";

    return `<div class="match-card${extra}" data-match="${matchId}">
      ${teamBtnHtml(home, m.home, matchId, winner, ready)}
      ${teamBtnHtml(away, m.away, matchId, winner, ready)}
    </div>`;
  }

  /* ── Bracket HTML ───────────────────────────────────────────── */
  function slotHtml(matchId) {
    return `<div class="bracket-slot">${matchCardHtml(matchId)}</div>`;
  }

  function pairHtml(pair) {
    if (pair.length === 1) return slotHtml(pair[0]);
    return `<div class="bracket-pair">${pair.map(slotHtml).join("")}</div>`;
  }

  function colHtml(roundData) {
    const { round, pairs } = roundData;
    return `<div class="bracket-col ${round}-col">
      <div class="col-title">${ROUND_LABELS[round] || round}</div>
      <div class="col-matches">${pairs.map(pairHtml).join("")}</div>
    </div>`;
  }

  function groupTeamBtnHtml(groupKey, team) {
    const iso = teamFlagIso(team);
    const first = state.groupFirst[groupKey];
    const second = state.groupSecond[groupKey];
    const third = state.groupThird[groupKey];
    const ranksSet = Boolean(first && second && third);
    let rankClass = "";
    let badge = "";

    if (first === team) {
      rankClass = "is-first";
      badge = '<span class="rank-badge rank-badge--emoji">🥇</span>';
    } else if (second === team) {
      rankClass = "is-second";
      badge = '<span class="rank-badge rank-badge--emoji">🥈</span>';
    } else if (third === team) {
      rankClass = "is-third";
      badge = '<span class="rank-badge rank-badge--emoji">🥉</span>';
    } else if (ranksSet) {
      rankClass = "is-muted";
    }

    return `<button type="button" class="group-team-btn ${rankClass}"
      data-group="${groupKey}" data-team="${team}"
    >
      <img class="flag-svg" src="${FLAG_CDN}/${iso}.svg" alt="" width="22" height="16" loading="lazy">
      <span class="group-team-name">${team}</span>
      ${badge}
    </button>`;
  }

  function renderGroups() {
    if (!groupsGrid) return;
    groupsGrid.innerHTML = GROUP_KEYS.map((groupKey) => {
      const teams = GROUPS[groupKey];
      return `<div class="group-card" data-group="${groupKey}">
        <h3 class="group-card-title">Group ${groupKey}</h3>
        <div class="group-card-teams">${teams.map((t) => groupTeamBtnHtml(groupKey, t)).join("")}</div>
      </div>`;
    }).join("");

    groupsGrid.querySelectorAll(".group-team-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const { group, team } = btn.dataset;
        setGroupTeamRank(group, team);
      });
    });
  }

  function setGroupTeamRank(groupKey, team) {
    const first = state.groupFirst[groupKey];
    const second = state.groupSecond[groupKey];
    const third = state.groupThird[groupKey];

    if (first === team) {
      delete state.groupFirst[groupKey];
    } else if (second === team) {
      delete state.groupSecond[groupKey];
    } else if (third === team) {
      delete state.groupThird[groupKey];
    } else if (!first) {
      state.groupFirst[groupKey] = team;
    } else if (!second) {
      state.groupSecond[groupKey] = team;
    } else if (!third) {
      state.groupThird[groupKey] = team;
    } else {
      state.groupThird[groupKey] = team;
    }

    invalidateBracket();
    renderGroups();
    renderBracket();
    saveState();
  }

  function bindBracketEvents() {
    bracketEl.querySelectorAll(".match-team:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", () => {
        const { match: matchId, team } = btn.dataset;
        if (team) setWinner(matchId, team);
      });
    });
  }

  function renderBracket() {
    const leftHtml  = LEFT_BRACKET_ROUNDS.map(colHtml).join("");
    const rightHtml = RIGHT_BRACKET_ROUNDS.map(colHtml).join("");

    bracketEl.innerHTML = `
      <div class="bracket-half bracket-left">${leftHtml}</div>
      <div class="bracket-center">
        <div class="col-title">Final</div>
        <div class="col-matches final-matches">
          <div id="champion-display" class="champion-display"></div>
          <div class="final-card-wrap">${matchCardHtml("final")}</div>
        </div>
      </div>
      <div class="bracket-half bracket-right">${rightHtml}</div>`;

    bindBracketEvents();
    renderChampion();
  }

  /* ── Champion display ───────────────────────────────────────── */
  function renderChampion() {
    const el = document.getElementById("champion-display");
    if (!el) return;

    if (state.champion) {
      const iso = teamFlagIso(state.champion);
      const flag = iso
        ? `<img class="flag-svg flag-champ" src="${FLAG_CDN}/${iso}.svg" alt="" width="72" height="54" loading="lazy">`
        : "";
      el.innerHTML = `
        <div class="champion-box champion-box--active">
          <span class="champion-trophy" aria-hidden="true">🏆</span>
          <span class="champion-label">2026 World Champion</span>
          ${flag}
          <div class="champion-name">${state.champion}</div>
        </div>`;
    } else {
      el.innerHTML = `
        <div class="champion-box">
          <span class="champion-trophy" aria-hidden="true">🏆</span>
          <span class="champion-label">2026 World Champion</span>
          <div class="champion-placeholder">Pick a Final winner</div>
        </div>`;
    }
  }

  /* ── Rankings ───────────────────────────────────────────────── */
  function renderRankings() {
    if (!rankingsBody) return;
    rankingsBody.innerHTML = WC_RANKINGS.map((r) => {
      const flag = r.iso
        ? `<img class="flag-svg" src="${FLAG_CDN}/${r.iso}.svg" alt="" width="22" height="16" loading="lazy">`
        : "";
      return `<tr>
        <td class="team-col">${flag}<span>${r.country}</span></td>
        <td class="center">${r.wins || "—"}</td>
        <td class="years-col">${r.winYears}</td>
        <td class="center">${r.seconds || "—"}</td>
        <td class="years-col">${r.secondYears}</td>
        <td class="center">${r.thirds || "—"}</td>
        <td class="years-col">${r.thirdYears}</td>
      </tr>`;
    }).join("");
  }

  /* ── Validation ─────────────────────────────────────────────── */
  function showError(msg) {
    showToast(msg, 4200, true);
  }

  function groupsComplete() {
    return GROUP_KEYS.every((k) =>
      state.groupFirst[k] && state.groupSecond[k] && state.groupThird[k]
    );
  }

  function validate() {
    if (!playerNameInput.value.trim()) {
      showError("Please enter your name before sharing.");
      playerNameInput.focus();
      return false;
    }

    if (!groupsComplete()) {
      showError("Please pick 1st, 2nd, and 3rd place for every group.");
      document.getElementById("section-groups").scrollIntoView({ behavior: "smooth" });
      return false;
    }

    for (const key of GROUP_KEYS) {
      const picks = [state.groupFirst[key], state.groupSecond[key], state.groupThird[key]];
      if (new Set(picks).size !== 3) {
        showError(`Group ${key}: 1st, 2nd, and 3rd must be different teams.`);
        return false;
      }
    }

    const allMatches = BRACKET_MATCHES.map((m) => m.id);
    const missing = allMatches.find((id) => !state.winners[id]);
    if (missing) {
      showError("Please complete every bracket match before sharing.");
      document.getElementById("section-bracket").scrollIntoView({ behavior: "smooth" });
      return false;
    }

    return true;
  }

  /* ── Share screenshot (groups + bracket) ──────────────────────── */
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function inlineFlagImages(root) {
    const imgs = [...root.querySelectorAll("img")];
    await Promise.all(imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      try {
        const resp = await fetch(src);
        if (!resp.ok) return;
        const blob = await resp.blob();
        img.src = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        /* keep remote src as fallback */
      }
    }));
  }

  function buildShareHtmlDocument() {
    const name = escapeHtml((playerNameInput.value.trim() || "?").toUpperCase());
    const stylesHref = new URL("styles.css", window.location.href).href;
    const groupsHtml = groupsGrid.innerHTML;
    const bracketHtml = bracketEl.innerHTML;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WC 2026 Picks — ${name}</title>
  <link rel="stylesheet" href="${stylesHref}">
  <style>
    body { margin: 0; background: #fff; }
    .share-capture { width: 1400px; background: #fff; font-family: "Segoe UI", system-ui, sans-serif; color: #1a2530; }
    .share-capture button { pointer-events: none; cursor: default; }
  </style>
</head>
<body>
  <div class="share-capture">
    <div class="share-capture-header">
      <p class="share-capture-brand">LIND EQUIPMENT</p>
      <h2 class="share-capture-title">FIFA World Cup 2026™</h2>
      <p class="share-capture-subtitle">Tournament Bracket Pool</p>
      <p class="share-capture-name">${name}</p>
    </div>
    <section class="section share-capture-section">
      <h2>Group Stage</h2>
      <div class="groups-grid">${groupsHtml}</div>
    </section>
    <section class="section bracket-section share-capture-section share-capture-bracket">
      <h2>Tournament Bracket</h2>
      <div class="bracket-scroll">
        <div class="bracket-wrapper">${bracketHtml}</div>
      </div>
    </section>
  </div>
</body>
</html>`;
  }

  async function waitForShareDocument(doc) {
    const link = doc.querySelector('link[rel="stylesheet"]');
    if (link && !link.sheet) {
      await new Promise((resolve) => {
        link.addEventListener("load", resolve, { once: true });
        link.addEventListener("error", resolve, { once: true });
      });
    }
    if (doc.fonts?.ready) await doc.fonts.ready;
  }

  async function captureShareDocument() {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;left:-10000px;top:0;border:0;visibility:hidden;";
    document.body.appendChild(iframe);

    const loaded = new Promise((resolve) => {
      iframe.addEventListener("load", resolve, { once: true });
    });
    iframe.srcdoc = buildShareHtmlDocument();
    await loaded;

    const doc = iframe.contentDocument;
    const root = doc.body;
    iframe.style.width = "1400px";
    iframe.style.height = `${root.scrollHeight}px`;

    await waitForShareDocument(doc);
    await inlineFlagImages(root);
    await new Promise((r) => setTimeout(r, 150));
    iframe.style.height = `${root.scrollHeight}px`;

    try {
      return await html2canvas(root, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        width: root.scrollWidth,
        height: root.scrollHeight,
        windowWidth: root.scrollWidth,
        windowHeight: root.scrollHeight,
      });
    } finally {
      iframe.remove();
    }
  }

  function showToast(msg, duration = 3200, isError = false) {
    toast.textContent = msg;
    toast.classList.toggle("toast--error", isError);
    toast.hidden = false;
    setTimeout(() => {
      toast.hidden = true;
      toast.classList.remove("toast--error");
    }, duration);
  }

  async function doShare() {
    if (!validate()) return;

    try {
      const canvas = await captureShareDocument();

      const link = document.createElement("a");
      link.download = `wc2026-${(playerNameInput.value.trim() || "picks").replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      showToast("Screenshot saved!");
    } catch {
      showToast("Could not capture screenshot. Please try again.", 4200, true);
    }
  }

  /* ── Init ───────────────────────────────────────────────────── */
  shareBtn.addEventListener("click", doShare);
  playerNameInput.addEventListener("input", saveState);
  loadState();
  renderGroups();
  renderBracket();
  renderRankings();
})();
