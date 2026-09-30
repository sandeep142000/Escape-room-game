/* ============================================================================
   Verify Me — storage adapter
   One interface, three backends. Swap with VM_CONFIG.storage.

     submit(result)   -> Promise<{ ok, duplicate?, error? }>
     canRead()        -> boolean   (is the host allowed to list results?)
     list()           -> Promise<result[]>
     signIn(...)      -> Promise<{ ok, error? }>   (supabase host auth only)
     clear()          -> Promise                   (local only)
   ========================================================================== */
(function (global) {
  "use strict";

  var CFG = global.VM_CONFIG;
  var LOCAL_KEY = "verifyme.results.v1";
  var SENT_KEY = "verifyme.submitted.v1";

  /* --------------------------------------------------------------- helpers */
  function readLocal(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
  }
  function writeLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }   // private browsing, or quota
  }

  /* Stops a double-tap, a refresh or a back-button from creating two entries. */
  function alreadySubmitted(gameId) {
    return readLocal(SENT_KEY).indexOf(gameId) >= 0;
  }
  function markSubmitted(gameId) {
    var sent = readLocal(SENT_KEY);
    sent.push(gameId);
    writeLocal(SENT_KEY, sent.slice(-500));
  }

  /* ----------------------------------------------------------------- local */
  var localAdapter = {
    mode: "local",
    central: false,
    submit: function (result) {
      if (alreadySubmitted(result.gameId)) return Promise.resolve({ ok: true, duplicate: true });
      var all = readLocal(LOCAL_KEY);
      all.push(result);
      var saved = writeLocal(LOCAL_KEY, all.slice(-1000));
      if (saved) markSubmitted(result.gameId);
      return Promise.resolve(saved ? { ok: true } : { ok: false, error: "This browser is blocking storage." });
    },
    canRead: function () { return true; },
    list: function () { return Promise.resolve(readLocal(LOCAL_KEY)); },
    clear: function () {
      localStorage.removeItem(LOCAL_KEY);
      localStorage.removeItem(SENT_KEY);
      return Promise.resolve();
    }
  };

  /* --------------------------------------------------------------- webhook */
  /* Fire-and-forget POST to Power Automate / Logic Apps. Those triggers do not
     return CORS headers, so we cannot read the response — a resolved promise
     means "sent", not "stored". Results are kept locally as well so nothing is
     lost if the flow is down. */
  var webhookAdapter = {
    mode: "webhook",
    central: true,
    submit: function (result) {
      if (alreadySubmitted(result.gameId)) return Promise.resolve({ ok: true, duplicate: true });
      markSubmitted(result.gameId);
      var all = readLocal(LOCAL_KEY); all.push(result); writeLocal(LOCAL_KEY, all.slice(-1000));
      return fetch(CFG.webhook.url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(result)
      }).then(function () { return { ok: true }; })
        .catch(function () { return { ok: false, error: "Could not reach the results service." }; });
    },
    canRead: function () { return true; },   // falls back to this device's copy
    list: function () { return Promise.resolve(readLocal(LOCAL_KEY)); }
  };

  /* -------------------------------------------------------------- supabase */
  /* The anon key is public by design. Row Level Security is what actually
     protects the data: anonymous users may INSERT only, and SELECT is granted
     to the signed-in host account. See README > Supabase setup. */
  var supabaseAdapter = (function () {
    var session = null;   // { access_token } once the host signs in

    function rest(path, options) {
      options = options || {};
      var headers = Object.assign({
        "apikey": CFG.supabase.anonKey,
        "Authorization": "Bearer " + (session ? session.access_token : CFG.supabase.anonKey),
        "Content-Type": "application/json"
      }, options.headers || {});
      return fetch(CFG.supabase.url.replace(/\/$/, "") + path, {
        method: options.method || "GET",
        headers: headers,
        body: options.body
      });
    }

    return {
      mode: "supabase",
      central: true,

      submit: function (result) {
        if (alreadySubmitted(result.gameId)) return Promise.resolve({ ok: true, duplicate: true });
        markSubmitted(result.gameId);
        var all = readLocal(LOCAL_KEY); all.push(result); writeLocal(LOCAL_KEY, all.slice(-1000));

        return rest("/rest/v1/" + CFG.supabase.table, {
          method: "POST",
          headers: { "Prefer": "return=minimal" },
          body: JSON.stringify({
            game_id: result.gameId,
            name: result.name,
            staff_id: result.staffId,
            score: result.score,
            correct: result.correct,
            incorrect: result.incorrect,
            total: result.total,
            accuracy: result.accuracy,
            lives: result.lives == null ? null : result.lives,
            max_lives: result.maxLives == null ? null : result.maxLives,
            escaped: result.escaped == null ? null : result.escaped,
            outcome: result.outcome || null,
            duration_ms: result.durationMs,
            avg_response_ms: result.avgResponseMs,
            started_at: result.startedAt,
            completed_at: result.completedAt,
            responses: result.responses
          })
        }).then(function (r) {
          if (r.status === 409) return { ok: true, duplicate: true };  // unique game_id
          if (!r.ok) return { ok: false, error: "Score service returned " + r.status + "." };
          return { ok: true };
        }).catch(function () {
          return { ok: false, error: "Could not reach the score service." };
        });
      },

      signIn: function (email, password) {
        return rest("/auth/v1/token?grant_type=password", {
          method: "POST",
          body: JSON.stringify({ email: email, password: password })
        }).then(function (r) { return r.json().then(function (b) { return { r: r, b: b }; }); })
          .then(function (x) {
            if (!x.r.ok || !x.b.access_token) return { ok: false, error: x.b.error_description || "Sign-in failed." };
            session = { access_token: x.b.access_token };
            return { ok: true };
          })
          .catch(function () { return { ok: false, error: "Could not reach the sign-in service." }; });
      },

      signOut: function () { session = null; },
      canRead: function () { return !!session; },

      list: function () {
        return rest("/rest/v1/" + CFG.supabase.table + "?select=*")
          .then(function (r) {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
          })
          .then(function (rows) {
            return rows.map(function (row) {
              return {
                gameId: row.game_id, name: row.name, staffId: row.staff_id || "",
                score: row.score, correct: row.correct, incorrect: row.incorrect,
                total: row.total, accuracy: row.accuracy,
                lives: row.lives, maxLives: row.max_lives, escaped: row.escaped,
                outcome: row.outcome,
                durationMs: row.duration_ms, avgResponseMs: row.avg_response_ms,
                startedAt: row.started_at, completedAt: row.completed_at
              };
            });
          });
      },

      /* PostgREST refuses an unfiltered DELETE, hence the always-true filter.
         Needs a delete policy and grant for the authenticated role. */
      clear: function () {
        if (!session) return Promise.reject(new Error("Sign in first."));
        return rest("/rest/v1/" + CFG.supabase.table + "?game_id=not.is.null", {
          method: "DELETE",
          headers: { "Prefer": "return=minimal" }
        }).then(function (r) {
          if (!r.ok) throw new Error("Score service returned " + r.status + ".");
          localStorage.removeItem(LOCAL_KEY);
          localStorage.removeItem(SENT_KEY);
        });
      }
    };
  })();

  var adapters = { local: localAdapter, webhook: webhookAdapter, supabase: supabaseAdapter };
  var chosen = adapters[CFG.storage];

  if (!chosen ||
      (CFG.storage === "supabase" && !(CFG.supabase.url && CFG.supabase.anonKey)) ||
      (CFG.storage === "webhook" && !CFG.webhook.url)) {
    if (CFG.storage !== "local") {
      console.warn("[Verify Me] storage '" + CFG.storage + "' is not configured; falling back to local.");
    }
    chosen = localAdapter;
  }

  global.VM_STORAGE = chosen;
})(window);
