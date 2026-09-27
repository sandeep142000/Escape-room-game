/* ============================================================================
   Verify Me — game engine
   Round selection, timing and scoring. No DOM access in this file.
   ========================================================================== */
(function (global) {
  "use strict";

  var CFG = global.VM_CONFIG;
  var BANK = global.VM_QUESTIONS || [];   // absent when only the escape room is loaded

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function uuid() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  /* Draws the configured mix per category, shuffles the choices, and orders
     the game easiest-first so nobody bounces off question one. */
  function buildRounds() {
    var picked = [];
    Object.keys(CFG.mix).forEach(function (cat) {
      var pool = BANK.filter(function (q) { return q.category === cat; });
      picked = picked.concat(shuffle(pool).slice(0, CFG.mix[cat]));
    });

    // Top up from anything unused if a category is short of questions.
    if (picked.length < CFG.questionsPerGame) {
      var ids = picked.map(function (q) { return q.id; });
      var rest = shuffle(BANK.filter(function (q) { return ids.indexOf(q.id) < 0; }));
      picked = picked.concat(rest.slice(0, CFG.questionsPerGame - picked.length));
    }
    picked = shuffle(picked).slice(0, CFG.questionsPerGame);
    picked.sort(function (a, b) { return a.difficulty - b.difficulty; });

    return picked.map(function (q) {
      var choices = q.choices.map(function (c, i) { return { i: i, t: c.t, correct: !!c.correct }; });
      return {
        q: q,
        choices: q.lock ? choices : shuffle(choices),
        correctIndex: q.choices.findIndex(function (c) { return c.correct; })
      };
    });
  }

  function Game(player) {
    this.id = uuid();
    this.player = player;                  // { name, staffId }
    this.rounds = buildRounds();
    this.responses = [];                   // one entry per question, in order
    this.index = 0;
    this.startedAt = Date.now();
    this.finishedAt = null;
  }

  Game.prototype.current = function () { return this.rounds[this.index]; };
  Game.prototype.isLast = function () { return this.index === this.rounds.length - 1; };

  /* choiceIndex is the position in the shuffled list, or null when time ran out. */
  Game.prototype.record = function (choiceIndex, elapsedMs) {
    var round = this.current();
    var chosen = choiceIndex === null ? null : round.choices[choiceIndex];
    var correct = !!(chosen && chosen.correct);
    var limit = CFG.secondsPerQuestion * 1000;
    var elapsed = Math.max(0, Math.min(elapsedMs, limit));

    var streak = 0;
    for (var i = this.responses.length - 1; i >= 0 && this.responses[i].correct; i--) streak++;

    var pts = 0, speed = 0, bonus = 0;
    if (correct) {
      pts = CFG.points.base;
      speed = Math.round(CFG.points.speedBonus * (1 - elapsed / limit));
      bonus = Math.min(CFG.points.streakCap, CFG.points.streakBonus * streak);
      pts += speed + bonus;
    }

    var response = {
      questionId: round.q.id,
      category: round.q.category,
      chosenId: chosen ? chosen.i : null,      // index into the ORIGINAL choice list
      correct: correct,
      elapsedMs: elapsed,
      points: pts,
      speedBonus: speed,
      streakBonus: bonus,
      streak: correct ? streak + 1 : 0
    };
    this.responses.push(response);
    return response;
  };

  Game.prototype.score = function () {
    return this.responses.reduce(function (s, r) { return s + r.points; }, 0);
  };

  Game.prototype.streak = function () {
    var r = this.responses[this.responses.length - 1];
    return r ? r.streak : 0;
  };

  /* Recomputes everything from the recorded responses rather than trusting any
     running total, so an edited page value can't produce a better result. */
  Game.prototype.result = function () {
    this.finishedAt = this.finishedAt || Date.now();

    var total = this.rounds.length;
    var correct = 0, points = 0, elapsed = 0;
    var bank = {};
    BANK.forEach(function (q) { bank[q.id] = q; });

    this.responses.forEach(function (r) {
      var q = bank[r.questionId];
      var reallyCorrect = !!(q && r.chosenId !== null && q.choices[r.chosenId] && q.choices[r.chosenId].correct);
      if (reallyCorrect) { correct++; points += r.points; }
      elapsed += r.elapsedMs;
    });

    var durationMs = this.finishedAt - this.startedAt;
    return {
      gameId: this.id,
      name: this.player.name,
      staffId: this.player.staffId || "",
      score: points,
      correct: correct,
      incorrect: total - correct,
      total: total,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
      durationMs: durationMs,
      avgResponseMs: total ? Math.round(elapsed / total) : 0,
      startedAt: new Date(this.startedAt).toISOString(),
      completedAt: new Date(this.finishedAt).toISOString(),
      responses: this.responses.map(function (r) {
        return { q: r.questionId, c: r.chosenId, ok: r.correct, ms: r.elapsedMs };
      })
    };
  };

  var RANKS = [
    { min: 95, title: "Identity Guardian",   msg: "Near perfect. You'd stop every one of these in real life." },
    { min: 80, title: "Human Firewall",      msg: "Strong instincts — attackers would get nowhere with you." },
    { min: 60, title: "Sharp Eye",           msg: "Solid. A couple of those were genuinely tricky." },
    { min: 40, title: "Getting There",       msg: "Good start. The ones you missed are the ones worth remembering." },
    { min: 0,  title: "Worth a Rematch",     msg: "These are designed to catch people out — have another go." }
  ];

  function rankFor(accuracy) {
    for (var i = 0; i < RANKS.length; i++) if (accuracy >= RANKS[i].min) return RANKS[i];
    return RANKS[RANKS.length - 1];
  }

  /* Prize order: score, then accuracy, then speed, then who finished first. */
  function compareResults(a, b) {
    return (b.score - a.score)
        || (b.accuracy - a.accuracy)
        || (a.durationMs - b.durationMs)
        || (Date.parse(a.completedAt) - Date.parse(b.completedAt));
  }

  function formatDuration(ms) {
    var s = Math.round(ms / 1000);
    return Math.floor(s / 60) + "m " + String(s % 60).padStart(2, "0") + "s";
  }

  global.VM_ENGINE = {
    Game: Game,
    shuffle: shuffle,
    uuid: uuid,
    rankFor: rankFor,
    compareResults: compareResults,
    formatDuration: formatDuration
  };
})(window);
