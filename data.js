const GROUPS = {
  A: ["Mexico", "South Africa", "South Korea", "Czech Republic"],
  B: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
  C: ["Brazil", "Morocco", "Haiti", "Scotland"],
  D: ["United States", "Paraguay", "Australia", "Turkey"],
  E: ["Germany", "Curaçao", "Ivory Coast", "Ecuador"],
  F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Iraq", "Norway"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
  L: ["England", "Croatia", "Ghana", "Panama"],
};

const TEAM_ISO = {
  Mexico: "mx",
  "South Africa": "za",
  "South Korea": "kr",
  "Czech Republic": "cz",
  Canada: "ca",
  "Bosnia and Herzegovina": "ba",
  Qatar: "qa",
  Switzerland: "ch",
  Brazil: "br",
  Morocco: "ma",
  Haiti: "ht",
  Scotland: "gb-sct",
  "United States": "us",
  Paraguay: "py",
  Australia: "au",
  Turkey: "tr",
  Germany: "de",
  Curaçao: "cw",
  "Ivory Coast": "ci",
  Ecuador: "ec",
  Netherlands: "nl",
  Japan: "jp",
  Sweden: "se",
  Tunisia: "tn",
  Belgium: "be",
  Egypt: "eg",
  Iran: "ir",
  "New Zealand": "nz",
  Spain: "es",
  "Cape Verde": "cv",
  "Saudi Arabia": "sa",
  Uruguay: "uy",
  France: "fr",
  Senegal: "sn",
  Iraq: "iq",
  Norway: "no",
  Argentina: "ar",
  Algeria: "dz",
  Austria: "at",
  Jordan: "jo",
  Portugal: "pt",
  "DR Congo": "cd",
  Uzbekistan: "uz",
  Colombia: "co",
  England: "gb-eng",
  Croatia: "hr",
  Ghana: "gh",
  Panama: "pa",
};

const GROUP_KEYS = Object.keys(GROUPS);

const FLAG_CDN = "https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/4x3";

function flagImg(iso, label) {
  if (!iso) return "";
  return `<img class="flag-svg" src="${FLAG_CDN}/${iso}.svg" alt="" width="22" height="16" loading="lazy" aria-hidden="true">`;
}

function teamFlagIso(name) {
  return TEAM_ISO[name] || "";
}

function slotGroup(position, group) {
  return { type: "group", position, group };
}

function slotWinner(matchId) {
  return { type: "winner", matchId };
}

const BRACKET_MATCHES = [
  { id: "r32-1", round: "r32", label: "1st A vs 2nd B", home: slotGroup(1, "A"), away: slotGroup(2, "B"), advance: { match: "r16-1", slot: "home" } },
  { id: "r32-2", round: "r32", label: "1st C vs 2nd D", home: slotGroup(1, "C"), away: slotGroup(2, "D"), advance: { match: "r16-1", slot: "away" } },
  { id: "r32-3", round: "r32", label: "1st E vs 2nd F", home: slotGroup(1, "E"), away: slotGroup(2, "F"), advance: { match: "r16-2", slot: "home" } },
  { id: "r32-4", round: "r32", label: "1st G vs 2nd H", home: slotGroup(1, "G"), away: slotGroup(2, "H"), advance: { match: "r16-2", slot: "away" } },
  { id: "r32-5", round: "r32", label: "1st I vs 2nd J", home: slotGroup(1, "I"), away: slotGroup(2, "J"), advance: { match: "r16-3", slot: "home" } },
  { id: "r32-6", round: "r32", label: "1st K vs 2nd L", home: slotGroup(1, "K"), away: slotGroup(2, "L"), advance: { match: "r16-3", slot: "away" } },
  { id: "r32-7", round: "r32", label: "1st B vs 2nd A", home: slotGroup(1, "B"), away: slotGroup(2, "A"), advance: { match: "r16-4", slot: "home" } },
  { id: "r32-8", round: "r32", label: "1st D vs 2nd C", home: slotGroup(1, "D"), away: slotGroup(2, "C"), advance: { match: "r16-4", slot: "away" } },
  { id: "r32-9", round: "r32", label: "1st F vs 2nd E", home: slotGroup(1, "F"), away: slotGroup(2, "E"), advance: { match: "r16-5", slot: "home" } },
  { id: "r32-10", round: "r32", label: "1st H vs 2nd G", home: slotGroup(1, "H"), away: slotGroup(2, "G"), advance: { match: "r16-5", slot: "away" } },
  { id: "r32-11", round: "r32", label: "1st J vs 2nd I", home: slotGroup(1, "J"), away: slotGroup(2, "I"), advance: { match: "r16-6", slot: "home" } },
  { id: "r32-12", round: "r32", label: "1st L vs 2nd K", home: slotGroup(1, "L"), away: slotGroup(2, "K"), advance: { match: "r16-6", slot: "away" } },
  { id: "r32-13", round: "r32", label: "1st A vs 2nd C", home: slotGroup(1, "A"), away: slotGroup(2, "C"), advance: { match: "r16-7", slot: "home" } },
  { id: "r32-14", round: "r32", label: "1st B vs 2nd D", home: slotGroup(1, "B"), away: slotGroup(2, "D"), advance: { match: "r16-7", slot: "away" } },
  { id: "r32-15", round: "r32", label: "1st E vs 2nd G", home: slotGroup(1, "E"), away: slotGroup(2, "G"), advance: { match: "r16-8", slot: "home" } },
  { id: "r32-16", round: "r32", label: "1st H vs 2nd F", home: slotGroup(1, "H"), away: slotGroup(2, "F"), advance: { match: "r16-8", slot: "away" } },

  { id: "r16-1", round: "r16", home: slotWinner("r32-1"), away: slotWinner("r32-2"), advance: { match: "qf-1", slot: "home" } },
  { id: "r16-2", round: "r16", home: slotWinner("r32-3"), away: slotWinner("r32-4"), advance: { match: "qf-1", slot: "away" } },
  { id: "r16-3", round: "r16", home: slotWinner("r32-5"), away: slotWinner("r32-6"), advance: { match: "qf-2", slot: "home" } },
  { id: "r16-4", round: "r16", home: slotWinner("r32-7"), away: slotWinner("r32-8"), advance: { match: "qf-2", slot: "away" } },
  { id: "r16-5", round: "r16", home: slotWinner("r32-9"), away: slotWinner("r32-10"), advance: { match: "qf-3", slot: "home" } },
  { id: "r16-6", round: "r16", home: slotWinner("r32-11"), away: slotWinner("r32-12"), advance: { match: "qf-3", slot: "away" } },
  { id: "r16-7", round: "r16", home: slotWinner("r32-13"), away: slotWinner("r32-14"), advance: { match: "qf-4", slot: "home" } },
  { id: "r16-8", round: "r16", home: slotWinner("r32-15"), away: slotWinner("r32-16"), advance: { match: "qf-4", slot: "away" } },

  { id: "qf-1", round: "qf", home: slotWinner("r16-1"), away: slotWinner("r16-2"), advance: { match: "sf-1", slot: "home" } },
  { id: "qf-2", round: "qf", home: slotWinner("r16-3"), away: slotWinner("r16-4"), advance: { match: "sf-1", slot: "away" } },
  { id: "qf-3", round: "qf", home: slotWinner("r16-5"), away: slotWinner("r16-6"), advance: { match: "sf-2", slot: "home" } },
  { id: "qf-4", round: "qf", home: slotWinner("r16-7"), away: slotWinner("r16-8"), advance: { match: "sf-2", slot: "away" } },

  { id: "sf-1", round: "sf", label: "Semifinal 1", home: slotWinner("qf-1"), away: slotWinner("qf-2"), advance: { match: "final", slot: "home" } },
  { id: "sf-2", round: "sf", label: "Semifinal 2", home: slotWinner("qf-3"), away: slotWinner("qf-4"), advance: { match: "final", slot: "away" } },

  { id: "final", round: "final", label: "Final", home: slotWinner("sf-1"), away: slotWinner("sf-2"), advance: { match: "champion", slot: "home" } },
];

const ROUND_LABELS = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarterfinals",
  sf: "Semifinals",
  final: "Final",
};

const WC_RANKINGS = [
  { country: "Brazil", iso: "br", wins: 5, winYears: "1958, 1962, 1970, 1994, 2002", seconds: 2, secondYears: "1950, 1998", thirds: 2, thirdYears: "1938, 1978" },
  { country: "Germany", iso: "de", wins: 4, winYears: "1954, 1974, 1990, 2014", seconds: 4, secondYears: "1966, 1982, 1986, 2002", thirds: 4, thirdYears: "1934, 1970, 2006, 2010" },
  { country: "Italy", iso: "it", wins: 4, winYears: "1934, 1938, 1982, 2006", seconds: 2, secondYears: "1970, 1994", thirds: 1, thirdYears: "1990" },
  { country: "Argentina", iso: "ar", wins: 3, winYears: "1978, 1986, 2022", seconds: 3, secondYears: "1930, 1990, 2014", thirds: 0, thirdYears: "—" },
  { country: "France", iso: "fr", wins: 2, winYears: "1998, 2018", seconds: 2, secondYears: "2006, 2022", thirds: 2, thirdYears: "1958, 1986" },
  { country: "Uruguay", iso: "uy", wins: 2, winYears: "1930, 1950", seconds: 0, secondYears: "—", thirds: 0, thirdYears: "—" },
  { country: "England", iso: "gb-eng", wins: 1, winYears: "1966", seconds: 0, secondYears: "—", thirds: 0, thirdYears: "—" },
  { country: "Spain", iso: "es", wins: 1, winYears: "2010", seconds: 0, secondYears: "—", thirds: 0, thirdYears: "—" },
  { country: "Netherlands", iso: "nl", wins: 0, winYears: "—", seconds: 3, secondYears: "1974, 1978, 2010", thirds: 1, thirdYears: "2014" },
  { country: "Czech Republic", iso: "cz", wins: 0, winYears: "—", seconds: 2, secondYears: "1934, 1962", thirds: 0, thirdYears: "—" },
  { country: "Hungary", iso: "hu", wins: 0, winYears: "—", seconds: 2, secondYears: "1938, 1954", thirds: 0, thirdYears: "—" },
  { country: "Croatia", iso: "hr", wins: 0, winYears: "—", seconds: 1, secondYears: "2018", thirds: 2, thirdYears: "1998, 2022" },
  { country: "Sweden", iso: "se", wins: 0, winYears: "—", seconds: 1, secondYears: "1958", thirds: 2, thirdYears: "1950, 1994" },
  { country: "Poland", iso: "pl", wins: 0, winYears: "—", seconds: 0, secondYears: "—", thirds: 2, thirdYears: "1974, 1982" },
  { country: "Belgium", iso: "be", wins: 0, winYears: "—", seconds: 0, secondYears: "—", thirds: 1, thirdYears: "2018" },
  { country: "Portugal", iso: "pt", wins: 0, winYears: "—", seconds: 0, secondYears: "—", thirds: 1, thirdYears: "1966" },
  { country: "Turkey", iso: "tr", wins: 0, winYears: "—", seconds: 0, secondYears: "—", thirds: 1, thirdYears: "2002" },
  { country: "United States", iso: "us", wins: 0, winYears: "—", seconds: 0, secondYears: "—", thirds: 1, thirdYears: "1930" },
  { country: "Chile", iso: "cl", wins: 0, winYears: "—", seconds: 0, secondYears: "—", thirds: 1, thirdYears: "1962" },
];

/* Bracket column definitions — pairs = groups of 2 match IDs that share a vertical connector */
const LEFT_BRACKET_ROUNDS = [
  { round: "r32", pairs: [["r32-1","r32-2"],["r32-3","r32-4"],["r32-5","r32-6"],["r32-7","r32-8"]] },
  { round: "r16", pairs: [["r16-1","r16-2"],["r16-3","r16-4"]] },
  { round: "qf",  pairs: [["qf-1","qf-2"]] },
  { round: "sf",  pairs: [["sf-1"]] },
];

/* Right half columns are ordered left-to-right: SF nearest center, R32 outermost */
const RIGHT_BRACKET_ROUNDS = [
  { round: "sf",  pairs: [["sf-2"]] },
  { round: "qf",  pairs: [["qf-3","qf-4"]] },
  { round: "r16", pairs: [["r16-5","r16-6"],["r16-7","r16-8"]] },
  { round: "r32", pairs: [["r32-9","r32-10"],["r32-11","r32-12"],["r32-13","r32-14"],["r32-15","r32-16"]] },
];

function teamLabel(name) {
  return name || "";
}

function slotLabel(slot) {
  if (slot.type === "group") {
    const pos = slot.position === 1 ? "1st" : "2nd";
    return `${pos} Grp ${slot.group}`;
  }
  return "TBD";
}
