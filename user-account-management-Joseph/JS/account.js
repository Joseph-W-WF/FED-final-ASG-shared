/* account.js
   Requires db.js helpers: loadDB(), saveDB(), resetDB(), makeId()
*/

(function () {
  "use strict";

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
    if (!n) return;

    n.style.display = "block";
    n.textContent = (msg == null ? "" : String(msg));

    n.style.borderColor =
      (type === "error") ? "rgba(239,68,68,0.5)" :
      (type === "ok") ? "rgba(16,185,129,0.35)" :
      "rgba(229,231,235,1)";
  }

  function clearNotice() {
    var n = $("notice");
    if (!n) return;

    n.style.display = "none";
    n.textContent = "";
    n.style.borderColor = "rgba(229,231,235,1)";
  }

  function setCrumb(text) {
    var el = $("crumb");
    if (el) el.textContent = text;
  }

  function setRolePill(role) {
    var el = $("rolePill");
    if (el) el.textContent = "Role: " + (role || "-");
  }

  function setUserPill(text) {
    var el = $("userPill");
    if (el) el.textContent = "User: " + (text || "Guest");
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
  // Safe DB helpers (prevents crashes if db.js shape is missing)
  // ---------------------------
  function makeIdSafe(prefix) {
    if (typeof makeId === "function") return makeId(prefix);
    return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 10);
  }

  function loadDBSafe() {
    var db = (typeof loadDB === "function" ? loadDB() : null) || {};
    if (!Array.isArray(db.users)) db.users = [];
    if (!Array.isArray(db.passwordResets)) db.passwordResets = [];
    return db;
  }

  function saveDBSafe(db) {
    if (typeof saveDB === "function") saveDB(db);
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
    try { return JSON.parse(raw); } catch (e) { return null; }
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
    // simple but safe enough for this project
    return s.includes("@") && s.includes(".");
  }

  function isPhone(s) {
    s = normalize(s);
    return /^\d{8}$/.test(s);
  }

  // ---------------------------
  // Firestore bridge helpers (works even if your DB mapping differs)
  // ---------------------------
  function getRemoteUsersApi() {
    var u = window.DB && window.DB.users ? window.DB.users : null;
    return {
      getByCredential: (u && u.getByCredential) || (window.DB && window.DB.getUserByCredential) || null,
      getByUsernameLower: (u && u.getByUsernameLower) || (window.DB && window.DB.getUserByUsernameLower) || null,
      getNeaUser: (u && u.getNeaUser) || (window.DB && window.DB.getNeaUser) || null,
      create: (u && u.create) || (window.DB && window.DB.createUser) || null,
      updatePassword: (u && u.updatePassword) || (window.DB && window.DB.updateUserPassword) || null
    };
  }

  function getRemoteResetsApi() {
    var pr = window.DB && window.DB.passwordResets ? window.DB.passwordResets : null;
    return {
      create: (pr && pr.create) || (window.DB && window.DB.createPasswordReset) || null,
      getById: (pr && pr.getById) || (window.DB && window.DB.getPasswordResetById) || null,
      markUsed: (pr && pr.markUsed) || (window.DB && window.DB.markPasswordResetUsed) || null
    };
  }

  function hasRemoteUsers() {
    var api = getRemoteUsersApi();
    return !!(api.getByCredential && api.create);
  }

  // ---------------------------
  // Firestore wrappers (no UI/flow change; fallback to local)
  // ---------------------------
  async function loginAsync(role, usernameOrEmailOrPhone, password, neaId) {
    // fallback if no remote users API
    if (!hasRemoteUsers()) return login(role, usernameOrEmailOrPhone, password, neaId);

    var api = getRemoteUsersApi();
    var user = null;

    usernameOrEmailOrPhone = normalize(usernameOrEmailOrPhone);
    password = normalize(password);
    neaId = normalize(neaId);

    if (!role) return { ok: false, msg: "Choose a role first." };

    if (role === "NEA") {
      if (!neaId) return { ok: false, msg: "NEA ID is required." };
      if (!usernameOrEmailOrPhone) return { ok: false, msg: "Username is required." };
      if (!password) return { ok: false, msg: "Password is required." };

      if (!api.getNeaUser) return login(role, usernameOrEmailOrPhone, password, neaId);
      user = await api.getNeaUser(neaId, usernameOrEmailOrPhone);
    } else {
      user = await api.getByCredential(usernameOrEmailOrPhone, role);
    }

    if (!user) return { ok: false, msg: "Account not found for this role." };
    if ((user.password || "") !== password) return { ok: false, msg: "Wrong password." };

    setSessionUser({
      id: user.id,
      role: user.role,
      username: user.username || user.email || user.phone || user.id
    });

    return { ok: true, msg: "Signed in as " + (user.username || user.id), user: user };
  }

  async function registerCustomerAsync(fullName, email, phone, password) {
    // fallback if no remote users API
    if (!hasRemoteUsers()) return registerAccount("CUSTOMER", fullName, email, phone, password);

    // validations (same behavior as before)
    fullName = normalize(fullName);
    email = normalize(email);
    phone = normalize(phone);
    password = normalize(password);

    if (!fullName || fullName.length < 2) return { ok: false, msg: "Full name is required." };
    if (!isEmail(email)) return { ok: false, msg: "Invalid email." };
    if (!isPhone(phone)) return { ok: false, msg: "Use an 8-digit phone number." };
    if (!password || password.length < 6) return { ok: false, msg: "Password must be at least 6 characters." };

    var api = getRemoteUsersApi();

    // prevent duplicates (email/phone)
    var existsEmail = await api.getByCredential(email, "CUSTOMER");
    var existsPhone = await api.getByCredential(phone, "CUSTOMER");
    if (existsEmail || existsPhone) return { ok: false, msg: "This email/phone is already used." };

    // username generation (ensure unique)
    var base = (email.split("@")[0] || "user").replace(/[^a-z0-9]/gi, "").slice(0, 12) || "user";
    var username = base;
    var i = 1;
    if (api.getByUsernameLower) {
      while (await api.getByUsernameLower(username.toLowerCase())) {
        username = base + (i++);
      }
    }

    var newUser = {
      id: makeIdSafe("c"),
      role: "CUSTOMER",
      username: username,
      password: password,
      fullName: fullName,
      email: email,
      phone: phone
    };

    await api.create(newUser);

    // also keep local DB so nothing breaks if other pages still read local
    var local = loadDBSafe();
    local.users.push(newUser);
    saveDBSafe(local);

    return { ok: true, msg: "Registered! Your username is: " + username, user: newUser };
  }

  // FIXED SIGNATURE: (role, value, mode)
  async function requestOtpAsync(role, value, mode) {
    // fallback if no remote
    if (!hasRemoteUsers()) return requestOtp(role, value, mode);

    // hard rule
    if (role !== "CUSTOMER") return { ok: false, msg: "Recovery is only for customers." };

    value = normalize(value);
    if (mode === "email" && !isEmail(value)) return { ok: false, msg: "Enter a valid email." };
    if (mode === "phone" && !isPhone(value)) return { ok: false, msg: "Enter an 8-digit phone number." };

    var usersApi = getRemoteUsersApi();
    var resetsApi = getRemoteResetsApi();

    var user = await usersApi.getByCredential(value, "CUSTOMER");
    if (!user) return { ok: false, msg: "No customer account matches this " + mode + "." };

    var otp = ("" + Math.floor(100000 + Math.random() * 900000));
    var expiresAt = Date.now() + 10 * 60 * 1000; // 10 min like your local verify

    // create remote reset doc if available (optional)
    var resetId = makeIdSafe("reset");
    if (resetsApi.create) {
      try {
        // if create returns an id, use it
        var createdId = await resetsApi.create({
          userId: user.id,
          mode: mode,
          token: otp,
          expiresAt: expiresAt
        });
        if (createdId) resetId = createdId;
      } catch (e) {
        // if remote reset fails, still allow local simulation
      }
    }

    // IMPORTANT: also store locally so your existing verifyOtp() works unchanged
    var dbLocal = loadDBSafe();
    dbLocal.passwordResets.push({
      id: resetId,
      userId: user.id,
      email: (mode === "email") ? value : (user.email || ""),
      phone: (mode === "phone") ? value : (user.phone || ""),
      token: otp,
      createdDate: new Date().toISOString(),
      used: false
    });
    saveDBSafe(dbLocal);

    recoveryState.resetId = resetId;
    recoveryState.userId = user.id;

    return { ok: true, msg: "OTP sent (simulation): " + otp, otp: otp, resetId: resetId };
  }

  async function syncPasswordToFirestoreIfPossible(userId, newPassword, resetId) {
    try {
      var usersApi = getRemoteUsersApi();
      if (userId && usersApi.updatePassword) {
        await usersApi.updatePassword(userId, newPassword);
      }

      var resetsApi = getRemoteResetsApi();
      if (resetId && resetsApi.markUsed) {
        await resetsApi.markUsed(resetId);
      }
    } catch (e) {
      // keep silent; local already updated
      // console.warn("Firestore sync password failed:", e);
    }
  }

  // ---------------------------
  // DB helpers (local)
  // ---------------------------
  function usernameExists(username) {
    var db = loadDBSafe();
    var v = normalize(username).toLowerCase();
    return db.users.some(function (u) {
      return u.username && u.username.toLowerCase() === v;
    });
  }

  function findUserByUsernameOrEmailOrPhone(value, roleFilter) {
    var db = loadDBSafe();
    var vRaw = normalize(value);
    var vLower = vRaw.toLowerCase();

    for (var i = 0; i < db.users.length; i++) {
      var u = db.users[i];
      if (roleFilter && u.role !== roleFilter) continue;

      var usernameMatch = (u.username && u.username.toLowerCase() === vLower);
      var emailMatch = (u.email && u.email.toLowerCase() === vLower);
      var phoneMatch = (u.phone && normalize(u.phone) === vRaw);

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

    var db = loadDBSafe();

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
      id: makeIdSafe("c"),
      role: "CUSTOMER",
      username: username,
      password: password,
      fullName: fullName,
      email: email,
      phone: phone
    };

    db.users.push(newUser);
    saveDBSafe(db);

    return { ok: true, msg: "Registered! Your username is: " + username, user: newUser };
  }

  // ---------------------------
  // AUTH: Login (local)
  // ---------------------------
  function login(role, usernameOrEmailOrPhone, password, neaId) {
    var db = loadDBSafe();

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
  // RECOVERY (CUSTOMER ONLY) - local verify/reset
  // ---------------------------
  function requestOtp(role, value, mode) {
    if (role !== "CUSTOMER") return { ok: false, msg: "Recovery is only for customers." };

    var db = loadDBSafe();
    value = normalize(value);

    if (mode === "email" && !isEmail(value)) return { ok: false, msg: "Enter a valid email." };
    if (mode === "phone" && !isPhone(value)) return { ok: false, msg: "Enter an 8-digit phone number." };

    var u = findUserByUsernameOrEmailOrPhone(value, "CUSTOMER");
    if (!u) return { ok: false, msg: "No customer account matches this " + mode + "." };

    var otp = ("" + Math.floor(100000 + Math.random() * 900000));

    var resetReq = {
      id: makeIdSafe("reset"),
      userId: u.id,
      email: (mode === "email") ? value : (u.email || ""),
      phone: (mode === "phone") ? value : (u.phone || ""),
      token: otp,
      createdDate: new Date().toISOString(),
      used: false
    };

    db.passwordResets.push(resetReq);
    saveDBSafe(db);

    recoveryState.resetId = resetReq.id;
    recoveryState.userId = u.id;

    return { ok: true, msg: "OTP sent (simulation): " + otp };
  }

  function verifyOtp(otpInput) {
    var db = loadDBSafe();
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
    var db = loadDBSafe();

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
    saveDBSafe(db);

    // Clear recovery state (handler will capture ids BEFORE calling this)
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

      var guestId = makeIdSafe("guest");
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
        })
        .catch(function () {
          showNotice("Sign in failed due to a system error.", "error");
        });
    });

    // IMPORTANT: fixed argument order (no more email validation bug)
    on("registerForm", "submit", function (e) {
      e.preventDefault();

      registerCustomerAsync($("rgName").value, $("rgEmail").value, $("rgPhone").value, $("rgPassword").value)
        .then(function (res) {
          showNotice(res.msg, res.ok ? "ok" : "error");
          if (res.ok) {
            setActiveView("view-signin", "Sign In");
            if ($("siUsername")) $("siUsername").value = res.user.username;
            if ($("siPassword")) $("siPassword").value = "";
          }
        })
        .catch(function () {
          showNotice("Registration failed due to a system error.", "error");
        });
    });

    // FIXED: requestOtpAsync(role, value, mode)
    on("recoveryForm", "submit", function (e) {
      e.preventDefault();
      var role = getSessionRole();
      if (role !== "CUSTOMER") return showNotice("Recovery is only for customers.", "error");

      requestOtpAsync(role, $("rcValue").value, recoveryMode)
        .then(function (res) {
          showNotice(res.msg, res.ok ? "ok" : "error");
          if (res.ok) {
            setActiveView("view-otp", "OTP");
            if ($("otpValue")) $("otpValue").value = "";
          }
        })
        .catch(function () {
          showNotice("OTP request failed due to a system error.", "error");
        });
    });

    on("otpForm", "submit", function (e) {
      e.preventDefault();
      var res = verifyOtp($("otpValue").value);
      showNotice(res.msg, res.ok ? "ok" : "error");
      if (res.ok) setActiveView("view-reset", "Reset");
    });

    // FIXED: capture ids BEFORE resetPassword clears recoveryState
    on("resetForm", "submit", function (e) {
      e.preventDefault();

      var uid = recoveryState.userId;
      var rid = recoveryState.resetId;
      var newPass = $("rsPassword") ? $("rsPassword").value : "";
      var confirmPass = $("rsConfirm") ? $("rsConfirm").value : "";

      var res = resetPassword(newPass, confirmPass);
      showNotice(res.msg, res.ok ? "ok" : "error");

      if (res.ok) {
        // also sync to Firestore if available (no UI change)
        syncPasswordToFirestoreIfPossible(uid, newPass, rid);

        setActiveView("view-signin", "Sign In");
        if ($("siPassword")) $("siPassword").value = "";
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
