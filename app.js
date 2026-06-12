(function () {
  /* ── State ─────────────────────────────────────────────────── */
  const state = {
    groupFirst: {},
    groupSecond: {},
    winners: {},
    champion: null,
  };

  const matchMap = Object.fromEntries(BRACKET_MATCHES.map((m) => [m.id, m]));

  /* ── DOM refs ───────────────────────────────────────────────── */
  const playerNameInput = document.getElementById("player-name");
  const groupsGrid      = document.getElementById("groups-grid");
  const bracketEl       = document.getElementById("bracket");
  const championDisplay = document.getElementById("champion-display");
  const shareBtn        = document.getElementById("share-btn");
  const errorMessage    = document.getElementById("error-message");
  const toast           = document.getElementById("toast");
  const shareCard       = document.getElementById("share-card");
  const rankingsBody    = document.getElementById("rankings-body");

  /* ── Slot resolution ────────────────────────────────────────── */
  function resolveSlot(slot) {
    if (!slot) return null;
    if (slot.type === "group") {
      const picks = slot.position === 1 ? state.groupFirst : state.groupSecond;
      return picks[slot.group] || null;
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
    renderChampion();
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

  function renderBracket() {
    const leftHtml  = LEFT_BRACKET_ROUNDS.map(colHtml).join("");
    const rightHtml = RIGHT_BRACKET_ROUNDS.map(colHtml).join("");

    bracketEl.innerHTML = `
      <div class="bracket-half bracket-left">${leftHtml}</div>
      <div class="bracket-center">
        <div class="col-title">Final</div>
        <div class="col-matches final-matches">${matchCardHtml("final")}</div>
      </div>
      <div class="bracket-half bracket-right">${rightHtml}</div>`;

    bracketEl.querySelectorAll(".match-team:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", () => {
        const { match: matchId, team } = btn.dataset;
        if (team) { setWinner(matchId, team); clearValidationUI(); }
      });
    });
  }

  /* ── Champion display ───────────────────────────────────────── */
  function renderChampion() {
    if (!championDisplay) return;
    if (state.champion) {
      const iso = teamFlagIso(state.champion);
      const flag = iso
        ? `<img class="flag-svg flag-champ" src="${FLAG_CDN}/${iso}.svg" alt="" width="36" height="27" loading="lazy">`
        : "";
      championDisplay.innerHTML = `
        <div class="champion-box champion-box--active">
          <span class="champion-label">🏆 2026 World Champion</span>
          <div class="champion-name">${flag}${state.champion}</div>
        </div>`;
    } else {
      championDisplay.innerHTML = `
        <div class="champion-box">
          <span class="champion-label">🏆 2026 World Champion</span>
          <div class="champion-placeholder">Complete the bracket to reveal your pick</div>
        </div>`;
    }
  }

  /* ── Group-stage rendering ──────────────────────────────────── */
  function createGroupSelect(groupKey, position, value) {
    const sel = document.createElement("select");
    sel.dataset.group    = groupKey;
    sel.dataset.position = position;
    sel.className = "group-select";
    sel.required  = true;

    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = position === 1 ? "1st place…" : "2nd place…";
    defaultOpt.disabled = true;
    defaultOpt.selected = !value;
    sel.appendChild(defaultOpt);

    GROUPS[groupKey].forEach((team) => {
      const opt = document.createElement("option");
      const iso = teamFlagIso(team);
      opt.value = team;
      opt.textContent = team;
      if (team === value) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener("change", () => {
      const chosen = sel.value;
      if (position === 1) state.groupFirst[groupKey]  = chosen;
      else                state.groupSecond[groupKey] = chosen;
      invalidateBracket();
      renderBracket();
      renderChampion();
      clearValidationUI();
    });

    return sel;
  }

  function renderGroups() {
    groupsGrid.innerHTML = "";
    GROUP_KEYS.forEach((key) => {
      const card = document.createElement("div");
      card.className = "group-card";

      const title = document.createElement("h3");
      title.className = "group-title";
      title.textContent = `Group ${key}`;

      const sel1 = createGroupSelect(key, 1, state.groupFirst[key] || "");
      const sel2 = createGroupSelect(key, 2, state.groupSecond[key] || "");

      card.append(title, sel1, sel2);
      groupsGrid.appendChild(card);
    });
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
  function clearValidationUI() {
    errorMessage.hidden = true;
    errorMessage.textContent = "";
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.hidden = false;
    errorMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function groupsComplete() {
    return GROUP_KEYS.every((k) => state.groupFirst[k] && state.groupSecond[k]);
  }

  function validate() {
    clearValidationUI();

    if (!playerNameInput.value.trim()) {
      showError("Please enter your name before sharing.");
      playerNameInput.focus();
      return false;
    }

    if (!groupsComplete()) {
      showError("Please pick 1st and 2nd place for every group.");
      document.getElementById("section-groups").scrollIntoView({ behavior: "smooth" });
      return false;
    }

    for (const key of GROUP_KEYS) {
      if (state.groupFirst[key] === state.groupSecond[key]) {
        showError(`Group ${key}: 1st and 2nd place must be different teams.`);
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

  /* ── Share card + screenshot ────────────────────────────────── */
  function buildShareCard() {
    const name = (playerNameInput.value.trim() || "?").toUpperCase();

    const groupRows = GROUP_KEYS.map((k) => {
      const t1 = state.groupFirst[k]  || "?";
      const t2 = state.groupSecond[k] || "?";
      const iso1 = teamFlagIso(t1), iso2 = teamFlagIso(t2);
      const f1 = iso1 ? `<img class="flag-svg" src="${FLAG_CDN}/${iso1}.svg" alt="" width="18" height="13">` : "";
      const f2 = iso2 ? `<img class="flag-svg" src="${FLAG_CDN}/${iso2}.svg" alt="" width="18" height="13">` : "";
      return `<div class="sc-group-row">
        <span class="sc-group-label">Grp ${k}</span>
        <span class="sc-team">${f1}${t1}</span>
        <span class="sc-sep">/</span>
        <span class="sc-team">${f2}${t2}</span>
      </div>`;
    }).join("");

    const roundOrder = ["r32","r16","qf","sf","final"];
    const roundNames = { r32:"R32", r16:"R16", qf:"QF", sf:"SF", final:"Final" };

    const knockoutRows = roundOrder.map((round) => {
      const matches = BRACKET_MATCHES.filter((m) => m.round === round);
      return matches.map((m) => {
        const w = state.winners[m.id] || "?";
        const iso = teamFlagIso(w);
        const f = iso ? `<img class="flag-svg" src="${FLAG_CDN}/${iso}.svg" alt="" width="18" height="13">` : "";
        return `<div class="sc-ko-row">
          <span class="sc-ko-label">${roundNames[round]}</span>
          <span class="sc-team">${f}${w}</span>
        </div>`;
      }).join("");
    }).join("");

    const champIso = teamFlagIso(state.champion || "?");
    const champFlag = champIso
      ? `<img class="flag-svg" src="${FLAG_CDN}/${champIso}.svg" alt="" width="22" height="16">`
      : "";

    shareCard.innerHTML = `
      <div class="sc-header">
        <span class="sc-brand">LIND EQUIPMENT</span>
        <span class="sc-title">FIFA World Cup 2026™</span>
        <span class="sc-subtitle">Tournament Bracket Pool</span>
      </div>
      <div class="sc-name">${name}</div>
      <div class="sc-body">
        <div class="sc-col">
          <div class="sc-col-title">Group Stage</div>
          ${groupRows}
        </div>
        <div class="sc-col">
          <div class="sc-col-title">Knockout Picks</div>
          ${knockoutRows}
        </div>
      </div>
      <div class="sc-champion">🏆 Champion: ${champFlag}<strong>${state.champion || "?"}</strong></div>`;
  }

  function showToast(msg, duration = 3200) {
    toast.textContent = msg;
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, duration);
  }

  function doShare() {
    if (!validate()) return;
    buildShareCard();

    const wrapper = document.getElementById("share-card-wrapper");
    wrapper.style.display = "block";

    html2canvas(shareCard, { scale: 2, useCORS: true, backgroundColor: "#fff" })
      .then((canvas) => {
        wrapper.style.display = "none";
        const link = document.createElement("a");
        link.download = `wc2026-${(playerNameInput.value.trim() || "picks").replace(/\s+/g, "_")}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        showToast("Screenshot saved!");
      })
      .catch(() => {
        wrapper.style.display = "none";
        showToast("Could not capture screenshot. Please try again.");
      });
  }

  /* ── Init ───────────────────────────────────────────────────── */
  shareBtn.addEventListener("click", doShare);
  renderGroups();
  renderBracket();
  renderChampion();
  renderRankings();
})();
