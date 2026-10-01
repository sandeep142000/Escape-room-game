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
      brief: "Your phone is gone. You can't approve MFA, and you're locked out.",
      options: [
        { t: "Call the Service Desk and verify who you are", correct: true },
        { t: "Use the recovery link in the email you just got" },
        { t: "Ask a colleague to approve the prompt for you" },
        { t: "Sign in from a colleague's computer instead" }
      ],
      why: "Only the Service Desk can safely prove it's you.",
      hint: "Three get you moving. One proves who you are."
    },
    {
      id: "r1-borrowed",
      brief: "A colleague offers to add their phone to your account so they can approve your prompts.",
      options: [
        { t: "Say no, and go through the Service Desk", correct: true },
        { t: "Accept — it's only for a few days" },
        { t: "Accept, then change your password after" },
        { t: "Accept, and remove their phone on Friday" }
      ],
      why: "If their phone can approve your sign-ins, their actions look like yours.",
      hint: "Whose name is on whatever happens next?"
    },
    {
      id: "r1-nodi",
      di: true,
      brief: "You have no Digital Identity. The Service Desk needs another way to check it's you.",
      options: [
        { t: "A call with you, your leader and the Service Desk", correct: true },
        { t: "Instant access once you give your employee number" },
        { t: "Email a photo of your passport in" },
        { t: "Nothing, until you visit an office in person" }
      ],
      why: "Without a Digital Identity your leader confirms it's you. It works, it's just slower.",
      hint: "Who already knows you by sight?"
    },
    {
      id: "r1-consent",
      di: true,
      brief: "You're setting up a Digital Identity. The first screen is privacy information and a consent button.",
      options: [
        { t: "Read it, then consent if you're happy — your choice", correct: true },
        { t: "Skip it and take the photo" },
        { t: "Refuse — anything wanting your photo is a scam" },
        { t: "Ask a colleague to do it for you" }
      ],
      why: "You see what your photo is used for first, and taking part is voluntary.",
      hint: "That screen is there for a reason."
    },
    {
      id: "r1-notmfa",
      di: true,
      brief: "A colleague says a Digital Identity means you can stop using MFA.",
      options: [
        { t: "Put them right — it never replaces MFA", correct: true },
        { t: "Agree — that's the point of it" },
        { t: "Agree, but keep using MFA yourself" },
        { t: "Tell them to ask the Service Desk" }
      ],
      why: "Digital Identity proves who you are to people. MFA still guards every sign-in.",
      hint: "They do two different jobs."
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
      brief: "Three messages arrive while you wait.",
      messages: [
        {
          from: "Cyber Support", initials: "CS", colour: "#B45309",
          text: "Send me the MFA code you just received and I'll unlock your account.",
          suspicious: true,
          why: "Nobody ever needs your MFA code."
        },
        {
          from: "IT Service Desk", initials: "DS", colour: "#0F9D7A",
          text: "Your account is locked. Call us on the intranet number — we'll never ask for your password or codes.",
          suspicious: false,
          why: "Asks for nothing, and points you somewhere you can check."
        },
        {
          from: "Your manager?", initials: "RM", colour: "#5B6DF6",
          text: "My laptop's dead. Send me your password so I can grab the report. Urgent.",
          suspicious: true,
          why: "No real manager needs your password."
        }
      ],
      hint: "Nobody genuine needs a code, a password, or a decision right now."
    },
    {
      id: "r2-set-b",
      brief: "Three more messages land.",
      messages: [
        {
          from: "IT Helpdesk", initials: "IT", colour: "#B45309",
          text: "Approve the prompt about to appear on your phone and you'll be back in.",
          suspicious: true,
          why: "They started that prompt. Approving it signs them in."
        },
        {
          from: "Priya (team lead)", initials: "PN", colour: "#5B6DF6",
          text: "I've logged a ticket for you, INC0294471. They'll call your desk phone.",
          suspicious: false,
          why: "A ticket number is something you can check."
        },
        {
          from: "Account Security", initials: "AS", colour: "#B45309",
          text: "Confirm your recovery details within 15 minutes or your account is deleted.",
          suspicious: true,
          why: "Deadlines exist to stop you checking."
        }
      ],
      hint: "Ignore who they say they are. Look at what they want."
    },
    {
      id: "r2-set-c",
      brief: "Your phone buzzes three more times.",
      messages: [
        {
          from: "IT Service Desk", initials: "DS", colour: "#0F9D7A",
          text: "We've locked your account after odd sign-in attempts. Call the number on the intranet — not one from this message.",
          suspicious: false,
          why: "Alarming, but it asks for nothing."
        },
        {
          from: "Microsoft Security", initials: "MS", colour: "#B45309",
          text: "Your password appeared in a breach. Reset it now at hxxps://microsoft-account-reset[.]net",
          suspicious: true,
          why: "Real alerts don't send you to a domain like that."
        },
        {
          from: "HR Payroll", initials: "HR", colour: "#B45309",
          text: "Reply with your bank account number and the code we've just texted you.",
          suspicious: true,
          why: "Money, a deadline and a code."
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
          text: "Upload a scan of your passport or licence at northwind-identity-verify[.]com today.",
          suspicious: true,
          why: "The real process uses your own camera, never your ID documents."
        },
        {
          from: "IT Service Desk", initials: "DS", colour: "#0F9D7A",
          text: "You're invited to create a Digital Identity. It's voluntary, takes two minutes, and starts from the intranet.",
          suspicious: false,
          why: "Voluntary, no link of its own, and no rush."
        },
        {
          from: "Digital Identity Team", initials: "DI", colour: "#B45309",
          text: "Your photo failed verification. Reply with a new one and your network password.",
          suspicious: true,
          why: "Nothing in the process ever needs your password."
        }
      ],
      hint: "Two of these don't match the real process."
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
      brief: "Put the Digital Identity setup steps in order.",
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
      brief: "Your photo couldn't be matched automatically. What happens next?",
      steps: [
        "You submit your photo",
        "The automatic check is tried",
        "Your manager confirms it's you",
        "Your Digital Identity is ready"
      ],
      why: "If the automatic check can't finish, a manager confirms instead.",
      hint: "A person only steps in after the automatic check."
    },
    {
      id: "r3-fallback",
      di: true,
      brief: "No Digital Identity, so the Service Desk checks another way. Put it in order.",
      steps: [
        "You call the Service Desk about your lockout",
        "They can't confirm it's you",
        "Your leader joins a call and confirms",
        "Your access is restored"
      ],
      why: "It works — it just takes three people instead of two minutes.",
      hint: "Someone who already knows you has to join."
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
      brief: "This email arrives while you wait.",
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
      brief: "A second message, this one about your sign-in.",
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
      brief: "Now an email about your Digital Identity.",
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
      brief: "A video call from a leader you recognise. The audio lags behind their mouth.",
      mock: `
        <div class="body dark">
          <div class="chatrow">
            <div class="av" style="background:#4B5563">&#127909;</div>
            <div class="bubble">
              &#8220;Terrible connection. I'm locked out &#8212; approve the request coming through now. It's urgent.&#8221;
              <div style="margin-top:10px;font-size:12.5px;color:#98A2AE">Video call &#183; connection unstable</div>
            </div>
          </div>
        </div>`,
      options: [
        { t: "Hang up and call them on a number you already have", correct: true },
        { t: "Approve it — you can see and hear them" },
        { t: "Ask them something personal to check" },
        { t: "Approve it, then report it after" }
      ],
      why: "Faces and voices can be faked. Check on a channel they don't control.",
      hint: "Everything you can see is coming from the attacker."
    },
    {
      id: "r5-servicedesk",
      brief: "Your desk phone rings. The caller knows your name and your manager's name.",
      mock: `
        <div class="body dark">
          <div class="chatrow">
            <div class="av" style="background:#B45309">&#9742;</div>
            <div class="bubble">
              &#8220;Dan from the Service Desk. I can unlock you right now &#8212; just read me the code on your screen.&#8221;
              <div style="margin-top:10px;font-size:12.5px;color:#98A2AE">Incoming call &#183; number withheld</div>
            </div>
          </div>
        </div>`,
      options: [
        { t: "Hang up and call the Service Desk yourself", correct: true },
        { t: "Carry on — they knew your details" },
        { t: "Read the code, but ask for their employee number" },
        { t: "Ask them to call back later" }
      ],
      why: "Knowing things about you isn't proof. Nobody needs a code off your screen.",
      hint: "They called you. That's the bit you can't check."
    },
    {
      id: "r5-teams",
      brief: "A Teams message using your manager's name and photo. The profile says External.",
      mock: `
        <div class="body dark">
          <div class="chatrow">
            <div class="av" style="background:#0F9D7A">RM</div>
            <div class="bubble">
              Approve an access request for me in the next five minutes? I'm going into a board meeting &#128591;
              <div style="margin-top:10px;font-size:12.5px;color:#98A2AE">External &#183; new contact &#183; online now</div>
            </div>
          </div>
        </div>`,
      options: [
        { t: "Don't act — check with your manager another way", correct: true },
        { t: "Approve it — the name and photo match" },
        { t: "Reply and ask them to prove who they are" },
        { t: "Approve it and tell them after" }
      ],
      why: "A name and a photo are not an identity.",
      hint: "Read the label under the message."
    },
    {
      id: "r5-approved",
      brief: "You approved a prompt earlier. It wasn't yours. Nothing looks wrong yet.",
      mock: `
        <div class="body dark">
          <div class="chatrow">
            <div class="av" style="background:#B45309">&#9888;</div>
            <div class="bubble">
              Approved &#183; 11 minutes ago<br>
              <span style="color:#98A2AE">Sign-in from a location you don't recognise. Session still active.</span>
            </div>
          </div>
        </div>`,
      options: [
        { t: "Report it to the Service Desk now", correct: true },
        { t: "Wait and see if anything changes" },
        { t: "Change your password and say nothing" },
        { t: "Sign out of everything and keep watching" }
      ],
      why: "Their session is live now. Reporting fast limits the damage \u2014 nobody gets in trouble.",
      hint: "Doing nothing is still a decision."
    }
  ]
}

];
