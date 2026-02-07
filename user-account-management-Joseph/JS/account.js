/* account.js
   Requires db.js helpers: loadDB(), saveDB(), resetDB(), makeId()
*/

(function () {
  // ---------------------------
  // Simple session keys
  // ---------------------------
  var SESSION_USER_KEY = "hawkerSessionUser_v1";
  var SESSION_ROLE_KEY = "hawkerSessionRole_v1";

  // Recovery flow state (in-memory)
  var recoveryState = {
    resetId: null,
    userId: null
  };

  // ---------------------------
  // DOM helpers
  // ---------------------------
  function $(id) { return document.getElementById(id); }

  function on(id, evt, fn) {
    var el = $(id);
    if (el) el.addEventListener(evt, fn);
  }

  function showNotice(msg, type) {
    var n = $("notice");
    n.style.display = "block";
    n.textContent = msg;

    n.style.borderColor =
      (type === "error") ? "rgba(239,68,68,0.5)" :
      (type === "ok") ? "rgba(16,185,129,0.35)" :
      "rgba(229,231,235,1)";
  }

  function clearNotice() {
    var n = $("notice");
    n.style.display = "none";
    n.textContent = "";
    n.style.borderColor = "rgba(229,231,235,1)";
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

  function setLogoutVisible(isVisible) {
    var btn = $("btnLogout");
    if (!btn) return;
    btn.style.display = isVisible ? "inline-block" : "none";
  }

  function setActiveView(viewId, crumbText) {
    clearNotice();
    document.querySelectorAll(".view").forEach(function (v) {
      v.classList.remove("active");
    });
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
      setLogoutVisible(false);
      return;
    }
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObjOrNull));
    setUserPill(userObjOrNull.username || userObjOrNull.id || "User");
    setLogoutVisible(true);
  }

  // ---------------------------
  // Role rules (YOUR REQUIREMENT)
  // ---------------------------
  function applyRoleRules(role) {
    var isCustomer = role === "CUSTOMER";
    var isVendor = role === "VENDOR";
    var isNEA = role === "NEA";

    // Auth-home buttons
    if ($("btnGoRegister")) $("btnGoRegister").style.display = isCustomer ? "inline-block" : "none";
    if ($("btnGuest")) $("btnGuest").style.display = isCustomer ? "inline-block" : "none";

    // Sign-in page: hide register hint for vendor/NEA
    if ($("registerHintRow")) $("registerHintRow").style.display = isCustomer ? "flex" : "none";

    // Recovery only for customers
    if ($("btnForgot")) $("btnForgot").style.display = isCustomer ? "inline-block" : "none";
    if ($("navRecoveryBtn")) $("navRecoveryBtn").style.display = isCustomer ? "block" : "none";

    // NEA requires ID field
    if ($("neaIdWrap")) $("neaIdWrap").style.display = isNEA ? "block" : "none";

    // Subtitle text
    if ($("authTitle")) $("authTitle").textContent = "Sign In";
    if ($("authSubtitle")) {
      if (isCustomer) $("authSubtitle").textContent = "Customer: Sign in, register, or continue as guest.";
      if (isVendor) $("authSubtitle").textContent = "Vendor: Sign in (account is pre-registered).";
      if (isNEA) $("authSubtitle").textContent = "NEA: Sign in with ID, username and password.";
    }

    // Safety: if vendor/NEA is on recovery page, kick them back
    if (!isCustomer) {
      var active = document.querySelector(".view.active");
      if (active && active.id === "view-recovery") setActiveView("view-auth", "Sign In");
    }
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
    return /^\d{8}$/.test(s);
  }

  // Firestore wrappers 
function hasRemoteUsers() {
  return !!(window.DB?.users?.getByCredential && window.DB?.users?.create);
}

async function loginAsync(role, usernameOrEmailOrPhone, password, neaId) {
  if (!hasRemoteUsers()) return login(role, usernameOrEmailOrPhone, password, neaId);

  let user = null;

  if (role === "NEA") {
    if (!neaId) return { ok: false, msg: "NEA ID is required." };
    user = await window.DB.users.getNeaUser(neaId, usernameOrEmailOrPhone);
  } else {
    user = await window.DB.users.getByCredential(usernameOrEmailOrPhone, role);
  }

  if (!user) return { ok: false, msg: "Account not found." };
  if ((user.password || "") !== password) return { ok: false, msg: "Incorrect password." };

  setSessionUser({ id: user.id, role: user.role, username: user.username || user.email || user.phone || user.id });
  return { ok: true, user };
}

async function registerCustomerAsync(fullName, email, phone, password) {
  if (!hasRemoteUsers()) return registerAccount("CUSTOMER", fullName, email, phone, password);

  // re-use your existing validations
  if (!fullName || fullName.trim().length < 2) return { ok: false, msg: "Full name is required." };
  if (!isEmail(email)) return { ok: false, msg: "Invalid email." };
  if (!isPhone(phone)) return { ok: false, msg: "Invalid phone number." };
  if (!password || password.length < 6) return { ok: false, msg: "Password must be at least 6 chars." };

  // prevent duplicates (email/phone)
  const existsEmail = await window.DB.users.getByCredential(email, "CUSTOMER");
  const existsPhone = await window.DB.users.getByCredential(phone, "CUSTOMER");
  if (existsEmail || existsPhone) return { ok: false, msg: "Email/phone already used." };

  // username generation (ensure unique)
  const base = (email.split("@")[0] || "user").replace(/[^a-z0-9]/gi, "").slice(0, 12) || "user";
  let username = base;
  let i = 1;
  while (await window.DB.users.getByUsernameLower(username.toLowerCase())) {
    username = `${base}${i++}`;
  }

  const user = {
    id: makeId("c"),
    role: "CUSTOMER",
    fullName: fullName.trim(),
    email: email.trim(),
    phone: phone.trim(),
    username,
    password,
  };

  await window.DB.users.create(user);

  // keep your local DB too (so nothing breaks)
  const local = loadDB();
  local.users.push(user);
  saveDB(local);

  return { ok: true, user };
}

async function requestOtpAsync(mode, value) {
  // mode: "email" or "phone"
  if (!window.DB?.passwordResets?.create || !hasRemoteUsers()) return requestOtp(mode, value);

  const user = await window.DB.users.getByCredential(value, "CUSTOMER");
  if (!user) return { ok: false, msg: "No matching customer account." };

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 5 * 60 * 1000;

  const resetId = await window.DB.passwordResets.create({
    userId: user.id,
    mode,
    token: otp,
    expiresAt,
  });

  // keep your existing recoveryState usage
  recoveryState = { userId: user.id, resetId, otp, expiresAt, verified: false };
  return { ok: true, otp };
}

  // ---------------------------
  // DB helpers
  // ---------------------------
  function usernameExists(username) {
    var db = loadDB();
    var v = normalize(username).toLowerCase();
    return db.users.some(function (u) {
      return u.username && u.username.toLowerCase() === v;
    });
  }

  function findUserByUsernameOrEmailOrPhone(value, roleFilter) {
    var db = loadDB();
    var v = normalize(value).toLowerCase();

    for (var i = 0; i < db.users.length; i++) {
      var u = db.users[i];
      if (roleFilter && u.role !== roleFilter) continue;

      var usernameMatch = (u.username && u.username.toLowerCase() === v);
      var emailMatch = (u.email && u.email.toLowerCase() === v);
      var phoneMatch = (u.phone && normalize(u.phone) === v);

      if (usernameMatch || emailMatch || phoneMatch) return u;
    }
    return null;
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
  // AUTH: Register (CUSTOMER ONLY)
  // ---------------------------
  function registerAccount(role, fullName, email, phone, password) {
    // HARD RULE: only customers can register
    if (role !== "CUSTOMER") {
      return { ok: false, msg: "Only customers can register. Vendors/NEA are pre-registered." };
    }

    var db = loadDB();

    fullName = normalize(fullName);
    email = normalize(email);
    phone = normalize(phone);
    password = normalize(password);

    if (!fullName) return { ok: false, msg: "Full name is required." };
    if (!phone || !isPhone(phone)) return { ok: false, msg: "Use an 8-digit phone number." };
    if (!password || password.length < 6) return { ok: false, msg: "Password must be at least 6 characters." };

    if (email && !isEmail(email)) return { ok: false, msg: "Email format looks wrong." };

    // Prevent duplicates in CUSTOMER role
    if (findUserByUsernameOrEmailOrPhone(phone, "CUSTOMER")) return { ok: false, msg: "This phone is already used." };
    if (email && findUserByUsernameOrEmailOrPhone(email, "CUSTOMER")) return { ok: false, msg: "This email is already used." };

    // Generate username unique across all users (simple)
    var username = createUsernameFromEmailOrPhone(email, phone);
    var tries = 0;
    while (usernameExists(username) && tries < 10) {
      username = username + Math.floor(Math.random() * 10);
      tries++;
    }
    if (usernameExists(username)) username = "user" + Date.now();

    var newUser = {
      id: makeId("c"),
      role: "CUSTOMER",
      username: username,
      password: password,
      fullName: fullName,
      email: email,
      phone: phone
    };

    db.users.push(newUser);
    saveDB(db);

    return { ok: true, msg: "Registered! Your username is: " + username, user: newUser };
  }

  // ---------------------------
  // AUTH: Login
  // ---------------------------
  function login(role, usernameOrEmailOrPhone, password, neaId) {
    var db = loadDB();

    usernameOrEmailOrPhone = normalize(usernameOrEmailOrPhone);
    password = normalize(password);
    neaId = normalize(neaId);

    if (!role) return { ok: false, msg: "Choose a role first." };

    // NEA: must use ID + username + password
    if (role === "NEA") {
      if (!neaId) return { ok: false, msg: "ID is required for NEA login." };
      if (!usernameOrEmailOrPhone) return { ok: false, msg: "Username is required." };
      if (!password) return { ok: false, msg: "Password is required." };

      var uN = db.users.find(function (u) {
        return u.role === "NEA"
          && normalize(u.id).toLowerCase() === neaId.toLowerCase()
          && normalize(u.username).toLowerCase() === usernameOrEmailOrPhone.toLowerCase();
      });

      if (!uN) return { ok: false, msg: "NEA account not found (check ID / username)." };
      if (uN.password !== password) return { ok: false, msg: "Wrong password." };

      setSessionUser({ id: uN.id, role: uN.role, username: uN.username });
      return { ok: true, msg: "Signed in as NEA " + uN.username, user: uN };
    }

    // Vendor/Customer: username/email/phone + password
    if (!usernameOrEmailOrPhone || !password) {
      return { ok: false, msg: "Enter username/email/phone and password." };
    }

    var u = findUserByUsernameOrEmailOrPhone(usernameOrEmailOrPhone, role);
    if (!u) return { ok: false, msg: "Account not found for this role." };
    if (u.password !== password) return { ok: false, msg: "Wrong password." };

    setSessionUser({ id: u.id, role: u.role, username: u.username });
    return { ok: true, msg: "Signed in as " + u.username, user: u };
  }

  // ---------------------------
  // RECOVERY (CUSTOMER ONLY)
  // ---------------------------
  function generateOtp() {
    return ("" + Math.floor(100000 + Math.random() * 900000));
  }

  function requestOtp(role, value, mode) {
    // HARD RULE
    if (role !== "CUSTOMER") return { ok: false, msg: "Recovery is only for customers." };

    var db = loadDB();
    value = normalize(value);

    if (mode === "email" && !isEmail(value)) return { ok: false, msg: "Enter a valid email." };
    if (mode === "phone" && !isPhone(value)) return { ok: false, msg: "Enter an 8-digit phone number." };

    var u = findUserByUsernameOrEmailOrPhone(value, "CUSTOMER");
    if (!u) return { ok: false, msg: "No customer account matches this " + mode + "." };

    var otp = generateOtp();

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

    recoveryState.resetId = resetReq.id;
    recoveryState.userId = u.id;

    return { ok: true, msg: "OTP sent (simulation): " + otp };
  }

  function verifyOtp(otpInput) {
    var db = loadDB();
    otpInput = normalize(otpInput);

    if (!recoveryState.resetId) return { ok: false, msg: "No recovery request. Please request OTP again." };
    var rr = db.passwordResets.find(function (x) { return x.id === recoveryState.resetId; });
    if (!rr) return { ok: false, msg: "Recovery request not found. Please request OTP again." };
    if (rr.used) return { ok: false, msg: "This OTP was already used. Request a new one." };

    // Expiry 10 minutes
    var created = new Date(rr.createdDate).getTime();
    if (Date.now() - created > 10 * 60 * 1000) return { ok: false, msg: "OTP expired. Request a new one." };

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

    recoveryState.resetId = null;
    recoveryState.userId = null;

    return { ok: true, msg: "Password updated. You can sign in now." };
  }

  // ---------------------------
  // Wiring UI
  // ---------------------------
  function init() {
    // Sidebar navigation
    document.querySelectorAll(".nav-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var go = btn.getAttribute("data-go");
        var role = getSessionRole();

        if (go === "view-recovery" && role !== "CUSTOMER") {
          showNotice("Recovery is only for customers.", "error");
          return;
        }

        if (go === "view-role") setActiveView("view-role", "Role");
        if (go === "view-auth") setActiveView("view-auth", "Sign In");
        if (go === "view-recovery") setActiveView("view-recovery", "Recovery");
      });
    });

    // Role cards
    document.querySelectorAll(".card[data-role]").forEach(function (card) {
      card.addEventListener("click", function () {
        var role = card.getAttribute("data-role");
        setSessionRole(role);
        applyRoleRules(role);
        showNotice("Selected role: " + role, "ok");
      });
    });

    on("btnContinueFromRole", "click", function () {
      var role = getSessionRole();
      if (!role) return showNotice("Please choose a role first.", "error");
      applyRoleRules(role);
      setActiveView("view-auth", "Sign In");
    });

    // Auth home buttons
    on("btnGoSignin", "click", function () {
      var role = getSessionRole();
      if (!role) return showNotice("Choose a role first.", "error");
      applyRoleRules(role);
      setActiveView("view-signin", "Sign In");
    });

    on("btnGoRegister", "click", function () {
      var role = getSessionRole();
      if (role !== "CUSTOMER") return showNotice("Only customers can register.", "error");
      setActiveView("view-register", "Register");
    });

    on("btnGuest", "click", function () {
      var role = getSessionRole();
      if (role !== "CUSTOMER") return showNotice("Guest is only for customers.", "error");

      var guestId = makeId("guest");
      setSessionUser({ id: guestId, role: "GUEST", username: "guest" });
      showNotice("Continuing as guest.", "ok");
    });

    // Signin links
    on("btnForgot", "click", function () {
      var role = getSessionRole();
      if (role !== "CUSTOMER") return showNotice("Recovery is only for customers.", "error");
      setActiveView("view-recovery", "Recovery");
    });

    on("btnToRegister", "click", function () {
      var role = getSessionRole();
      if (role !== "CUSTOMER") return showNotice("Only customers can register.", "error");
      setActiveView("view-register", "Register");
    });

    // Register page
    on("btnToSignin", "click", function () {
      setActiveView("view-signin", "Sign In");
    });
    on("btnBackAuth1", "click", function () {
      setActiveView("view-auth", "Sign In");
    });
    on("btnBackAuth2", "click", function () {
      setActiveView("view-auth", "Sign In");
    });

    // Recovery tabs
    var recoveryMode = "email";
    document.querySelectorAll(".tab").forEach(function (t) {
      t.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        recoveryMode = t.getAttribute("data-mode");

        // label text
        var label = $("recoveryLabel");
        if (label) {
          label.childNodes[0].nodeValue = (recoveryMode === "email" ? "Email\n              " : "Phone\n              ");
        }

        if ($("rcValue")) {
          $("rcValue").value = "";
          $("rcValue").placeholder = recoveryMode === "email" ? "name@example.com" : "8xxxxxxx";
        }
      });
    });

    // Forms
        on("signinForm", "submit", function (e) {
      e.preventDefault();
      var role = getSessionRole();
      var neaId = (role === "NEA" && $("siNeaId")) ? $("siNeaId").value : "";

      loginAsync(role, $("siUsername").value, $("siPassword").value, neaId)
        .then(function (res) {
          showNotice(res.msg, res.ok ? "ok" : "error");
        });
    });


        on("registerForm", "submit", function (e) {
      e.preventDefault();
      var role = getSessionRole();

      registerCustomerAsync(role, $("rgName").value, $("rgEmail").value, $("rgPhone").value, $("rgPassword").value)
        .then(function (res) {
          showNotice(res.msg, res.ok ? "ok" : "error");
          if (res.ok) {
            setActiveView("view-signin", "Sign In");
            $("siUsername").value = res.user.username;
            $("siPassword").value = "";
          }
        });
    });


        on("recoveryForm", "submit", function (e) {
      e.preventDefault();
      var role = getSessionRole();
      if (role !== "CUSTOMER") return showNotice("Recovery is only for customers.", "error");

      requestOtpAsync(role, $("rcValue").value, recoveryMode)
        .then(function (res) {
          showNotice(res.msg, res.ok ? "ok" : "error");
          if (res.ok) {
            setActiveView("view-otp", "OTP");
            $("otpValue").value = "";
          }
        });
    });


    on("otpForm", "submit", function (e) {
      e.preventDefault();
      var res = verifyOtp($("otpValue").value);
      showNotice(res.msg, res.ok ? "ok" : "error");
      if (res.ok) setActiveView("view-reset", "Reset");
    });

        on("resetForm", "submit", function (e) {
      e.preventDefault();
      var res = resetPassword($("rsPassword").value, $("rsConfirm").value);
      showNotice(res.msg, res.ok ? "ok" : "error");

      if (res.ok) {
        // NEW: also sync to Firestore if available
        syncPasswordToFirestoreIfPossible(recoveryState.userId, $("rsPassword").value);

        setActiveView("view-signin", "Sign In");
        $("siPassword").value = "";
      }
    });


    on("btnBackRecovery", "click", function () {
      setActiveView("view-recovery", "Recovery");
    });
    on("btnBackOtp", "click", function () {
      setActiveView("view-otp", "OTP");
    });

    // Logout
    on("btnLogout", "click", function () {
      setSessionUser(null);
      showNotice("Logged out.", "ok");
    });

    // Initial state
    var role = getSessionRole();
    setRolePill(role);
    applyRoleRules(role);

    var sessUser = getSessionUser();
    if (sessUser) {
      setUserPill(sessUser.username || sessUser.id);
      setLogoutVisible(true);
    } else {
      setLogoutVisible(false);
    }

    setActiveView("view-role", "Role");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
