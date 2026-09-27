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
   Digital Identity is a three-way verification call with the person, their
   leader and the Digital Service Desk.

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
      brief: "Your phone is gone. You can't approve MFA, and you're locked out of your account with a deadline this afternoon.",
      options: [
        { t: "Contact the Service Desk and verify your identity through the approved recovery process", correct: true },
        { t: "Use the account recovery link in the email you've just received about the lockout" },
        { t: "Sign in from a colleague's computer, in case the block is on your device" },
        { t: "Ask a colleague to approve the prompt so you can still make the deadline" }
      ],
      why: "Account recovery always runs through a verified identity check — and a Digital Identity makes that check much faster.",
      hint: "Three of these get you moving. Only one proves who you are."
    },
    {
      id: "r1-borrowed",
      brief: "A helpful colleague offers to register their phone on your account so you can approve prompts until yours is replaced.",
      options: [
        { t: "Decline, and go through the Service Desk to restore your own access", correct: true },
        { t: "Accept — it's only temporary and they sit next to you" },
        { t: "Accept, but change your password straight afterwards" },
        { t: "Accept, and remove their phone at the end of the week" }
      ],
      why: "Once someone else's device can approve your sign-ins, every action taken on your account looks like you did it.",
      hint: "Think about who gets blamed for whatever happens next."
    },
    {
      id: "r1-nodi",
      di: true,
      brief: "You never created a Digital Identity. The Service Desk says they'll need to verify you another way before restoring access.",
      options: [
        { t: "Expect a three-way verification call with you, your leader and the Service Desk", correct: true },
        { t: "Expect instant access once you quote your employee number" },
        { t: "Expect to email a photo of your passport to the Service Desk" },
        { t: "Expect to be told nothing can be done until you visit an office" }
      ],
      why: "Without a Digital Identity there's a fallback check involving your leader — it works, it's just slower for everyone.",
      hint: "Who else would already know it's really you?"
    },
    {
      id: "r1-consent",
      di: true,
      brief: "The Service Desk offers to set you up with a Digital Identity so this check is faster next time. The first screen is privacy information and a consent button.",
      options: [
        { t: "Read the privacy information, then consent if you're comfortable — it's your choice", correct: true },
        { t: "Skip straight past it and take the photo; you can read the detail later" },
        { t: "Refuse outright — any process that wants your photo must be a scam" },
        { t: "Ask a colleague to complete it for you so you can get back to work" }
      ],
      why: "Privacy and consent come first by design — you see what the photo is used for before you take it, and taking part is voluntary.",
      hint: "The screen in front of you is there for a reason. Two of these skip it."
    },
    {
      id: "r1-notmfa",
      di: true,
      brief: "Waiting on the callback, a colleague tells you that once you have a Digital Identity you won't need to bother with MFA prompts any more.",
      options: [
        { t: "Correct them — Digital Identity supports identity checks, it never replaces MFA", correct: true },
        { t: "Agree — that's the whole point of verifying your photo" },
        { t: "Agree, but keep using MFA yourself to be safe" },
        { t: "Tell them to raise it with the Service Desk and leave it there" }
      ],
      why: "A Digital Identity is trusted proof for support and recovery. MFA still guards every sign-in — the two do different jobs.",
      hint: "One proves who you are to a human. The other guards the door."
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
      brief: "While you're waiting for the Service Desk, three messages arrive.",
      messages: [
        {
          from: "Cyber Support", initials: "CS", colour: "#B45309",
          text: "Hi, this is Cyber Support. Send me the MFA code you just received so I can unlock your account.",
          suspicious: true,
          why: "Nobody legitimate will ever ask for your MFA code."
        },
        {
          from: "Digital Service Desk", initials: "DS", colour: "#0F9D7A",
          text: "Your account has been locked. Please use the official Service Desk channel for assistance — we will never ask for your password or codes.",
          suspicious: false,
          why: "It points you to a channel you can verify and asks for nothing."
        },
        {
          from: "Your manager?", initials: "RM", colour: "#5B6DF6",
          text: "Hi, I'm travelling and my laptop is dead. Can you send me your password so I can pull the report off your drive? Urgent.",
          suspicious: true,
          why: "A real manager never needs your password, and urgency is the tell."
        }
      ],
      hint: "A genuine contact never needs a code, a password, or a decision right now."
    },
    {
      id: "r2-set-b",
      brief: "Three more messages land while you're still locked out.",
      messages: [
        {
          from: "IT Helpdesk", initials: "IT", colour: "#B45309",
          text: "We're clearing the lockout now. Just approve the prompt that's about to appear on your device and you'll be back in.",
          suspicious: true,
          why: "Someone asking you to approve a prompt they triggered is signing in as you."
        },
        {
          from: "Priya (team lead)", initials: "PN", colour: "#5B6DF6",
          text: "Heard you're locked out — I've logged a ticket for you, INC0294471. They'll call you on your desk phone.",
          suspicious: false,
          why: "A ticket reference is something you can independently check."
        },
        {
          from: "Account Security", initials: "AS", colour: "#B45309",
          text: "Final notice: confirm your recovery details within 15 minutes or your account will be permanently deleted.",
          suspicious: true,
          why: "Deadlines and threats exist to stop you checking."
        }
      ],
      hint: "Ignore who they claim to be. Look at what each one is asking you to do."
    },
    {
      id: "r2-set-c",
      brief: "Your phone buzzes three more times.",
      messages: [
        {
          from: "IT Service Desk", initials: "DS", colour: "#0F9D7A",
          text: "We've seen sign-in attempts on your account from outside Australia and locked it as a precaution. Please call us on the number listed on the intranet \u2014 don't use a number from this message.",
          suspicious: false,
          why: "It's alarming and urgent, but it asks for nothing and sends you to a number it can't control."
        },
        {
          from: "Microsoft Security", initials: "MS", colour: "#B45309",
          text: "Your password appeared in a breach. Reset it now at hxxps://microsoft-account-reset[.]net before your access is suspended.",
          suspicious: true,
          why: "A real breach notice doesn't hand you a reset link on a domain like that."
        },
        {
          from: "HR Payroll", initials: "HR", colour: "#B45309",
          text: "We couldn't verify your bank details before Thursday's pay run. Reply with your account number and the code we've just texted you.",
          suspicious: true,
          why: "Money, a deadline, and a request for a code \u2014 all three at once."
        }
      ],
      hint: "Urgent is not the same as fake. Judge each one on what it wants from you."
    },
    {
      id: "r2-set-di",
      di: true,
      brief: "Three messages arrive, all of them about your Digital Identity.",
      messages: [
        {
          from: "Identity Verification", initials: "IV", colour: "#B45309",
          text: "To complete your Digital Identity, upload a scan of your passport or driver's licence at northwind-identity-verify[.]com today.",
          suspicious: true,
          why: "The real process captures a photo with your own device camera. It never asks you to send identity documents to a website."
        },
        {
          from: "IT Service Desk", initials: "DS", colour: "#0F9D7A",
          text: "You're invited to create a Digital Identity. It's voluntary, takes about two minutes, and you start it from the link on the intranet home page \u2014 have a read of the privacy information first.",
          suspicious: false,
          why: "Voluntary, no link of its own, and it points you at privacy information rather than rushing you."
        },
        {
          from: "Digital Identity Team", initials: "DI", colour: "#B45309",
          text: "Your identity photo failed verification. Reply with a new photo and your network password so we can re-link it to your account.",
          suspicious: true,
          why: "When a photo can't be verified automatically it goes to your manager to confirm \u2014 and nothing in the process ever needs your password."
        }
      ],
      hint: "You've seen how the real process works. Two of these don't match it."
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
      brief: "To recover your account you need a Digital Identity. Put the setup steps in order.",
      steps: [
        "Review the privacy information and give consent",
        "Take your photo using your device camera",
        "Your photo is reviewed and added to your profile",
        "Choose which photo appears across Microsoft 365"
      ],
      why: "Consent comes first, then capture, then review — and you choose what the rest of Microsoft 365 shows.",
      hint: "Nothing is captured before you've agreed to it."
    },
    {
      id: "r3-manualreview",
      di: true,
      brief: "Your photo was submitted but couldn't be matched automatically. Put what happens next in order.",
      steps: [
        "Your photo is submitted for verification",
        "Automatic verification is attempted against your profile photo",
        "Automatic verification cannot be completed",
        "Your manager confirms it's really you",
        "Your Digital Identity profile is ready to use"
      ],
      why: "When automatic verification can't complete, manager confirmation takes its place — the check still happens, just by a human.",
      hint: "A person only gets involved once the automatic check has failed."
    },
    {
      id: "r3-fallback",
      di: true,
      brief: "You don't have a Digital Identity, so the Service Desk has to verify you the long way. Put that fallback in order.",
      steps: [
        "You contact the Service Desk about your lockout",
        "They can't confirm your identity digitally",
        "A verification call is arranged with your leader",
        "Your leader confirms on the call that it's really you",
        "Your access is restored"
      ],
      why: "This is the fallback without a Digital Identity: a three-way call with you, your leader and the Service Desk. It works — it just costs three people's time instead of a two-minute check.",
      hint: "Someone who already knows you has to be on the call."
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
      brief: "This lands in your inbox while you're waiting for the Service Desk to call back.",
      chrome: null,
      mock: `
        <div class="body">
          <p class="muted" style="margin-bottom:12px">
            From: <button class="clue" data-clue="sender">IT-Support@northwind-secure[.]net</button>
          </p>
          <!-- decoy: an ordinary timestamp is not a warning sign -->
          <p class="muted" style="margin-bottom:12px">Sent: <button class="clue" data-clue="sent">Tuesday 9:14 AM</button></p>
          <h3>Your password expires in 15 minutes</h3>
          <p><button class="clue" data-clue="urgency">Your account will be permanently deleted if you do not act immediately.</button></p>
          <p>Scan the code below with your phone to re-validate your credentials.</p>
          <div class="sticker clue-wrap" data-clue-wrap="qr">
            <div class="qr tappable" data-clue="qr" role="button" tabindex="0" aria-label="QR code"></div>
            <div style="font-size:13px;line-height:1.5">Scan to keep your access.<br>This code expires today.</div>
          </div>
          <p class="muted" style="margin-top:12px">
            Or click here:
            <button class="clue" data-clue="link">hxxps://northwind-account-verify[.]co/renew</button>
          </p>
        </div>`,
      clues: [
        { id: "sender", why: "The sender's domain isn't Northwind's." },
        { id: "urgency", why: "A 15-minute deadline exists to stop you thinking." },
        { id: "qr", why: "A QR code hides where it goes, and moves you onto your phone." },
        { id: "link", why: "The link doesn't go where it claims to." }
      ],
      hint: "Slow down and read it the way you would if you hadn't been expecting it."
    },
    {
      id: "r4-mfa",
      brief: "A second message arrives, this one about your sign-in.",
      chrome: null,
      mock: `
        <div class="body dark">
          <p class="muted" style="margin-bottom:12px">
            From: <button class="clue" data-clue="sender">security-alerts@microsoftt-online[.]com</button>
          </p>
          <h3>Unusual sign-in blocked</h3>
          <!-- decoy: your own city and browser are not a warning sign -->
          <p class="muted"><button class="clue" data-clue="location">Perth, Australia &#183; Chrome on Windows</button></p>
          <p class="muted"><button class="clue" data-clue="prompt">We have sent an approval request to your device. Approve it now to confirm this was you.</button></p>
          <p class="muted"><button class="clue" data-clue="secrecy">Do not discuss this message with colleagues while the investigation is open.</button></p>
          <p class="muted" style="margin-bottom:0">
            Review activity:
            <button class="clue" data-clue="link">hxxps://login-verify-microsoft[.]info/session</button>
          </p>
        </div>`,
      clues: [
        { id: "sender", why: "A misspelled domain — 'microsoftt' with two t's." },
        { id: "prompt", why: "You're being asked to approve a prompt you didn't trigger." },
        { id: "secrecy", why: "Real security teams never ask you to keep quiet." },
        { id: "link", why: "Not a Microsoft domain, whatever it looks like." }
      ],
      hint: "Nothing here is quite what it claims to be — including the parts that look official."
    },
    {
      id: "r4-enrol",
      di: true,
      brief: "Now an email about your Digital Identity. You did just start one, so this is the one you're most likely to act on.",
      chrome: null,
      mock: `
        <div class="body">
          <p class="muted" style="margin-bottom:12px">
            From: <button class="clue" data-clue="sender">digital-identity@northwind-verify[.]online</button>
          </p>
          <h3>Complete your Digital Identity enrolment</h3>
          <div class="idcard" style="margin-bottom:14px">
            <div class="idphoto blur"></div>
            <div class="idmeta">
              <b>Enrolment incomplete</b>
              <button class="clue" data-clue="mandatory">Enrolment is mandatory. Accounts not verified by Friday will be suspended.</button>
              <span class="pill fail">Action required</span>
            </div>
          </div>
          <p><button class="clue" data-clue="docs">Attach a scan of your passport or driver&#8217;s licence so we can confirm your photo.</button></p>
          <p><button class="clue" data-clue="password">Include your network password so the photo can be linked to your account.</button></p>
          <!-- decoy: true statement, tapping it costs the perfect-room bonus -->
          <p><button class="clue" data-clue="privacy">Your photo is used to confirm your identity and appears across Microsoft 365.</button></p>
          <p class="muted" style="margin-bottom:0">
            Finish enrolment:
            <button class="clue" data-clue="link">hxxps://northwind-digitalid[.]co/enrol</button>
          </p>
        </div>`,
      clues: [
        { id: "sender", why: "Not a Northwind domain, however familiar the words look." },
        { id: "mandatory", why: "Digital Identity is voluntary. Nobody loses their account over it." },
        { id: "docs", why: "The real process takes a photo on your own device. It never collects identity documents." },
        { id: "password", why: "Nothing in the process ever needs your password." },
        { id: "link", why: "The genuine enrolment starts from the intranet, not a link in an email." }
      ],
      hint: "One line in here is actually true. The rest contradict how enrolment really works."
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
      brief: "A video call from a senior leader you recognise. The picture stutters, and the audio lags slightly behind their mouth.",
      mock: `
        <div class="body dark">
          <div class="chatrow">
            <div class="av" style="background:#4B5563">&#127909;</div>
            <div class="bubble">
              &#8220;Sorry, terrible connection. I'm locked out and I need you to approve the access request coming through now. It's time-critical and I can't go through the Service Desk.&#8221;
              <div style="margin-top:10px;font-size:12.5px;color:#98A2AE">Video call &#183; 1 min 40 &#183; connection unstable</div>
            </div>
          </div>
        </div>`,
      options: [
        { t: "End the call and reach them on a number you already have", correct: true },
        { t: "Approve it — you can see and hear them, so it's clearly them" },
        { t: "Ask them something personal on the call to check it's really them" },
        { t: "Approve it, then report it afterwards just in case" }
      ],
      why: "Faces and voices can be convincingly faked, so verify on a channel the caller doesn't control. This is exactly the gap a Digital Identity closes — trusted proof instead of ‘I recognise them’.",
      hint: "Everything you can see and hear is coming down the attacker's own channel."
    },
    {
      id: "r5-servicedesk",
      brief: "Your desk phone rings. The caller knows your name, your manager's name and your laptop's asset tag.",
      mock: `
        <div class="body dark">
          <div class="chatrow">
            <div class="av" style="background:#B45309">&#9742;</div>
            <div class="bubble">
              &#8220;It's Dan from the Service Desk, calling about your lockout. I can restore your access right now &#8212; I just need you to read me the code on your screen.&#8221;
              <div style="margin-top:10px;font-size:12.5px;color:#98A2AE">Incoming call &#183; number withheld</div>
            </div>
          </div>
        </div>`,
      options: [
        { t: "Hang up and call the Service Desk on the number from the intranet", correct: true },
        { t: "Continue — they raised your ticket, so they must be genuine" },
        { t: "Read out the code, but ask for their employee number first" },
        { t: "Ask them to call back later when you can check" }
      ],
      why: "Knowing things about you isn't proof of identity, and no genuine agent needs a code from your screen. Verified identity runs one way — you prove who you are to the Service Desk, never the other way round.",
      hint: "They called you. That's the part you can't verify."
    },
    {
      id: "r5-teams",
      brief: "A Teams message from an account using your manager's name and photo — but the profile is marked External.",
      mock: `
        <div class="body dark">
          <div class="chatrow">
            <div class="av" style="background:#0F9D7A">RM</div>
            <div class="bubble">
              Are you there? I need you to approve an access request for me in the next five minutes, I'm about to go into a board meeting. Don't wait for me to explain &#128591;
              <div style="margin-top:10px;font-size:12.5px;color:#98A2AE">External &#183; new contact &#183; online now</div>
            </div>
          </div>
        </div>`,
      options: [
        { t: "Don't act, and confirm with your manager another way", correct: true },
        { t: "Approve it — the name and photo match" },
        { t: "Reply and ask them to prove who they are" },
        { t: "Approve it and tell them afterwards" }
      ],
      why: "A display name and photo are trivially copied, and replying only reaches whoever set the account up. A name and a picture are not an identity.",
      hint: "Look at the label under the message before you look at the name."
    },
    {
      id: "r5-approved",
      brief: "You already approved one prompt tonight, assuming it was your own sign-in. It wasn't. Nothing on your account looks wrong yet.",
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
        { t: "Report it to the Service Desk now, before you know what the damage is", correct: true },
        { t: "Wait and see whether anything actually changes on your account" },
        { t: "Change your password quietly and say nothing about the prompt" },
        { t: "Sign out of everything and keep an eye on it over the next few days" }
      ],
      why: "The attacker has a live session right now. Reporting in the first few minutes is what limits the damage \u2014 waiting until you're sure is what costs you. Nobody gets in trouble for reporting fast.",
      hint: "Doing nothing is still a decision, and the session is still open."
    }
  ]
}

];
