/* ============================================================================
   Verify Me — configuration
   Edit this file before your event. Nothing here is a secret: everything in
   this file is public once the site is deployed.
   ========================================================================== */
window.VM_CONFIG = {
  /* ------------------------------------------------------------- branding */
  gameName:     "Verify Me",
  tagline:      "Confirming it's really you",
  eventName:    "Cyber Awareness Month",
  serviceDesk:  "the IT Service Desk",
  reportHow:    "the Report Phishing button in Outlook",

  /* ----------------------------------------------------------- game rules */
  questionsPerGame: 10,
  secondsPerQuestion: 25,

  /* Questions drawn per category each game. Must total questionsPerGame. */
  mix: { identity: 3, mfa: 3, phishing: 2, cyber: 2 },

  /* ------------------------------------------- escape room (index.html) */
  escape: {
    name:     "Identity Lockdown",
    subtitle: "Can you secure your identity before the attacker gets in?",
    totalSeconds: 240,       // overall countdown across all five rooms
    lives: 3,

    /* Rooms drawn at random can miss the point of the day, so this many are
       forced to be Digital Identity scenarios. Room 3 always is one. */
    minIdentityRooms: 3,

    /* Key fragments needed to escape. Below five, one slip still gets you out. */
    escapeAt: 4,
    points: {
      base: 100,             // a correct decision
      speed: 40,             // maximum, scaled against speedTarget
      speedTargetSeconds: 48,// matches the 240s budget across five rooms
      perfectRoom: 10,       // right first time, nothing wrong selected
      noHint: 10             // cleared the room without opening the hint
    },

    /* Shown on the result screen so players leave knowing what to do next.
       Set url to the real intranet page before the event; leave it empty and
       the line still shows, just without a link. http/https only. */
    enrol: {
      heading: "No Digital Identity yet?",
      text:    "Setting one up is completely your choice, and it only takes about two minutes.",
      linkLabel: "Create it on the intranet",
      url: ""
    }
  },

  /* --------------------------------------------------------------- points */
  points: {
    base: 100,        // a correct answer
    speedBonus: 50,   // maximum, scaled by time remaining
    streakBonus: 25,  // per consecutive correct answer after the first
    streakCap: 75     // ceiling on the streak bonus, so accuracy still rules
  },

  /* -------------------------------------------------------------- players */
  collectStaffId: false,    // false removes the field entirely
  staffIdRequired: false,   // only applies when collectStaffId is true

  privacyNotice:
    "Your name and game score will be recorded for prize administration " +
    "during Cyber Awareness Month, then deleted. Nothing else is collected.",

  /* -------------------------------------------------------------- storage */
  /* "local"    — scores stay in this browser only. No external service.
     "supabase" — central scores; fill in supabase{} below.
     "webhook"  — POST each result to a Power Automate / Logic App URL.     */
  storage: "supabase",

  supabase: {
    url: "https://qxqucrwgwtgnfoqeuion.supabase.co",   // base only, no /rest/v1
    anonKey: "sb_publishable_kCBxuqUql-0R6v_VytgoQA_nsazfQzA",
    table: "results"
  },

  webhook: {
    url: ""         // "When an HTTP request is received" trigger URL
  },

  /* ----------------------------------------------------------------- host */
  /* How the host dashboard is unlocked. See README > Host access.
     "supabase" — sign in with a Supabase account (the only real auth here).
     "passcode" — a shared passcode. Deters players; does NOT stop anyone who
                  reads the source. Only acceptable in "local" storage mode,
                  where there is nothing to protect but this browser.        */
  hostAuth: "supabase",

  /* Only used when hostAuth is "passcode". Never put anything sensitive here. */
  hostPasscode: "verifyme2026"
};
