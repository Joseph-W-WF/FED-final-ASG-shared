/* account.js
   Uses db.js helpers: loadDB(), saveDB(), resetDB(), makeId()
   Your db.js already has:
   - db.users (seeded)
   - db.passwordResets (empty)
*/
function setAuthOptionsForRole(role) {
  // default: customer has all options
  const showRegister = role === "CUSTOMER";
  const showGuest = role === "CUSTOMER";

  $("btnGoRegister").style.display = showRegister ? "inline-block" : "none";
  $("btnGuest").style.display = showGuest ? "inline-block" : "none";

  // NEA should not use password recovery (optional, but usually true)
  $("btnForgot").style.display = (role === "CUSTOMER") ? "inline-block" : "none";

  // Show Officer ID only when NEA
  $("neaIdWrap").style.display = (role === "NEA") ? "block" : "none";

  // Update subtitle text
  if (role === "CUSTOMER") $("authSubtitle").textContent = "Customer: Sign in, register, or continue as guest.";
  if (role === "VENDOR") $("authSubtitle").textContent = "Vendor: Sign in (accounts are pre-created).";
  if (role === "NEA") $("authSubtitle").textContent = "NEA Officer: Sign in with Officer ID, username and password.";
}

(function () {
  // ---------------------------
  // Simple session keys
  // ---------------------------
  var SESSION_USER_KEY = "hawkerSessionUser_v1";
  var SESSION_ROLE_KEY = "hawkerSessionRole_v1";

  // Recovery flow state (in-memory)
  var recoveryState = {
    resetId: null,   // passwordResets.id
    userId: null
  };

  // ---------------------------
  // DOM helpers
  // ---------------------------
  function $(id) { return document.getElementById(id); }

  function showNotice(msg, type) {
    var n = $("notice");
    n.style.display = "block";
    n.textContent = msg;

    // tiny type styling without extra CSS complexity
    n.style.borderColor = (type === "error") ? "rgba(255,107,107,0.5)" :
                        (type === "ok") ? "rgba(107,255,181,0.35)" : "rgba(255,255,255,0.12)";
  }

  function clearNotice() {
    var n = $("notice");
    n.style.display = "none";
    n.textContent = "";
    n.style.borderColor = "rgba(255,255,255,0.12)";
  }

  function setCrumb(text) {
    $("crumb").textContent = text;
  }

  function setRolePill(role) {
    $("rolePill").textContent = "Role: " + (role || "-");
  }

  function setUserPill(text) {
    $("userPill").textContent = "User: " + (text || "Guest");
  }

  function setActiveView(viewId, crumbText) {
    clearNotice();
    var views = document.querySelectorAll(".view");
    views.forEach(function (v) { v.classList.remove("active"); });
    var view = $(viewId);
    if (view) view.classList.add("active");
    if (crumbText) setCrumb(crumbText);
  }

  // ---------------------------
  // Session
  // ---------------------------
  function getSessionRole() {
    return localStorage.getItem(SESSION_ROLE_KEY) || "";
  }

  function setSessionRole(role) {
    localStorage.setItem(SESSION_ROLE_KEY, role);
    setRolePill(role);
  }

  function getSessionUser() {
    var raw = localStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function setSessionUser(userObjOrNull) {
    if (!userObjOrNull) {
      localStorage.removeItem(SESSION_USER_KEY);
      setUserPill("Guest");
      return;
    }
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObjOrNull));
    setUserPill(userObjOrNull.username || userObjOrNull.id || "User");
  }

  // ---------------------------
  // Validation helpers
  // ---------------------------
  function normalize(str) {
    return (str || "").toString().trim();
  }

  function isEmail(s) {
    s = normalize(s);
    return s.includes("@") && s.includes(".");
  }

  function isPhone(s) {
    s = normalize(s);
    // simple SG-ish check: 8 digits
    return /^\d{8}$/.test(s);
  }

  // ---------------------------
  // DB helpers for users
  // ---------------------------
  function findUserByUsernameOrEmailOrPhone(value, roleFilter) {
    var db = loadDB();
    var v = normalize(value).toLowerCase();

    for (var i = 0; i < db.users.length; i++) {
      var u = db.users[i];

      if (roleFilter && u.role !== roleFilter) continue;

      // We store some optional fields for new accounts:
      // u.email, u.phone, u.fullName
      var usernameMatch = (u.username && u.username.toLowerCase() === v);
      var emailMatch = (u.email && u.email.toLowerCase() === v);
      var phoneMatch = (u.phone && normalize(u.phone) === v);

      if (usernameMatch || emailMatch || phoneMatch) return u;
    }
    return null;
  }

  function usernameExists(username) {
    var db = loadDB();
    var v = normalize(username).toLowerCase();
    return db.users.some(function (u) {
      return u.username && u.username.toLowerCase() === v;
    });
  }

  function createUsernameFromEmailOrPhone(email, phone) {
    if (email && isEmail(email)) {
      var base = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
      return base || ("user" + Math.floor(Math.random() * 10000));
    }
    if (phone && isPhone(phone)) {
      return "user" + phone.slice(-4);
    }
    return "user" + Math.floor(Math.random() * 10000);
  }

  // ---------------------------
  // AUTH: Register / Login
  // ---------------------------
  function registerAccount(role, fullName, email, phone, password) {
    var db = loadDB();

    if (!role || (role !== "CUSTOMER" && role !== "VENDOR" && role !== "NEA")) {
      return { ok: false, msg: "Invalid role." };
    }

    fullName = normalize(fullName);
    email = normalize(email);
    phone = normalize(phone);
    password = normalize(password);

    if (!fullName) return { ok: false, msg: "Full name is required." };
    if (!phone || !isPhone(phone)) return { ok: false, msg: "Use an 8-digit phone number." };
    if (!password || password.length < 6) return { ok: false, msg: "Password must be at least 6 characters." };

    // Email optional, but if present must look like email
    if (email && !isEmail(email)) return { ok: false, msg: "Email format looks wrong." };

    // Prevent duplicates by phone/email/username
    if (findUserByUsernameOrEmailOrPhone(phone, role)) {
      return { ok: false, msg: "This phone is already used for this role." };
    }
    if (email && findUserByUsernameOrEmailOrPhone(email, role)) {
      return { ok: false, msg: "This email is already used for this role." };
    }

    // Generate username (and ensure unique)
    var username = createUsernameFromEmailOrPhone(email, phone);
    var tries = 0;
    while (usernameExists(username) && tries < 10) {
      username = username + Math.floor(Math.random() * 10);
      tries++;
    }
    if (usernameExists(username)) {
      username = "user" + Date.now();
    }

    var newUser = {
      id: makeId(role === "CUSTOMER" ? "c" : role === "VENDOR" ? "v" : "nea"),
      role: role,
      username: username,
      password: password,

      // extra fields for your app (safe to add; db.js seed users won’t have them)
      fullName: fullName,
      email: email,
      phone: phone
    };

    // Vendor: (optional) you might later assign stallId after approval
    if (role === "VENDOR") {
      newUser.stallId = null;
    }

    db.users.push(newUser);
    saveDB(db);

    return { ok: true, msg: "Registered! Your username is: " + username, user: newUser };
  }

  function login(role, usernameOrEmailOrPhone, password) {
    usernameOrEmailOrPhone = normalize(usernameOrEmailOrPhone);
    password = normalize(password);

    if (!usernameOrEmailOrPhone || !password) {
      return { ok: false, msg: "Enter username/email/phone and password." };
    }

    // If user typed email/phone, we still search them
    var u = findUserByUsernameOrEmailOrPhone(usernameOrEmailOrPhone, role);
    if (!u) return { ok: false, msg: "Account not found for this role." };
    if (u.password !== password) return { ok: false, msg: "Wrong password." };

    // Store session (minimal info)
    setSessionUser({ id: u.id, role: u.role, username: u.username });
    return { ok: true, msg: "Signed in as " + u.username, user: u };
  }

  // ---------------------------
  // RECOVERY: OTP + Reset
  // ---------------------------
  function generateOtp() {
    // 6-digit OTP
    return ("" + Math.floor(100000 + Math.random() * 900000));
  }

  function requestOtp(role, value, mode) {
    var db = loadDB();
    value = normalize(value);

    if (mode === "email" && !isEmail(value)) return { ok: false, msg: "Enter a valid email." };
    if (mode === "phone" && !isPhone(value)) return { ok: false, msg: "Enter an 8-digit phone number." };

    var u = findUserByUsernameOrEmailOrPhone(value, role);
    if (!u) return { ok: false, msg: "No account matches this " + mode + " for the selected role." };

    var otp = generateOtp();

    // Store reset request into db.passwordResets
    var resetReq = {
      id: makeId("reset"),
      userId: u.id,
      email: (mode === "email") ? value : (u.email || ""),
      phone: (mode === "phone") ? value : (u.phone || ""),
      token: otp,
      createdDate: new Date().toISOString(),
      used: false
    };

    db.passwordResets.push(resetReq);
    saveDB(db);

    // Keep state for the next pages
    recoveryState.resetId = resetReq.id;
    recoveryState.userId = u.id;

    // Since this is frontend only, we "simulate" sending by showing OTP.
    // In real app: you never show OTP like this.
    return { ok: true, msg: "OTP sent (simulation): " + otp };
  }

  function verifyOtp(otpInput) {
    var db = loadDB();
    otpInput = normalize(otpInput);

    if (!recoveryState.resetId) return { ok: false, msg: "No recovery request. Please request OTP again." };
    var rr = db.passwordResets.find(function (x) { return x.id === recoveryState.resetId; });
    if (!rr) return { ok: false, msg: "Recovery request not found. Please request OTP again." };
    if (rr.used) return { ok: false, msg: "This OTP was already used. Request a new one." };

    // Optional expiry (10 minutes)
    var created = new Date(rr.createdDate).getTime();
    var now = Date.now();
    var tenMins = 10 * 60 * 1000;
    if (now - created > tenMins) return { ok: false, msg: "OTP expired. Request a new one." };

    if (rr.token !== otpInput) return { ok: false, msg: "Wrong OTP." };

    return { ok: true, msg: "OTP verified." };
  }

  function resetPassword(newPass, confirmPass) {
    var db = loadDB();

    newPass = normalize(newPass);
    confirmPass = normalize(confirmPass);

    if (newPass.length < 6) return { ok: false, msg: "Password must be at least 6 characters." };
    if (newPass !== confirmPass) return { ok: false, msg: "Passwords do not match." };

    if (!recoveryState.resetId || !recoveryState.userId) {
      return { ok: false, msg: "No recovery flow found. Please request OTP again." };
    }

    var rr = db.passwordResets.find(function (x) { return x.id === recoveryState.resetId; });
    if (!rr || rr.used) return { ok: false, msg: "Recovery request invalid. Please request OTP again." };

    var user = db.users.find(function (u) { return u.id === recoveryState.userId; });
    if (!user) return { ok: false, msg: "User not found." };

    user.password = newPass;
    rr.used = true;
    saveDB(db);

    // clear state
    recoveryState.resetId = null;
    recoveryState.userId = null;

    return { ok: true, msg: "Password updated. You can sign in now." };
  }

  // ---------------------------
  // Wiring UI
  // ---------------------------
  function init() {
    // Sidebar nav
    document.querySelectorAll(".nav-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var go = btn.getAttribute("data-go");
        if (go === "view-role") setActiveView("view-role", "Role");
        if (go === "view-auth") setActiveView("view-auth", "Sign In / Register");
        if (go === "view-recovery") setActiveView("view-recovery", "Recovery");
      });
    });

    // Role cards
    document.querySelectorAll(".card[data-role]").forEach(function (card) {
      card.addEventListener("click", function () {
        var role = card.getAttribute("data-role");
        setSessionRole(role);
        showNotice("Selected role: " + role, "ok");

        // Update auth page text
        var title = "Sign In / Register";
        var subtitle = "Continue.";
        if (role === "CUSTOMER") subtitle = "Customer: Sign in, register, or continue as guest.";
        if (role === "VENDOR") subtitle = "Vendor: Sign in or register (stall assignment later).";
        if (role === "NEA") subtitle = "NEA: Sign in (usually provided by admin).";

        $("authTitle").textContent = title;
        $("authSubtitle").textContent = subtitle;
      });
    });

    $("btnContinueFromRole").addEventListener("click", function () {
      if (!getSessionRole()) {
        showNotice("Please choose a role first.", "error");
        return;
      }
      setActiveView("view-auth", "Sign In / Register");
    });

    // Auth home buttons
    $("btnGoSignin").addEventListener("click", function () {
      if (!getSessionRole()) return showNotice("Choose a role first.", "error");
      setActiveView("view-signin", "Sign In");
    });

    $("btnGoRegister").addEventListener("click", function () {
      var role = getSessionRole();
      if (!role) return showNotice("Choose a role first.", "error");

      // If you want to block NEA self-register:
      if (role === "NEA") return showNotice("NEA accounts are usually created by admin.", "error");

      setActiveView("view-register", "Register");
    });

    $("btnGuest").addEventListener("click", function () {
      var role = getSessionRole();
      if (!role) return showNotice("Choose a role first.", "error");
      if (role !== "CUSTOMER") return showNotice("Guest is only for Customers.", "error");

      // store a guest session
      var guestId = makeId("guest");
      setSessionUser({ id: guestId, role: "GUEST", username: "guest" });
      showNotice("Continuing as guest.", "ok");
    });

    // Signin to recovery / register
    $("btnForgot").addEventListener("click", function () {
      if (!getSessionRole()) return showNotice("Choose a role first.", "error");
      setActiveView("view-recovery", "Recovery");
    });
    $("btnToRegister").addEventListener("click", function () {
      if (getSessionRole() === "NEA") return showNotice("NEA accounts are created by admin.", "error");
      setActiveView("view-register", "Register");
    });

    // Register to signin/back
    $("btnToSignin").addEventListener("click", function () {
      setActiveView("view-signin", "Sign In");
    });
    $("btnBackAuth1").addEventListener("click", function () {
      setActiveView("view-auth", "Sign In / Register");
    });
    $("btnBackAuth2").addEventListener("click", function () {
      setActiveView("view-auth", "Sign In / Register");
    });

    // Tabs: recovery mode
    var recoveryMode = "email";
    document.querySelectorAll(".tab").forEach(function (t) {
      t.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        recoveryMode = t.getAttribute("data-mode");

        var label = $("recoveryLabel");
        if (recoveryMode === "email") label.firstChild.textContent = "Email";
        // (firstChild trick sometimes weird; do safer:)
        label.childNodes[0].nodeValue = (recoveryMode === "email" ? "Email\n              " : "Phone\n              ");

        $("rcValue").value = "";
        $("rcValue").placeholder = recoveryMode === "email" ? "name@example.com" : "8xxxxxxx";
      });
    });

    // Forms
    $("signinForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var role = getSessionRole();
      var res = login(role, $("siUsername").value, $("siPassword").value);
      showNotice(res.msg, res.ok ? "ok" : "error");
    });

    $("registerForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var role = getSessionRole();
      var res = registerAccount(role, $("rgName").value, $("rgEmail").value, $("rgPhone").value, $("rgPassword").value);

      showNotice(res.msg, res.ok ? "ok" : "error");
      if (res.ok) {
        // Bring them to sign in (or auto-login if you want)
        setActiveView("view-signin", "Sign In");
        $("siUsername").value = res.user.username;
        $("siPassword").value = "";
      }
    });

    $("recoveryForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var role = getSessionRole();
      if (!role) return showNotice("Choose a role first.", "error");

      var res = requestOtp(role, $("rcValue").value, recoveryMode);
      showNotice(res.msg, res.ok ? "ok" : "error");
      if (res.ok) {
        setActiveView("view-otp", "OTP");
        $("otpValue").value = "";
      }
    });

    $("otpForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var res = verifyOtp($("otpValue").value);
      showNotice(res.msg, res.ok ? "ok" : "error");
      if (res.ok) setActiveView("view-reset", "Reset");
    });

    $("resetForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var res = resetPassword($("rsPassword").value, $("rsConfirm").value);
      showNotice(res.msg, res.ok ? "ok" : "error");
      if (res.ok) {
        setActiveView("view-signin", "Sign In");
        $("siPassword").value = "";
      }
    });

    // Back buttons inside recovery flow
    $("btnBackRecovery").addEventListener("click", function () {
      setActiveView("view-recovery", "Recovery");
    });
    $("btnBackOtp").addEventListener("click", function () {
      setActiveView("view-otp", "OTP");
    });

    // Logout
    $("btnLogout").addEventListener("click", function () {
      setSessionUser(null);
      showNotice("Logged out.", "ok");
    });

    // Dev: reset DB
    $("btnResetDB").addEventListener("click", function () {
      if (typeof resetDB === "function") {
        resetDB();
        setSessionUser(null);
        setSessionRole("");
        setRolePill("-");
        showNotice("DB reset to seed data.", "ok");
        setActiveView("view-role", "Role");
      } else {
        showNotice("resetDB() not found.", "error");
      }
    });

    // Initial state
    var role = getSessionRole();
    setRolePill(role);

    var sessUser = getSessionUser();
    if (sessUser) setUserPill(sessUser.username || sessUser.id);

    setActiveView("view-role", "Role");
  }

  // Run
  document.addEventListener("DOMContentLoaded", init);
})();
