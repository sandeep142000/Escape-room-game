/* ============================================================================
   Verify Me — host dashboard
   Reached with #host or Ctrl+Shift+H, and gated by VM_CONFIG.hostAuth.
   Nothing here is ever rendered on a player's result screen.
   ========================================================================== */
(function (global) {
  "use strict";

  var CFG = global.VM_CONFIG;
  var ENGINE = global.VM_ENGINE;
  var STORE = global.VM_STORAGE;
  var XLSX = global.VM_XLSX;

  var unlocked = false;
  var stage = null, onExit = null;
  var rows = [], query = "", sortKey = "rank", sortDir = 1;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* Escape-room runs carry lives and an escaped flag; quiz results don't.
     Rows saved before the four-way outcome existed only have `escaped`. */
  function livesCell(r) {
    return r.lives == null ? "\u2014" : r.lives + "/" + (r.maxLives || 3);
  }
  var OUTCOMES = {
    escaped: "Escaped",
    contained: "Contained",
    compromised: "Compromised",
    timeout: "Out of time"
  };
  function outcomeCell(r) {
    if (r.escaped == null) return "\u2014";
    if (r.outcome) return OUTCOMES[r.outcome] || r.outcome;
    return r.escaped ? "Escaped" : (r.lives <= 0 ? "Compromised" : "Out of time");
  }

  function header() {
    return '<p class="eyebrow">' + esc(CFG.eventName) + "</p>";
  }

  /* ------------------------------------------------------------------- gate */
  function renderGate(message) {
    var supabase = CFG.hostAuth === "supabase";

    stage.innerHTML = header() +
      "<h2>Host dashboard</h2>" +
      '<p class="lede">Scores, rankings and export. Not visible to players.</p>' +
      (supabase ?
        '<div class="field"><label for="h-email">Host email</label>' +
          '<input type="email" id="h-email" autocomplete="username"></div>' +
        '<div class="field"><label for="h-pass">Password</label>' +
          '<input type="password" id="h-pass" autocomplete="current-password"></div>'
        :
        '<div class="field"><label for="h-pass">Host passcode</label>' +
          '<input type="password" id="h-pass" autocomplete="off" inputmode="text"></div>') +
      '<p class="err" id="h-err" role="alert"' + (message ? "" : " hidden") + ">" +
        esc(message || "") + "</p>" +
      '<div class="foot">' +
        '<button class="big" id="h-go">Unlock</button>' +
        '<button class="big alt" id="h-back">Back to the game</button>' +
      "</div>" +
      (supabase ? "" :
        '<p class="tiny" style="margin-top:20px">A passcode keeps players out of the dashboard. ' +
        "It is not a security control &#8212; keep the device with you.</p>");

    var pass = document.getElementById("h-pass");
    var email = document.getElementById("h-email");
    var err = document.getElementById("h-err");

    function attempt() {
      var btn = document.getElementById("h-go");
      if (supabase) {
        btn.disabled = true; btn.textContent = "Signing in\u2026";
        STORE.signIn((email.value || "").trim(), pass.value).then(function (r) {
          btn.disabled = false; btn.textContent = "Unlock";
          if (r.ok) { unlocked = true; load(); }
          else { err.textContent = r.error; err.hidden = false; pass.value = ""; pass.focus(); }
        });
      } else if (pass.value === CFG.hostPasscode) {
        unlocked = true; load();
      } else {
        err.textContent = "That passcode isn\u2019t right.";
        err.hidden = false; pass.value = ""; pass.focus();
      }
    }

    document.getElementById("h-go").onclick = attempt;
    document.getElementById("h-back").onclick = exit;
    [pass, email].forEach(function (i) {
      if (i) i.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
    });
    (email || pass).focus();
  }

  /* ------------------------------------------------------------------- load */
  function load() {
    document.getElementById("nav-host").hidden = false;
    stage.innerHTML = header() + "<h2>Host dashboard</h2><p class=\"lede\">Loading results\u2026</p>";

    STORE.list().then(function (list) {
      rows = list.slice().sort(ENGINE.compareResults);
      rows.forEach(function (r, i) { r.rank = i + 1; });
      render();
    }).catch(function (e) {
      stage.innerHTML = header() + "<h2>Host dashboard</h2>" +
        '<p class="empty">Couldn\u2019t load results: ' + esc(e.message) + "</p>" +
        '<div class="foot"><button class="big alt" id="h-back">Back to the game</button></div>';
      document.getElementById("h-back").onclick = exit;
    });
  }

  /* ------------------------------------------------------------- dashboard */
  function visibleRows() {
    var q = query.trim().toLowerCase();
    var out = q ? rows.filter(function (r) {
      return (r.name || "").toLowerCase().indexOf(q) >= 0 ||
             (r.staffId || "").toLowerCase().indexOf(q) >= 0;
    }) : rows.slice();

    var key = sortKey;
    out.sort(function (a, b) {
      var v;
      if (key === "rank") v = a.rank - b.rank;
      else if (key === "name") v = String(a.name).localeCompare(String(b.name));
      else if (key === "date") v = Date.parse(a.completedAt) - Date.parse(b.completedAt);
      else if (key === "time") v = a.durationMs - b.durationMs;
      else v = (b[key] || 0) - (a[key] || 0);          // score, accuracy: high first
      return v * sortDir;
    });
    return out;
  }

  function avg(field) {
    if (!rows.length) return 0;
    return Math.round(rows.reduce(function (s, r) { return s + (r[field] || 0); }, 0) / rows.length);
  }

  function th(key, label, extra) {
    var active = sortKey === key;
    return '<th class="sortable' + (extra || "") + '" data-sort="' + key + '">' + label +
           (active ? ' <span class="arrow">' + (sortDir === 1 ? "\u25B2" : "\u25BC") + "</span>" : "") + "</th>";
  }

  function render() {
    var list = visibleRows();
    var top = rows.slice(0, 3);
    var best = rows.length ? rows[0].score : 0;

    stage.innerHTML = header() +
      "<h2>Host dashboard</h2>" +
      '<p class="tiny">Players only ever see their own result. This screen is for the booth team.</p>' +

      (rows.length ? (
        '<div class="hostgrid">' +
          '<div class="stat"><b>' + rows.length + "</b><span>Participants</span></div>" +
          '<div class="stat"><b>' + rows.length + "</b><span>Completed games</span></div>" +
          '<div class="stat"><b>' + avg("score") + "</b><span>Average score</span></div>" +
          '<div class="stat good"><b>' + best + "</b><span>Highest score</span></div>" +
          '<div class="stat"><b>' + avg("accuracy") + "%</b><span>Average accuracy</span></div>" +
          '<div class="stat"><b>' + ENGINE.formatDuration(avg("durationMs")) + "</b><span>Average time</span></div>" +
        "</div>" +

        '<h3 class="sub">Leading players</h3>' +
        '<div class="podium">' +
          top.map(function (r, i) {
            return '<div class="pod ' + (i === 0 ? "p1" : "") + '">' +
              '<div class="pos">' + ["\uD83E\uDD47 1st", "\uD83E\uDD48 2nd", "\uD83E\uDD49 3rd"][i] + "</div>" +
              '<div class="who">' + esc(r.name) + "</div>" +
              '<div class="sc">' + r.score + "</div>" +
              '<div class="det">' + r.accuracy + "% &#183; " + ENGINE.formatDuration(r.durationMs) + "</div>" +
            "</div>";
          }).join("") +
        "</div>" +

        '<div class="toolbar">' +
          '<input type="search" id="h-search" placeholder="' +
      (CFG.collectStaffId ? "Search name or staff ID" : "Search name") + '" ' +
            'value="' + esc(query) + '" aria-label="Search players">' +
          '<button class="big alt" id="h-export">Export results</button>' +
        "</div>" +

        '<div class="tablewrap"><table>' +
          "<thead><tr>" +
            th("rank", "#") +
            th("name", "Player") +
            (CFG.collectStaffId ? "<th>Staff ID</th>" : "") +
            th("score", "Score", " n") +
            th("correct", "Correct", " n") +
            th("accuracy", "Accuracy", " n") +
            "<th>Lives</th>" +
            "<th>Outcome</th>" +
            th("time", "Time", " n") +
            "<th>Started</th>" +
            th("date", "Completed") +
          "</tr></thead><tbody>" +
          (list.length ? list.map(function (r) {
            return "<tr>" +
              '<td class="n rankcell">' + r.rank + "</td>" +
              "<td>" + esc(r.name) + "</td>" +
              (CFG.collectStaffId ? "<td>" + esc(r.staffId || "\u2014") + "</td>" : "") +
              '<td class="n">' + r.score + "</td>" +
              '<td class="n">' + r.correct + "/" + r.total + "</td>" +
              '<td class="n">' + r.accuracy + "%</td>" +
              '<td class="n">' + livesCell(r) + "</td>" +
              "<td>" + outcomeCell(r) + "</td>" +
              '<td class="n">' + ENGINE.formatDuration(r.durationMs) + "</td>" +
              "<td>" + new Date(r.startedAt).toLocaleString() + "</td>" +
              "<td>" + new Date(r.completedAt).toLocaleString() + "</td>" +
            "</tr>";
          }).join("") : '<tr><td colspan="11">No players match that search.</td></tr>') +
          "</tbody></table></div>"
      ) : '<p class="empty">No results yet.' +
          (STORE.central ? "" : " Scores are stored on this device only \u2014 see the README to store them centrally.") +
          "</p>") +

      '<div class="foot">' +
        '<button class="big" id="h-back">Back to the game</button>' +
        '<button class="big alt" id="h-refresh">Refresh</button>' +
        (rows.length && STORE.clear ? '<button class="big alt" id="h-clear">Clear results</button>' : "") +
      "</div>" +
      '<p class="tiny" style="margin-top:16px">Ranked by score, then accuracy, then fastest time, ' +
        "then who finished first.</p>";

    var search = document.getElementById("h-search");
    if (search) {
      search.oninput = function () {
        query = search.value;
        var at = search.selectionStart;
        render();
        var again = document.getElementById("h-search");
        again.focus();
        again.setSelectionRange(at, at);
      };
    }

    Array.prototype.forEach.call(stage.querySelectorAll("th.sortable"), function (el) {
      el.onclick = function () {
        var key = el.dataset.sort;
        sortDir = sortKey === key ? -sortDir : 1;
        sortKey = key;
        render();
      };
    });

    var exportBtn = document.getElementById("h-export");
    if (exportBtn) exportBtn.onclick = exportXlsx;

    document.getElementById("h-back").onclick = exit;
    document.getElementById("h-refresh").onclick = load;

    var clearBtn = document.getElementById("h-clear");
    if (clearBtn) clearBtn.onclick = function () {
      var where = STORE.central
        ? "Delete all " + rows.length + " results for everyone, from the central database?"
        : "Delete all results stored on this device?";
      if (!confirm(where + " Export first \u2014 this cannot be undone.")) return;
      clearBtn.disabled = true;
      STORE.clear().then(load).catch(function (e) {
        clearBtn.disabled = false;
        alert("Could not clear results. " + (e && e.message ? e.message : ""));
      });
    };
  }

  /* ----------------------------------------------------------------- export */
  function exportXlsx() {
    var staffId = CFG.collectStaffId;
    var data = [[
      "Rank", "Player Name"
    ].concat(staffId ? ["Staff ID"] : []).concat([
      "Score", "Correct Decisions", "Incorrect Decisions",
      "Accuracy %", "Lives Remaining", "Outcome", "Completion Time",
      "Average Response Time (s)", "Started At", "Completed At"
    ])].concat(rows.map(function (r) {
      return [
        r.rank, r.name
      ].concat(staffId ? [r.staffId || ""] : []).concat([
        r.score, r.correct, r.incorrect, r.accuracy,
        r.lives == null ? "" : r.lives, outcomeCell(r),
        ENGINE.formatDuration(r.durationMs), Number((r.avgResponseMs / 1000).toFixed(1)),
        new Date(r.startedAt).toLocaleString(), new Date(r.completedAt).toLocaleString()
      ]);
    }));

    var date = new Date().toISOString().slice(0, 10);
    XLSX.download("Cyber-Awareness-Identity-Lockdown-Results-" + date + ".xlsx", "Results", data);
  }

  /* ------------------------------------------------------------------- exit */
  function exit() {
    document.getElementById("nav-host").hidden = !unlocked;
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    onExit();
  }

  global.VM_HOST = {
    open: function (stageEl, exitFn) {
      stage = stageEl;
      onExit = exitFn;
      if (unlocked) load(); else renderGate(null);
    }
  };
})(window);
