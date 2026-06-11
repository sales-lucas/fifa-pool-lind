(function () {
  const KNOCKOUT_ROUNDS = [
    { id: "qf", label: "Quarter-finalist", count: 8, containerId: "qf-grid", placeholder: "Pick from group winners…" },
    { id: "sf", label: "Semi-finalist", count: 4, containerId: "sf-grid", placeholder: "Pick from quarter-finalists…" },
    { id: "final", label: "Finalist", count: 2, containerId: "final-grid", placeholder: "Pick from semi-finalists…" },
    { id: "champion", label: "Champion", count: 1, containerId: "champion-grid", placeholder: "Pick from finalists…" },
  ];

  const PARENT_ROUND = {
    sf: "qf",
    final: "sf",
    champion: "final",
  };

  const EMPTY_PLACEHOLDERS = {
    qf: "Complete group winners first…",
    sf: "Pick quarter-finalists first…",
    final: "Pick semi-finalists first…",
    champion: "Pick finalists first…",
  };

  const playerNameInput = document.getElementById("player-name");
  const groupsGrid = document.getElementById("groups-grid");
  const shareBtn = document.getElementById("share-btn");
  const errorMessage = document.getElementById("error-message");
  const toast = document.getElementById("toast");
  const shareCard = document.getElementById("share-card");
  const shareCardName = document.getElementById("share-card-name");
  const shareCardDate = document.getElementById("share-card-date");
  const shareGroupsTable = document.querySelector("#share-groups-table tbody");
  const shareKnockoutList = document.getElementById("share-knockout-list");

  function createKnockoutSelect(round, index) {
    const select = document.createElement("select");
    select.dataset.round = `${round.id}-${index}`;
    select.dataset.roundType = round.id;
    select.id = `${round.id}-${index}`;
    select.required = true;
    select.disabled = true;

    select.addEventListener("change", () => {
      select.classList.toggle("has-value", select.value !== "");
      clearValidationUI();
      updateKnockoutCascade(round.id);
    });

    return select;
  }

  function setSelectOptions(select, teams, placeholder) {
    const current = select.value;
    const keepCurrent = current && teams.includes(current);

    select.innerHTML = "";

    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = placeholder;
    empty.disabled = true;
    empty.selected = !keepCurrent;
    select.appendChild(empty);

    teams.forEach((team) => {
      const option = document.createElement("option");
      option.value = team;
      option.textContent = teamLabel(team);
      if (team === current) option.selected = true;
      select.appendChild(option);
    });

    if (keepCurrent) {
      select.value = current;
      select.classList.add("has-value");
    } else {
      select.value = "";
      select.classList.remove("has-value");
    }

    select.disabled = teams.length === 0;
  }

  function getGroupWinners() {
    return GROUP_KEYS.map((key) => {
      const select = document.querySelector(`select[data-group="${key}"]`);
      return select ? select.value : "";
    }).filter(Boolean);
  }

  function getRoundSelections(roundId) {
    return Array.from(document.querySelectorAll(`[data-round-type="${roundId}"]`)).map(
      (select) => select.value
    );
  }

  function getKnockoutPool(roundId) {
    if (roundId === "qf") {
      return [...new Set(getGroupWinners())].sort((a, b) => a.localeCompare(b));
    }

    const parentRound = PARENT_ROUND[roundId];
    const parentSelections = getRoundSelections(parentRound).filter(Boolean);
    return [...new Set(parentSelections)].sort((a, b) => a.localeCompare(b));
  }

  function getOptionsForSelect(roundId, select) {
    const pool = getKnockoutPool(roundId);
    const taken = Array.from(document.querySelectorAll(`[data-round-type="${roundId}"]`))
      .filter((el) => el !== select && el.value)
      .map((el) => el.value);

    return pool.filter((team) => !taken.includes(team));
  }

  function updateRoundSelects(roundId, startFromRoundId) {
    const round = KNOCKOUT_ROUNDS.find((r) => r.id === roundId);
    if (!round) return;

    const pool = getKnockoutPool(roundId);
    const placeholder = pool.length > 0 ? round.placeholder : EMPTY_PLACEHOLDERS[roundId];

    document.querySelectorAll(`[data-round-type="${roundId}"]`).forEach((select) => {
      setSelectOptions(select, getOptionsForSelect(roundId, select), placeholder);
    });
  }

  function updateKnockoutCascade(changedRoundId) {
    const roundOrder = ["qf", "sf", "final", "champion"];
    const startIndex = changedRoundId ? roundOrder.indexOf(changedRoundId) : 0;

    for (let i = Math.max(0, startIndex); i < roundOrder.length; i++) {
      updateRoundSelects(roundOrder[i]);
    }
  }

  function renderGroups() {
    GROUP_KEYS.forEach((groupKey) => {
      const card = document.createElement("div");
      card.className = "group-card";
      card.dataset.group = groupKey;

      const label = document.createElement("div");
      label.className = "group-label";
      label.textContent = `Group ${groupKey}`;

      const field = document.createElement("div");
      field.className = "pick-field";

      const fieldLabel = document.createElement("label");
      fieldLabel.textContent = "Winner ";
      const req = document.createElement("span");
      req.className = "required-mark";
      req.textContent = "*";
      fieldLabel.appendChild(req);

      const select = document.createElement("select");
      select.dataset.group = groupKey;
      select.required = true;

      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "Pick winner…";
      empty.disabled = true;
      empty.selected = true;
      select.appendChild(empty);

      GROUPS[groupKey].forEach((team) => {
        const option = document.createElement("option");
        option.value = team;
        option.textContent = teamLabel(team);
        select.appendChild(option);
      });

      select.addEventListener("change", () => {
        select.classList.toggle("has-value", select.value !== "");
        clearValidationUI();
        updateKnockoutCascade("qf");
      });

      field.append(fieldLabel, select);
      card.append(label, field);
      groupsGrid.appendChild(card);
    });
  }

  function renderKnockout() {
    KNOCKOUT_ROUNDS.forEach((round) => {
      const container = document.getElementById(round.containerId);

      for (let i = 1; i <= round.count; i++) {
        const field = document.createElement("div");
        field.className = "pick-field";

        const label = document.createElement("label");
        label.setAttribute("for", `${round.id}-${i}`);
        label.append(`${round.label} ${i} `);
        const req = document.createElement("span");
        req.className = "required-mark";
        req.textContent = "*";
        label.appendChild(req);

        const select = createKnockoutSelect(round, i);
        setSelectOptions(select, [], EMPTY_PLACEHOLDERS[round.id]);

        field.append(label, select);
        container.appendChild(field);
      }
    });
  }

  function getGroupSelections() {
    const selections = {};
    document.querySelectorAll("select[data-group]").forEach((select) => {
      selections[select.dataset.group] = select.value;
    });
    return selections;
  }

  function clearValidationUI() {
    errorMessage.hidden = true;
    errorMessage.textContent = "";
    playerNameInput.classList.remove("invalid");
    document.querySelectorAll(".group-card.invalid, select.invalid").forEach((el) => {
      el.classList.remove("invalid");
    });
  }

  function markInvalid(element) {
    if (!element) return;
    if (element.tagName === "SELECT") {
      element.classList.add("invalid");
      const card = element.closest(".group-card");
      if (card) card.classList.add("invalid");
    } else {
      element.classList.add("invalid");
    }
  }

  function hasDuplicates(values) {
    const filled = values.filter(Boolean);
    return new Set(filled).size !== filled.length;
  }

  function validate() {
    clearValidationUI();
    let firstInvalid = null;
    let missingCount = 0;

    const name = playerNameInput.value.trim();
    if (!name) {
      markInvalid(playerNameInput);
      firstInvalid = playerNameInput;
      showError("Please enter your name.");
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      return null;
    }

    const groupSelections = getGroupSelections();
    for (const groupKey of GROUP_KEYS) {
      const select = document.querySelector(`select[data-group="${groupKey}"]`);
      if (!groupSelections[groupKey]) {
        markInvalid(select);
        missingCount += 1;
        if (!firstInvalid) firstInvalid = select;
      }
    }

    const groupWinners = getGroupWinners();
    if (groupWinners.length < GROUP_KEYS.length) {
      if (!firstInvalid) {
        showError("Complete all group winners before filling in the knockout round.");
        document.getElementById("section-groups").scrollIntoView({ behavior: "smooth", block: "start" });
        return null;
      }
    }

    const allKnockoutSelects = document.querySelectorAll("[data-round-type]");
    allKnockoutSelects.forEach((select) => {
      if (!select.value) {
        markInvalid(select);
        missingCount += 1;
        if (!firstInvalid) firstInvalid = select;
      }
    });

    if (firstInvalid) {
      showError(`Please select all picks — ${missingCount} remaining.`);
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      return null;
    }

    const qf = getRoundSelections("qf");
    const sf = getRoundSelections("sf");
    const final = getRoundSelections("final");
    const champion = getRoundSelections("champion");
    const groupWinnerSet = new Set(groupWinners);

    if (qf.some((team) => !groupWinnerSet.has(team))) {
      showError("Quarter-finalists must be chosen from your group winners.");
      return null;
    }

    if (hasDuplicates(qf)) {
      showError("Quarter-finalists must all be different teams.");
      return null;
    }

    if (hasDuplicates(sf)) {
      showError("Semi-finalists must all be different teams.");
      return null;
    }

    if (hasDuplicates(final)) {
      showError("Finalists must be two different teams.");
      return null;
    }

    const qfSet = new Set(qf);
    const invalidSf = sf.find((team) => !qfSet.has(team));
    if (invalidSf) {
      showError("Each semi-finalist must be one of your quarter-finalists.");
      return null;
    }

    const sfSet = new Set(sf);
    const invalidFinal = final.find((team) => !sfSet.has(team));
    if (invalidFinal) {
      showError("Each finalist must be one of your semi-finalists.");
      return null;
    }

    const finalSet = new Set(final);
    if (!finalSet.has(champion[0])) {
      showError("Champion must be one of your two finalists.");
      return null;
    }

    return {
      name,
      groups: groupSelections,
      qf,
      sf,
      final,
      champion: champion[0],
    };
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    setTimeout(() => {
      toast.hidden = true;
    }, 3500);
  }

  function sanitizeFilename(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "player";
  }

  function buildShareCard(data) {
    shareCardName.textContent = data.name;
    shareCardDate.textContent = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    shareGroupsTable.innerHTML = "";
    GROUP_KEYS.forEach((key) => {
      const row = document.createElement("tr");
      const teamCell = document.createElement("td");
      teamCell.textContent = teamLabel(data.groups[key]);
      row.innerHTML = `<td>${key}</td>`;
      row.appendChild(teamCell);
      shareGroupsTable.appendChild(row);
    });

    shareKnockoutList.innerHTML = "";

    const sections = [
      { title: "Quarter-finalists", items: data.qf },
      { title: "Semi-finalists", items: data.sf },
      { title: "Finalists", items: data.final },
      { title: "Champion", items: [data.champion], isChampion: true },
    ];

    sections.forEach(({ title, items, isChampion }) => {
      const block = document.createElement("div");
      block.className = "share-knockout-section" + (isChampion ? " champion" : "");

      const heading = document.createElement("h4");
      heading.textContent = title;

      const list = document.createElement("ul");
      items.forEach((team) => {
        const li = document.createElement("li");
        li.textContent = teamLabel(team);
        list.appendChild(li);
      });

      block.append(heading, list);
      shareKnockoutList.appendChild(block);
    });
  }

  async function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function shareScreenshot(blob, filename, data) {
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: "image/png" })] })) {
      try {
        const file = new File([blob], filename, { type: "image/png" });
        await navigator.share({
          title: `2026 FIFA World Cup Pool — ${data.name}`,
          text: "My World Cup picks",
          files: [file],
        });
        return true;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Native share failed, falling back to download.", err);
        }
      }
    }
    return false;
  }

  async function handleShare() {
    const data = validate();
    if (!data) return;

    shareBtn.disabled = true;

    try {
      buildShareCard(data);

      const canvas = await html2canvas(shareCard, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const filename = `fifa-pool-${sanitizeFilename(data.name)}.png`;

      const shared = await shareScreenshot(blob, filename, data);
      if (!shared) {
        await downloadBlob(blob, filename);
      }

      showToast(shared
        ? "Screenshot shared — send it to the team!"
        : "Screenshot saved — share it with the team!");
    } catch (err) {
      console.error(err);
      showError("Could not generate screenshot. Please try again.");
    } finally {
      shareBtn.disabled = false;
    }
  }

  renderGroups();
  renderKnockout();
  shareBtn.addEventListener("click", handleShare);
  playerNameInput.addEventListener("input", clearValidationUI);
})();
