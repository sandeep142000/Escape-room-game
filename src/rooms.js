/* ============================================================================
   IDENTITY LOCKDOWN — room content
   ----------------------------------------------------------------------------
   All scenario text lives here. No game logic. Add a scenario to any room's
   `scenarios` array and it enters the random rotation immediately.

   Room types
     choice       tap the safest action (one correct option)
     multiselect  tap every suspicious message, then confirm
     order        tap the steps into the correct sequence
     hunt         tap every warning sign in a simulated message

   Digital Identity content follows the published enrolment guidance: privacy
   and consent, photo capture, review with manager confirmation where
   automatic verification cannot complete, then choosing your Microsoft 365
   photo. Participation is voluntary. The fallback for people without a
   Digital Identity is a verification call with the person, their leader and
   the IT Service Desk.

   Keep every scenario short enough to read on a phone without scrolling:
   brief under 20 words, options under 8, one-line `why`, one-line `hint`.

   Every room answers one question: how do you prove it's really you, and
   how does an attacker exploit it when you can't?
     room1  proving it's you when your usual proof is gone
     room2  impostors posing as the people who verify you
     room3  how the real Digital Identity process works
     room4  a phish that imitates that process
     room5  impersonation of someone else — what Digital Identity defends
   ========================================================================== */
window.IL_ROOMS = [

/* ========================================================================== */
{
  id: "room1",
  title: "Lost Phone",
  subtitle: "No phone, no MFA — so how do you prove it's you?",
  type: "choice",
  task: "Tap the safest thing to do.",
  scenarios: [
    {
      id: "r1-recovery",
      brief: "Your phone is gone. You're locked out and can't approve MFA.",
      options: [
        { t: "Call the Service Desk", correct: true },
        { t: "Click the recovery link in that email" },
        { t: "Get a colleague to approve it" },
        { t: "Sign in on a colleague's PC" }
      ],
      why: "Only the Service Desk can safely prove it's you.",
      hint: "Only one proves who you are."
    },
    {
      id: "r1-borrowed",
      brief: "A colleague offers to add their phone to your account.",
      options: [
        { t: "Say no, call the Service Desk", correct: true },
        { t: "Accept — it's only a few days" },
        { t: "Accept, then change your password" },
        { t: "Accept, remove it on Friday" }
      ],
      why: "Anything they approve will look like you did it.",
      hint: "Whose name is on it afterwards?"
    },
    {
      id: "r1-nodi",
      di: true,
      brief: "You have no Digital Identity. How will they check it's you?",
      options: [
        { t: "A call with you and your leader", correct: true },
        { t: "Just give your employee number" },
        { t: "Email a photo of your passport" },
        { t: "Nothing, until you visit an office" }
      ],
      why: "Your leader confirms it's you. It works, it's just slower.",
      hint: "Who already knows your face?"
    },
    {
      id: "r1-consent",
      di: true,
      brief: "Setting up a Digital Identity. First screen: privacy info and consent.",
      options: [
        { t: "Read it, then consent if happy", correct: true },
        { t: "Skip it and take the photo" },
        { t: "Refuse — photos are always a scam" },
        { t: "Ask a colleague to do it" }
      ],
      why: "It's voluntary, and you see what your photo is for first.",
      hint: "That screen is there for a reason."
    },
    {
      id: "r1-notmfa",
      di: true,
      brief: "A colleague says a Digital Identity replaces MFA.",
      options: [
        { t: "Correct them — it never replaces MFA", correct: true },
        { t: "Agree — that's the point of it" },
        { t: "Agree, but keep using MFA" },
        { t: "Tell them to ask the Service Desk" }
      ],
      why: "It proves who you are. MFA still guards every sign-in.",
      hint: "Two different jobs."
    }
  ]
},

/* ========================================================================== */
{
  id: "room2",
  title: "Who Can You Trust?",
  subtitle: "Three messages, all claiming to verify you",
  type: "multiselect",
  task: "Tap every message you should NOT act on, then confirm.",
  scenarios: [
    {
      id: "r2-set-a",
      brief: "Three messages arrive.",
      messages: [
        {
          from: "Cyber Support", initials: "CS", colour: "#B45309",
          text: "Send me the MFA code you just got and I'll unlock you.",
          suspicious: true,
          why: "Nobody needs your MFA code."
        },
        {
          from: "IT Service Desk", initials: "DS", colour: "#0F9D7A",
          text: "Your account is locked. Call us on the intranet number. We'll never ask for codes.",
          suspicious: false,
          why: "It asks you for nothing."
        },
        {
          from: "Your manager?", initials: "RM", colour: "#5B6DF6",
          text: "Send me your password so I can grab the report. Urgent.",
          suspicious: true,
          why: "No manager needs your password."
        }
      ],
      hint: "Look at what each one wants."
    },
    {
      id: "r2-set-b",
      brief: "Three more messages.",
      messages: [
        {
          from: "IT Helpdesk", initials: "IT", colour: "#B45309",
          text: "Approve the prompt on your phone and you're back in.",
          suspicious: true,
          why: "They started that prompt."
        },
        {
          from: "Priya (team lead)", initials: "PN", colour: "#5B6DF6",
          text: "I've logged a ticket for you, INC0294471.",
          suspicious: false,
          why: "A ticket number you can check."
        },
        {
          from: "Account Security", initials: "AS", colour: "#B45309",
          text: "Confirm your details in 15 minutes or lose your account.",
          suspicious: true,
          why: "Deadlines stop you checking."
        }
      ],
      hint: "Ignore the name. Read the ask."
    },
    {
      id: "r2-set-c",
      brief: "Your phone buzzes three times.",
      messages: [
        {
          from: "IT Service Desk", initials: "DS", colour: "#0F9D7A",
          text: "We've locked your account after odd sign-ins. Call the intranet number.",
          suspicious: false,
          why: "Alarming, but asks for nothing."
        },
        {
          from: "Microsoft Security", initials: "MS", colour: "#B45309",
          text: "Your password was breached. Reset it at microsoft-account-reset[.]net",
          suspicious: true,
          why: "That isn't a Microsoft address."
        },
        {
          from: "HR Payroll", initials: "HR", colour: "#B45309",
          text: "Reply with your bank account number and the code we texted you.",
          suspicious: true,
          why: "Your money and a code."
        }
      ],
      hint: "Urgent isn't the same as fake."
    },
    {
      id: "r2-set-di",
      di: true,
      brief: "Three messages about your Digital Identity.",
      messages: [
        {
          from: "Identity Verification", initials: "IV", colour: "#B45309",
          text: "Upload a scan of your passport at northwind-identity-verify[.]com",
          suspicious: true,
          why: "It never asks for ID documents."
        },
        {
          from: "IT Service Desk", initials: "DS", colour: "#0F9D7A",
          text: "You're invited to create a Digital Identity. It's voluntary — start it on the intranet.",
          suspicious: false,
          why: "Voluntary, no link, no rush."
        },
        {
          from: "Digital Identity Team", initials: "DI", colour: "#B45309",
          text: "Your photo failed. Reply with a new one and your network password.",
          suspicious: true,
          why: "It never needs your password."
        }
      ],
      hint: "Two don't match the real process."
    }
  ]
},

/* ========================================================================== */
{
  id: "room3",
  title: "Prove Your Identity",
  subtitle: "How a Digital Identity works — and what happens without one",
  type: "order",
  task: "Tap the steps in the right order.",
  scenarios: [
    {
      id: "r3-capture",
      di: true,
      brief: "Put the Digital Identity setup in order.",
      steps: [
        "Read the privacy info and consent",
        "Take your photo on your device",
        "Your photo is checked and added",
        "Pick your Microsoft 365 photo"
      ],
      why: "Consent first, then your photo, then the check.",
      hint: "Nothing happens before you agree."
    },
    {
      id: "r3-manualreview",
      di: true,
      brief: "Your photo wasn't matched automatically. What happens next?",
      steps: [
        "You submit your photo",
        "The automatic check is tried",
        "Your manager confirms it's you",
        "Your Digital Identity is ready"
      ],
      why: "If the automatic check fails, a manager confirms.",
      hint: "A person steps in last."
    },
    {
      id: "r3-fallback",
      di: true,
      brief: "No Digital Identity. Put the slower check in order.",
      steps: [
        "You call the Service Desk",
        "They can't confirm it's you",
        "Your leader joins and confirms",
        "Your access is restored"
      ],
      why: "It works — it just takes three people.",
      hint: "Someone who knows you joins."
    }
  ]
},

/* ========================================================================== */
{
  id: "room4",
  title: "Phishing Trap",
  subtitle: "The attacker imitates the process you just learned",
  type: "hunt",
  task: "Tap every warning sign you can find.",
  scenarios: [
    {
      id: "r4-qr",
      brief: "This email arrives.",
      chrome: null,
      mock: `
        <div class="body">
          <p class="muted" style="margin-bottom:12px">
            From: <button class="clue" data-clue="sender">IT-Support@northwind-secure[.]net</button>
          </p>
          <!-- decoy: an ordinary timestamp is not a warning sign -->
          <p class="muted" style="margin-bottom:12px">Sent: <button class="clue" data-clue="sent">Tuesday 9:14 AM</button></p>
          <h3>Your password expires in 15 minutes</h3>
          <p><button class="clue" data-clue="urgency">Act now or your account will be deleted.</button></p>
          <div class="sticker clue-wrap" data-clue-wrap="qr">
            <div class="qr tappable" data-clue="qr" role="button" tabindex="0" aria-label="QR code"></div>
            <div style="font-size:13px;line-height:1.5">Scan to keep your access.</div>
          </div>
          <p class="muted" style="margin-top:12px">
            Or click:
            <button class="clue" data-clue="link">hxxps://northwind-account-verify[.]co</button>
          </p>
        </div>`,
      clues: [
        { id: "sender", why: "Not a Northwind domain." },
        { id: "urgency", why: "A 15-minute deadline stops you thinking." },
        { id: "qr", why: "A QR code hides where it takes you." },
        { id: "link", why: "The link doesn't go where it says." }
      ],
      hint: "Read it like you weren't expecting it."
    },
    {
      id: "r4-mfa",
      brief: "A second email, about your sign-in.",
      chrome: null,
      mock: `
        <div class="body dark">
          <p class="muted" style="margin-bottom:12px">
            From: <button class="clue" data-clue="sender">security-alerts@microsoftt-online[.]com</button>
          </p>
          <h3>Unusual sign-in blocked</h3>
          <!-- decoy: your own city and browser are not a warning sign -->
          <p class="muted"><button class="clue" data-clue="location">Perth, Australia &#183; Chrome on Windows</button></p>
          <p class="muted"><button class="clue" data-clue="prompt">Approve the request we just sent to your device.</button></p>
          <p class="muted"><button class="clue" data-clue="secrecy">Do not discuss this with colleagues.</button></p>
          <p class="muted" style="margin-bottom:0">
            Review:
            <button class="clue" data-clue="link">hxxps://login-verify-microsoft[.]info</button>
          </p>
        </div>`,
      clues: [
        { id: "sender", why: "'microsoftt' has two t's." },
        { id: "prompt", why: "You'd be approving a prompt you didn't start." },
        { id: "secrecy", why: "Real security teams never ask for silence." },
        { id: "link", why: "Not a Microsoft domain." }
      ],
      hint: "Nothing here is quite what it claims to be."
    },
    {
      id: "r4-enrol",
      di: true,
      brief: "An email about your Digital Identity.",
      chrome: null,
      mock: `
        <div class="body">
          <p class="muted" style="margin-bottom:12px">
            From: <button class="clue" data-clue="sender">digital-identity@northwind-verify[.]online</button>
          </p>
          <h3>Finish your Digital Identity</h3>
          <div class="idcard" style="margin-bottom:14px">
            <div class="idphoto blur"></div>
            <div class="idmeta">
              <b>Enrolment incomplete</b>
              <button class="clue" data-clue="mandatory">Enrolment is mandatory. Unverified accounts are suspended Friday.</button>
              <span class="pill fail">Action required</span>
            </div>
          </div>
          <p><button class="clue" data-clue="docs">Attach a scan of your passport.</button></p>
          <p><button class="clue" data-clue="password">Include your network password.</button></p>
          <!-- decoy: true statement, tapping it costs the perfect-room bonus -->
          <p><button class="clue" data-clue="privacy">Your photo appears across Microsoft 365.</button></p>
          <p class="muted" style="margin-bottom:0">
            Finish:
            <button class="clue" data-clue="link">hxxps://northwind-digitalid[.]co/enrol</button>
          </p>
        </div>`,
      clues: [
        { id: "sender", why: "Not a Northwind domain." },
        { id: "mandatory", why: "Digital Identity is voluntary." },
        { id: "docs", why: "The real process never collects ID documents." },
        { id: "password", why: "It never needs your password." },
        { id: "link", why: "Real enrolment starts on the intranet." }
      ],
      hint: "One line in here is true. The rest aren't."
    }
  ]
},

/* ========================================================================== */
{
  id: "room5",
  title: "The Imposter",
  subtitle: "Someone is claiming to be a person you trust",
  type: "choice",
  task: "Tap the safest thing to do.",
  scenarios: [
    {
      id: "r5-deepfake",
      brief: "A video call from a leader. The audio lags behind their mouth.",
      mock: `
        <div class="body dark">
          <div class="chatrow">
            <div class="av" style="background:#4B5563">&#127909;</div>
            <div class="bubble">
              &#8220;Bad connection. I'm locked out &#8212; approve the request coming through now.&#8221;
              <div style="margin-top:10px;font-size:12.5px;color:#98A2AE">Video call &#183; unstable</div>
            </div>
          </div>
        </div>`,
      options: [
        { t: "Hang up, call a number you have", correct: true },
        { t: "Approve it — you can see them" },
        { t: "Ask them something personal" },
        { t: "Approve it, report it after" }
      ],
      why: "Faces and voices can be faked.",
      hint: "It's all coming from the attacker."
    },
    {
      id: "r5-servicedesk",
      brief: "A caller knows your name and your manager's name.",
      mock: `
        <div class="body dark">
          <div class="chatrow">
            <div class="av" style="background:#B45309">&#9742;</div>
            <div class="bubble">
              &#8220;Dan from the Service Desk. Read me the code on your screen and I'll unlock you.&#8221;
              <div style="margin-top:10px;font-size:12.5px;color:#98A2AE">Incoming call &#183; number withheld</div>
            </div>
          </div>
        </div>`,
      options: [
        { t: "Hang up, call the Service Desk", correct: true },
        { t: "Carry on — they knew your details" },
        { t: "Read it, but ask for their ID" },
        { t: "Ask them to call back later" }
      ],
      why: "Nobody needs a code off your screen.",
      hint: "They called you."
    },
    {
      id: "r5-teams",
      brief: "A Teams message with your manager's name and photo. Marked External.",
      mock: `
        <div class="body dark">
          <div class="chatrow">
            <div class="av" style="background:#0F9D7A">RM</div>
            <div class="bubble">
              Approve an access request for me in the next five minutes? &#128591;
              <div style="margin-top:10px;font-size:12.5px;color:#98A2AE">External &#183; new contact</div>
            </div>
          </div>
        </div>`,
      options: [
        { t: "Don't act — check another way", correct: true },
        { t: "Approve it — the photo matches" },
        { t: "Reply and ask them to prove it" },
        { t: "Approve it and tell them after" }
      ],
      why: "A name and a photo are not an identity.",
      hint: "Read the label, not the name."
    },
    {
      id: "r5-approved",
      brief: "You approved a prompt. It wasn't yours.",
      mock: `
        <div class="body dark">
          <div class="chatrow">
            <div class="av" style="background:#B45309">&#9888;</div>
            <div class="bubble">
              Approved &#183; 11 minutes ago<br>
              <span style="color:#98A2AE">Sign-in from an unknown location. Session still active.</span>
            </div>
          </div>
        </div>`,
      options: [
        { t: "Report it now", correct: true },
        { t: "Wait and see what happens" },
        { t: "Change your password quietly" },
        { t: "Sign out and keep watching" }
      ],
      why: "Their session is live. Reporting fast limits the damage.",
      hint: "Doing nothing is a decision."
    }
  ]
}

];
