/* ============================================================================
   IDENTITY LOCKDOWN — player experience
   Renders the story, the five rooms, the key assembly and the result.
   Players never see anyone else's score.
   ========================================================================== */
(function (global) {
  "use strict";

  var CFG = global.VM_CONFIG;
  var ESC_CFG = CFG.escape;
  var ROOMS = global.IL_ROOMS;
  var IL = global.IL_ENGINE;
  var ENGINE = global.VM_ENGINE;
  var STORE = global.VM_STORAGE;

  var stage = document.getElementById("stage");
  var hud = document.getElementById("hud");
  var hostBtn = document.getElementById("nav-host");

  var run = null, ticker = null, roomStart = 0, usedHint = false, mistakes = 0, settled = false;

  function escapeAt() {
    return Math.min(ESC_CFG.escapeAt || ROOMS.length, ROOMS.length);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function clean(s) { return String(s == null ? "" : s).trim().replace(/\s+/g, " "); }

  /* Results store one `name`, so a replay prefill has to be split back out. */
  function splitName(name) {
    var parts = clean(name).split(" ");
    return [parts.shift() || "", parts.join(" ")];
  }

  var ICON = {
    heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-4.6-8-10.2A4.8 4.8 0 0 1 12 7a4.8 4.8 0 0 1 8 3.8C20 16.4 12 21 12 21z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    key:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="12" r="4.5"/><path d="M12.5 12H22M18 12v4M21 12v3"/></svg>',
    tick:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M4 12l5 5L20 6"/></svg>',
    target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>'
  };

  /* ------------------------------------------------------------------ HUD */
  function showHud(on) {
    hud.hidden = !on;
    document.body.classList.toggle("playing", on);
  }

  function toTop() { window.scrollTo(0, 0); }

  function paintHud() {
    if (!run) return;
    var left = run.msLeft();
    var secs = left / 1000;
    var cls = secs <= 30 ? "critical" : secs <= 60 ? "warn" : "";

    hud.innerHTML =
      '<div class="clockbox ' + cls + '">' + ICON.clock +
        '<span>' + IL.clock(left) + "</span>" +
        '<span class="sr">' + Math.ceil(secs) + " seconds remaining</span>" +
      "</div>" +
      '<div class="spacer"></div>' +
      '<div class="frags" aria-label="' + run.fragments + ' of 5 key fragments">' +
        ROOMS.map(function (_, i) {
          return '<div class="frag ' + (i < run.fragments ? "got" : "") + '"></div>';
        }).join("") +
      "</div>" +
      '<div class="lives" aria-label="' + run.lives + ' of ' + ESC_CFG.lives + ' lives remaining">' +
        Array.apply(null, { length: ESC_CFG.lives }).map(function (_, i) {
          return '<span class="life ' + (i < run.lives ? "" : "gone") + '">' + ICON.heart + "</span>";
        }).join("") +
      "</div>";
  }

  function startTicker() {
    stopTicker();
    ticker = setInterval(function () {
      paintHud();
      if (run && run.msLeft() <= 0) {
        stopTicker();
        run.finish(run.fragments >= escapeAt(), true);
        renderResult();
      }
    }, 250);
  }
  function stopTicker() { if (ticker) { clearInterval(ticker); ticker = null; } }

  /* ------------------------------------------------------------- sign-in */
  function renderStart(previous) {
    stopTicker();
    showHud(false);

    var prefill = splitName(previous ? previous.name : "");

    stage.innerHTML =
      '<p class="eyebrow">' + esc(CFG.eventName) + "</p>" +
      "<h1>Identity <em>Lockdown</em></h1>" +
      '<p class="lede">' + esc(ESC_CFG.subtitle) + "</p>" +
      '<p class="lede"><b>Five rooms. Three lives. Four minutes.</b></p>' +

      '<div class="field">' +
        '<label for="p-first">First name</label>' +
        '<input type="text" id="p-first" autocomplete="given-name" autocapitalize="words" ' +
          'placeholder="e.g. Alex" maxlength="20" value="' + esc(prefill[0]) + '">' +
      "</div>" +
      '<div class="field">' +
        '<label for="p-last">Last name</label>' +
        '<input type="text" id="p-last" autocomplete="family-name" autocapitalize="words" ' +
          'placeholder="e.g. Taylor" maxlength="20" value="' + esc(prefill[1]) + '">' +
      "</div>" +
      (CFG.collectStaffId ?
        '<div class="field">' +
          '<label for="p-staffid">Staff ID <span class="opt">' +
            (CFG.staffIdRequired ? "" : "(optional)") + "</span></label>" +
          '<input type="text" id="p-staffid" autocapitalize="characters" ' +
            'placeholder="For prize verification" maxlength="20" value="' + esc(previous ? previous.staffId : "") + '">' +
        "</div>" : "") +
      '<p class="err" id="start-err" hidden role="alert"></p>' +
      '<div class="foot"><button class="big" id="go">Enter the lockdown</button></div>' +

      '<div class="privacy">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
          '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
        "<p>" + esc(CFG.privacyNotice) + "</p>" +
      "</div>";

    var firstInput = document.getElementById("p-first");
    var lastInput = document.getElementById("p-last");
    var staffIdInput = document.getElementById("p-staffid");
    var err = document.getElementById("start-err");

    function begin() {
      var first = clean(firstInput.value);
      var last = clean(lastInput.value);
      // Both names, so the booth can tell apart players who share a first name.
      // Either may be a single letter or initial.
      if (!first) {
        err.textContent = "Enter your first name to start.";
        err.hidden = false; firstInput.focus(); return;
      }
      if (!last) {
        err.textContent = "Enter your last name to start.";
        err.hidden = false; lastInput.focus(); return;
      }
      var staffId = staffIdInput ? staffIdInput.value.trim() : "";
      if (CFG.collectStaffId && CFG.staffIdRequired && !staffId) {
        err.textContent = "Enter your staff ID to start."; err.hidden = false; staffIdInput.focus(); return;
      }
      // Stored as one field so the leaderboard, export and database are unchanged.
      renderIntro({ name: first + " " + last, staffId: staffId });
    }

    document.getElementById("go").onclick = begin;
    [firstInput, lastInput, staffIdInput].forEach(function (i) {
      if (i) i.addEventListener("keydown", function (e) { if (e.key === "Enter") begin(); });
    });
    firstInput.focus();
  }

  /* --------------------------------------------------------------- intro */
  function renderIntro(player) {
    showHud(false);

    stage.innerHTML =
      '<p class="eyebrow">Mission briefing</p>' +
      '<div class="story">Your phone is gone. Your MFA is gone.<br>' +
        "<b>Someone is trying to get into your account.</b></div>" +
      '<p class="lede">Can you prove it&#8217;s really you?</p>' +

      '<div class="mission">' +
        "<div><b>5 rooms</b>Clear " + escapeAt() + " to escape.</div>" +
        "<div><b>3 lives</b>A bad call costs one.</div>" +
        "<div><b>4 minutes</b>The clock never stops.</div>" +
      "</div>" +

      roomMap() +
      '<div class="foot"><button class="big" id="begin">Start the clock</button></div>';

    document.getElementById("begin").onclick = function () {
      run = new IL.Run(player);
      showHud(true);
      startTicker();
      renderRoom();
    };
    document.getElementById("begin").focus();
  }

  function roomMap() {
    return '<ul class="map">' + ROOMS.map(function (r, i) {
      return "<li>" +
        '<span class="dot">' + (i + 1) + "</span>" +
        '<span class="nm">' + esc(r.title) + "</span>" +
      "</li>";
    }).join("") + "</ul>";
  }

  /* ---------------------------------------------------------------- rooms */
  function renderRoom() {
    usedHint = false;
    mistakes = 0;
    settled = false;
    roomStart = Date.now();

    var room = run.current();
    var def = room.def, sc = room.scenario;

    stage.innerHTML =
      '<div class="roomhead">' +
        '<p class="roomno">Room ' + (run.index + 1) + " of " + ROOMS.length + "</p>" +
        '<h2 class="roomtitle">' + esc(def.title) + "</h2>" +
        '<p class="roomtask">' + ICON.target + "<span>" + esc(def.task) + "</span></p>" +
      "</div>" +
      '<div class="brief">' + esc(sc.brief) + "</div>" +
      '<div id="play"></div>' +
      '<div id="slot"></div>';

    ({
      choice: renderChoice,
      multiselect: renderMultiselect,
      order: renderOrder,
      hunt: renderHunt
    })[def.type](sc);

    addHint(sc);
    paintHud();
    toTop();
  }

  function addHint(sc) {
    if (!sc.hint) return;
    var wrap = document.createElement("div");
    wrap.id = "hintwrap";
    wrap.innerHTML = '<button class="hintbtn" id="hintbtn">Need a hint? (costs 10 pts)</button>';
    document.getElementById("play").appendChild(wrap);

    document.getElementById("hintbtn").onclick = function () {
      usedHint = true;
      wrap.innerHTML = '<div class="hinttext">' + esc(sc.hint) + "</div>";
    };
  }

  /* --- room type: tap the safest action ---------------------------------- */
  function renderChoice(sc) {
    var options = ENGINE.shuffle(sc.options.map(function (o, i) {
      return { i: i, t: o.t, correct: !!o.correct };
    }));

    document.getElementById("play").innerHTML =
      (sc.mock ? '<div class="screen">' + sc.mock + "</div>" : "") +
      '<div class="answers" id="opts">' +
        options.map(function (o, i) {
          return '<button class="ans" data-i="' + i + '">' +
                   "<kbd>" + (i + 1) + "</kbd><span>" + esc(o.t) + "</span>" +
                   '<span class="mark" aria-hidden="true"></span></button>';
        }).join("") +
      "</div>";

    Array.prototype.forEach.call(stage.querySelectorAll("#opts .ans"), function (b) {
      b.onclick = function () {
        var picked = options[parseInt(b.dataset.i, 10)];
        Array.prototype.forEach.call(stage.querySelectorAll("#opts .ans"), function (other, j) {
          other.disabled = true;
          if (options[j].correct) {
            other.classList.add("is-right");
            other.querySelector(".mark").textContent = "\u2713";
            other.insertAdjacentHTML("beforeend", '<span class="sr">Safest action</span>');
          } else if (other === b) {
            other.classList.add("is-wrong");
            other.querySelector(".mark").textContent = "\u2717";
            other.insertAdjacentHTML("beforeend", '<span class="sr">Your answer, unsafe</span>');
          }
        });
        finishRoom(picked.correct, sc.why);
      };
    });
  }

  /* --- room type: tap every suspicious message --------------------------- */
  function renderMultiselect(sc) {
    var msgs = ENGINE.shuffle(sc.messages.map(function (m, i) { return { i: i, m: m }; }));
    var picked = {};

    document.getElementById("play").innerHTML =
      '<div class="msgs" id="msgs">' +
        msgs.map(function (row, i) {
          var m = row.m;
          return '<button class="msg" data-i="' + i + '" aria-pressed="false">' +
            '<span class="from">' +
              '<span class="av" style="background:' + esc(m.colour) + '">' + esc(m.initials) + "</span>" +
              esc(m.from) +
              '<span class="pickmark" aria-hidden="true">\u2713</span>' +
            "</span>" +
            '<span class="txt">' + esc(m.text) + "</span>" +
          "</button>";
        }).join("") +
      "</div>" +
      '<button class="big wide" id="confirm">Confirm</button>';

    Array.prototype.forEach.call(stage.querySelectorAll("#msgs .msg"), function (b) {
      b.onclick = function () {
        var i = b.dataset.i;
        picked[i] = !picked[i];
        b.classList.toggle("picked", picked[i]);
        b.setAttribute("aria-pressed", picked[i] ? "true" : "false");
      };
    });

    document.getElementById("confirm").onclick = function () {
      var right = true;
      Array.prototype.forEach.call(stage.querySelectorAll("#msgs .msg"), function (b, i) {
        var m = msgs[i].m;
        var chose = !!picked[i];
        b.disabled = true;
        b.classList.remove("picked");
        if (m.suspicious && chose) { b.classList.add("right"); }
        else if (m.suspicious && !chose) { b.classList.add("missed"); right = false; }
        else if (!m.suspicious && chose) { b.classList.add("wrong"); right = false; }
        b.insertAdjacentHTML("beforeend",
          '<span class="txt" style="border-top:1px solid var(--line);font-size:13px;color:var(--dim)">' +
          esc(m.why) + "</span>");
      });
      document.getElementById("confirm").remove();
      finishRoom(right, right
        ? "You spotted every one — the giveaway is always what they're asking you to do."
        : "Judge the request, not the sender: nobody legitimate needs your password, your code, or a blind approval.");
    };
  }

  /* --- room type: tap the steps into order -------------------------------- */
  function renderOrder(sc) {
    var correctOrder = sc.steps;
    var pool = ENGINE.shuffle(correctOrder.map(function (t, i) { return { i: i, t: t }; }));
    var placed = [];

    document.getElementById("play").innerHTML =
      '<div class="slots" id="slots"></div>' +
      '<div class="steps-pool" id="pool"></div>' +
      '<div class="foot" style="margin-top:4px">' +
        '<button class="big" id="confirm" disabled>Confirm order</button>' +
        '<button class="big alt" id="undo" disabled>Undo</button>' +
      "</div>";

    function paint() {
      document.getElementById("slots").innerHTML = correctOrder.map(function (_, i) {
        var item = placed[i];
        return '<div class="slot ' + (item ? "filled" : "") + '">' +
          '<span class="idx">' + (i + 1) + "</span>" +
          "<span>" + (item ? esc(item.t) : "Step " + (i + 1)) + "</span></div>";
      }).join("");

      document.getElementById("pool").innerHTML = pool.map(function (p, i) {
        var used = placed.indexOf(p) >= 0;
        return '<button class="step" data-i="' + i + '"' + (used ? " disabled" : "") + ">" +
          "<span>" + esc(p.t) + "</span></button>";
      }).join("");

      Array.prototype.forEach.call(stage.querySelectorAll("#pool .step"), function (b) {
        b.onclick = function () {
          placed.push(pool[parseInt(b.dataset.i, 10)]);
          paint();
        };
      });

      document.getElementById("confirm").disabled = placed.length !== correctOrder.length;
      document.getElementById("undo").disabled = !placed.length;
      document.getElementById("undo").onclick = function () { placed.pop(); mistakes++; paint(); };
      document.getElementById("confirm").onclick = check;
    }

    function check() {
      var right = placed.every(function (p, i) { return p.i === i; });
      document.getElementById("slots").innerHTML = correctOrder.map(function (t, i) {
        var ok = placed[i].i === i;
        return '<div class="slot ' + (ok ? "filled" : "bad") + '">' +
          '<span class="idx">' + (ok ? "\u2713" : i + 1) + "</span>" +
          "<span>" + esc(right ? placed[i].t : t) + "</span>" +
          (ok ? "" : '<span class="sr">Wrong position</span>') + "</div>";
      }).join("");
      document.getElementById("pool").remove();
      stage.querySelector("#play .foot").remove();
      finishRoom(right, sc.why);
    }

    paint();
  }

  /* --- room type: tap every warning sign ---------------------------------- */
  function renderHunt(sc) {
    var found = {};
    var total = sc.clues.length;

    document.getElementById("play").innerHTML =
      '<div class="screen hunt">' + sc.mock + "</div>" +
      '<div class="huntbar"><span id="huntcount">0 of ' + total + " found</span>" +
        '<span class="track"><i id="hunttrack"></i></span></div>' +
      '<button class="big wide" id="confirm">I\u2019ve found them all</button>';

    function bump() {
      var n = Object.keys(found).length;
      document.getElementById("huntcount").textContent = n + " of " + total + " found";
      document.getElementById("hunttrack").style.width = (n / total * 100) + "%";
    }

    function tapped(el, id) {
      if (found[id]) return;
      var real = sc.clues.some(function (c) { return c.id === id; });
      if (real) {
        found[id] = true;
        el.classList.add("found");
        var wrap = el.closest(".clue-wrap");
        if (wrap) wrap.classList.add("found");
        bump();
        if (Object.keys(found).length === total) document.getElementById("confirm").click();
      } else {
        mistakes++;
      }
    }

    Array.prototype.forEach.call(stage.querySelectorAll(".hunt [data-clue]"), function (el) {
      el.onclick = function () { tapped(el, el.dataset.clue); };
      el.onkeydown = function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tapped(el, el.dataset.clue); }
      };
    });

    document.getElementById("confirm").onclick = function () {
      var right = Object.keys(found).length === total;
      Array.prototype.forEach.call(stage.querySelectorAll(".hunt [data-clue]"), function (el) {
        el.disabled = true;
        if (!found[el.dataset.clue] && sc.clues.some(function (c) { return c.id === el.dataset.clue; })) {
          el.classList.add("revealed");
          var wrap = el.closest(".clue-wrap");
          if (wrap) wrap.classList.add("revealed");
        }
      });
      document.getElementById("confirm").remove();

      var list = sc.clues.map(function (c) {
        return (found[c.id] ? "\u2713 " : "\u2717 ") + c.why;
      }).join("<br>");
      finishRoom(right, list);
    };

    bump();
  }

  /* -------------------------------------------------------------- outcome */
  function finishRoom(correct, explanation) {
    if (settled) return;
    settled = true;

    var elapsed = Date.now() - roomStart;
    var perfect = correct && mistakes === 0;
    var outcome = run.settle(correct, elapsed, perfect, usedHint);

    paintHud();
    if (!correct) {
      var lost = hud.querySelector(".life:not(.gone)");
      var all = hud.querySelectorAll(".life");
      if (all[run.lives]) all[run.lives].classList.add("losing");
      void lost;
    }

    var bonuses = [];
    if (outcome.speedBonus) bonuses.push(outcome.speedBonus + " speed");
    if (outcome.perfectBonus) bonuses.push("clean sweep");
    if (outcome.hintBonus) bonuses.push("no hint");

    var dead = run.isDead();
    var last = run.isLastRoom();

    document.getElementById("slot").innerHTML =
      '<div class="outcome" role="status">' +
        '<div class="ohead ' + (correct ? "win" : "lose") + '">' +
          "<span>" + (correct ? "Good call!" : "That could put your account at risk") + "</span>" +
          '<span class="pts">+' + outcome.points + " pts" +
            (bonuses.length ? " &#183; " + bonuses.join(" &#183; ") : "") + "</span>" +
        "</div>" +
        '<div class="obody">' + explanation +
          (correct
            ? '<div class="keyget">' + ICON.key + "Key fragment " + run.fragments + " of 5 secured</div>"
            : '<div class="keyget" style="color:var(--bad)">' + ICON.heart +
              (dead ? "No lives left" : run.lives + " " + (run.lives === 1 ? "life" : "lives") + " remaining") + "</div>") +
        "</div>" +
      "</div>" +
      '<div class="next"><button class="big" id="next">' +
        (dead ? "See what happened" : last ? "Assemble the key" : "Next room") + "</button></div>";

    var next = document.getElementById("next");
    next.onclick = function () {
      if (dead) { stopTicker(); run.finish(false, false); renderResult(); return; }
      if (last) { stopTicker(); run.finish(run.fragments >= escapeAt(), false); renderVault(); return; }
      run.index++;
      renderRoom();
    };
    next.focus();
  }

  /* ----------------------------------------------------- key assembly */
  function renderVault() {
    showHud(false);

    // Fragments are only awarded for rooms you cleared, so a partial run
    // cannot assemble the key.
    if (run.fragments < escapeAt()) { renderResult(); return; }

    stage.innerHTML =
      '<p class="eyebrow">Final door</p>' +
      '<div class="vault">' +
        '<div class="fragrow" id="fragrow"></div>' +
        '<div class="bigkey" id="bigkey">' + ICON.key + "</div>" +
        '<ul class="seq" id="seq">' +
          ["LOCKED", "VERIFYING IDENTITY", "IDENTITY VERIFIED", "ACCOUNT SECURED"].map(function (s) {
            return '<li><span class="tick">' + ICON.tick + "</span>" + s + "</li>";
          }).join("") +
          '<li class="final"><span class="tick">' + ICON.tick + "</span>UNLOCKED</li>" +
        "</ul>" +
      "</div>";

    var row = document.getElementById("fragrow");
    for (var i = 0; i < run.fragments; i++) {
      if (i) row.insertAdjacentHTML("beforeend", '<span class="plus">+</span>');
      row.insertAdjacentHTML("beforeend", '<span class="bigfrag"></span>');
    }
    toTop();

    var pieces = row.querySelectorAll(".bigfrag, .plus");
    var steps = document.querySelectorAll("#seq li");
    var timeline = [];

    pieces.forEach(function (p, i) {
      timeline.push(setTimeout(function () { p.classList.add("in"); }, 120 + i * 130));
    });

    timeline.push(setTimeout(function () {
      row.style.transition = "opacity .4s ease";
      row.style.opacity = ".25";
      document.getElementById("bigkey").classList.add("in");
    }, 120 + pieces.length * 130 + 250));

    var seqStart = 120 + pieces.length * 130 + 900;
    steps.forEach(function (li, i) {
      timeline.push(setTimeout(function () { li.classList.add("on"); }, seqStart + i * 520));
    });

    timeline.push(setTimeout(renderResult, seqStart + steps.length * 520 + 700));
  }

  /* --------------------------------------------------------------- result */
  /* Only http(s) links are rendered, so a mistyped config value can never
     turn into a javascript: URL on the booth laptop. */
  function enrolCta() {
    var c = CFG.escape && CFG.escape.enrol;
    if (!c || !c.heading) return "";

    var href = String(c.url || "").trim();
    var safe = /^https?:\/\//i.test(href);

    return '<div class="enrol">' +
      "<b>" + esc(c.heading) + "</b>" +
      "<p>" + esc(c.text || "") + "</p>" +
      (safe
        ? '<a href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' +
            esc(c.linkLabel || "Find out more") + "</a>"
        : "") +
    "</div>";
  }

  function renderResult() {
    stopTicker();
    showHud(false);

    var result = run.result();
    var rank = IL.rankFor(result);

    var HEAD = {
      escaped:     { cls: "escaped",     text: "IDENTITY<br>SECURED" },
      contained:   { cls: "contained",   text: "ATTACKER<br>CONTAINED" },
      compromised: { cls: "compromised", text: "IDENTITY<br>COMPROMISED" },
      timeout:     { cls: "compromised", text: "OUT OF<br>TIME" }
    };
    var head = HEAD[result.outcome] || HEAD.compromised;
    // Some ranks repeat the headline word for word; show it once.
    var repeatsHead = rank.title.toUpperCase() === head.text.replace("<br>", " ");

    stage.innerHTML =
      '<p class="eyebrow">' + esc(CFG.eventName) + "</p>" +
      '<p class="' + head.cls + '">' + head.text + "</p>" +
      (repeatsHead ? "" : '<div class="rank">' + esc(rank.title) + "</div>") +
      '<p class="rankmsg">' + esc(rank.msg) + "</p>" +

      '<p class="playerplate"><span>Player</span>' + esc(result.name) + "</p>" +
      '<div class="scorewrap" style="margin-top:2px"><p class="score">' +
        result.score + "<small> pts</small></p></div>" +

      '<div class="statrow">' +
        '<div class="stat good"><b>' + result.correct + "/" + result.total + "</b><span>Rooms cleared</span></div>" +
        '<div class="stat"><b>' + result.accuracy + "%</b><span>Accuracy</span></div>" +
        '<div class="stat"><b>' + ENGINE.formatDuration(result.durationMs) + "</b><span>Time</span></div>" +
        '<div class="stat"><div class="livesleft">' +
          Array.apply(null, { length: result.maxLives }).map(function (_, i) {
            return '<span class="life ' + (i < result.lives ? "" : "gone") + '">' + ICON.heart + "</span>";
          }).join("") + "</div><span>Lives left</span></div>" +
      "</div>" +

      '<div class="foot">' +
        '<button class="big" id="lessons">What to remember</button>' +
        '<button class="big alt" id="newplayer">Next player</button>' +
      "</div>";

    toTop();

    STORE.submit(result);

    var player = run.player;
    document.getElementById("lessons").onclick = function () { renderLessons(result, player); };
    document.getElementById("newplayer").onclick = function () { renderStart(null); };
    document.getElementById("lessons").focus();
  }

  /* Second results page, so the score screen itself never needs scrolling. */
  function renderLessons(result, player) {
    stage.innerHTML =
      '<p class="eyebrow">What to remember</p>' +
      '<ul class="takeaways">' +
        '<li><span class="num">1</span><div><b>A Digital Identity proves it&#8217;s really you.</b> ' +
          "Voluntary. Two minutes.</div></li>" +
        '<li><span class="num">2</span><div><b>The real process never asks for documents, codes or passwords.</b> ' +
          "Anything that does is a phish.</div></li>" +
        '<li><span class="num">3</span><div><b>Never approve a prompt you didn&#8217;t start.</b> ' +
          "Never read out a code.</div></li>" +
        '<li><span class="num">4</span><div><b>Verify on a channel they don&#8217;t control.</b> ' +
          "Faces and voices can be faked.</div></li>" +
      "</ul>" +

      enrolCta() +

      '<div class="foot">' +
        '<button class="big" id="again">' + (result.escaped ? "Play again" : "Try again") + "</button>" +
        '<button class="big alt" id="newplayer">Next player</button>' +
      "</div>";

    toTop();

    document.getElementById("again").onclick = function () {
      run = new IL.Run(player);
      showHud(true);
      startTicker();
      renderRoom();
    };
    document.getElementById("newplayer").onclick = function () { renderStart(null); };
    document.getElementById("again").focus();
  }

  /* ------------------------------------------------------------------ host */
  function openHost() {
    stopTicker();
    showHud(false);
    global.VM_HOST.open(stage, function () { renderStart(null); });
  }

  hostBtn.onclick = openHost;

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "h") {
      e.preventDefault(); openHost(); return;
    }
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;

    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4) {
      var btn = stage.querySelector('#opts .ans[data-i="' + (n - 1) + '"]');
      if (btn && !btn.disabled) btn.click();
    }
    if (e.key === "Enter") {
      var next = document.getElementById("next");
      if (next) next.click();
    }
  });

  /* ------------------------------------------------------------------ boot */
  document.getElementById("brand-name").textContent = ESC_CFG.name;
  document.getElementById("brand-sub").textContent = CFG.eventName;

  if ((location.hash || "").toLowerCase() === "#host") openHost();
  else renderStart(null);
})(window);
