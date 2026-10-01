/* ============================================================================
   IDENTITY LOCKDOWN — engine
   Room selection, the overall countdown, lives and scoring. No DOM here.
   ========================================================================== */
(function (global) {
  "use strict";

  var CFG = global.VM_CONFIG.escape;
  var ROOMS = global.IL_ROOMS;
  var ENGINE = global.VM_ENGINE;      // shared shuffle / uuid / formatDuration

  /* Scenarios flagged `di` teach the Digital Identity process itself. Random
     picks alone can leave a run with barely any, so swap rooms over until the
     run hits the configured minimum. Rooms with no `di` scenario are left as
     they are, and the choice within each room stays random. */
  function forceIdentityRooms(rooms) {
    var need = CFG.minIdentityRooms || 0;
    var have = rooms.filter(function (r) { return r.scenario.di; }).length;

    var swappable = ENGINE.shuffle(rooms.filter(function (r) {
      return !r.scenario.di && r.def.scenarios.some(function (s) { return s.di; });
    }));

    for (var i = 0; i < swappable.length && have < need; i++) {
      var pool = swappable[i].def.scenarios.filter(function (s) { return s.di; });
      swappable[i].scenario = ENGINE.shuffle(pool)[0];
      have++;
    }
  }

  function Run(player) {
    this.id = ENGINE.uuid();
    this.player = player;             // { name, staffId }

    // One random scenario per room, so people in the queue can't share answers.
    this.rooms = ROOMS.map(function (room) {
      return {
        def: room,
        scenario: ENGINE.shuffle(room.scenarios)[0]
      };
    });

    forceIdentityRooms(this.rooms);

    this.index = 0;
    this.lives = CFG.lives;
    this.fragments = 0;
    this.results = [];                // one entry per room, in order
    this.startedAt = Date.now();
    this.finishedAt = null;
    this.escaped = false;
    this.outOfTime = false;
  }

  Run.prototype.current = function () { return this.rooms[this.index]; };
  Run.prototype.isLastRoom = function () { return this.index === this.rooms.length - 1; };
  Run.prototype.msLeft = function () {
    return Math.max(0, CFG.totalSeconds * 1000 - (Date.now() - this.startedAt));
  };

  /* Called once per room.
       correct     did they get it right
       elapsedMs   time spent in this room
       perfect     right first time with nothing wrong selected
       usedHint    did they open the hint                                    */
  Run.prototype.settle = function (correct, elapsedMs, perfect, usedHint) {
    var pts = 0, speed = 0, perfectBonus = 0, hintBonus = 0;

    if (correct) {
      pts = CFG.points.base;
      var target = CFG.points.speedTargetSeconds * 1000;
      speed = Math.round(CFG.points.speed * Math.max(0, 1 - elapsedMs / target));
      if (perfect) perfectBonus = CFG.points.perfectRoom;
      if (!usedHint) hintBonus = CFG.points.noHint;
      pts += speed + perfectBonus + hintBonus;
      this.fragments++;
    } else {
      this.lives--;
    }

    var outcome = {
      roomId: this.current().def.id,
      scenarioId: this.current().scenario.id,
      correct: correct,
      perfect: !!perfect,
      usedHint: !!usedHint,
      elapsedMs: elapsedMs,
      points: pts,
      speedBonus: speed,
      perfectBonus: perfectBonus,
      hintBonus: hintBonus
    };
    this.results.push(outcome);
    return outcome;
  };

  Run.prototype.score = function () {
    return this.results.reduce(function (s, r) { return s + r.points; }, 0);
  };

  Run.prototype.isDead = function () { return this.lives <= 0; };

  /* Four distinct endings. "contained" is the common one: every room played,
     lives still in hand, but a fragment short of the key. */
  Run.prototype.outcome = function () {
    if (this.escaped) return "escaped";
    if (this.lives <= 0) return "compromised";
    if (this.outOfTime) return "timeout";
    return "contained";
  };

  Run.prototype.finish = function (escaped, outOfTime) {
    this.finishedAt = Date.now();
    this.escaped = !!escaped;
    this.outOfTime = !!outOfTime;
  };

  /* Recomputed from the recorded room outcomes rather than any running total,
     so an edited page value can't produce a better result. */
  Run.prototype.result = function () {
    if (!this.finishedAt) this.finish(false, false);

    var total = this.rooms.length;
    var correct = 0, points = 0, elapsed = 0;

    this.results.forEach(function (r) {
      if (r.correct) correct++;
      points += r.points;
      elapsed += r.elapsedMs;
    });

    var attempted = this.results.length;

    return {
      gameId: this.id,
      game: "identity-lockdown",
      name: this.player.name,
      staffId: this.player.staffId || "",
      score: points,
      correct: correct,
      incorrect: attempted - correct,
      total: total,
      accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
      lives: Math.max(0, this.lives),
      maxLives: CFG.lives,
      escaped: this.escaped,
      outcome: this.outcome(),
      durationMs: this.finishedAt - this.startedAt,
      avgResponseMs: attempted ? Math.round(elapsed / attempted) : 0,
      startedAt: new Date(this.startedAt).toISOString(),
      completedAt: new Date(this.finishedAt).toISOString(),
      responses: this.results.map(function (r) {
        return { r: r.roomId, s: r.scenarioId, ok: r.correct, ms: r.elapsedMs, p: r.points };
      })
    };
  };

  /* Graded endings for a run that was played out but fell short of the key.
     Reached via the "contained" outcome, so every `min` here sits below
     CFG.escapeAt. */
  var CONTAINED = [
    { min: 3, title: "Human Firewall",   msg: "One more room and you'd have been out. You kept your account." },
    { min: 2, title: "Sharp Eye",        msg: "You held the line on most of it. A couple of those were genuinely nasty." },
    { min: 0, title: "Out by a Whisker", msg: "The attacker got further than you'd like — but you're still standing." }
  ];

  function rankFor(result) {
    var outcome = result.outcome || (result.escaped ? "escaped" : result.lives <= 0 ? "compromised" : "timeout");

    if (outcome === "escaped") {
      return {
        title: "Identity Guardian",
        msg: result.correct >= result.total
          ? "Five rooms, five keys, nothing got past you."
          : "One slip, but you still locked the attacker out."
      };
    }
    if (outcome === "compromised") {
      return { title: "Identity Compromised", msg: "The attacker got in before you secured your account." };
    }
    if (outcome === "timeout") {
      return { title: "Out of Time", msg: "The clock beat you. The attacker was still working." };
    }
    for (var i = 0; i < CONTAINED.length; i++) {
      if (result.correct >= CONTAINED[i].min) return CONTAINED[i];
    }
    return CONTAINED[CONTAINED.length - 1];
  }

  function clock(ms) {
    var s = Math.ceil(ms / 1000);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  global.IL_ENGINE = { Run: Run, rankFor: rankFor, clock: clock };
})(window);
