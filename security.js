

// ==========================================
// 🔐 CLINIC SECURITY
// ==========================================

const SECURITY_STORAGE = "clinic_security";
const SESSION_STORAGE = "clinic_session";
const ACTIVITY_STORAGE = "clinic_activity";

// ==========================================
// የመጀመሪያ Admin
// ==========================================

function initializeSecurity() {

    let security =
        localStorage.getItem(SECURITY_STORAGE);

    let parsedUsers = [];

    if (security) {

        try {

            parsedUsers =
                JSON.parse(security) || [];

        } catch (error) {

            parsedUsers = [];

        }

    }

    if (!security || parsedUsers.length === 0) {

        const admin = {

            id: "ADM-00001",

            username: "admin",

            password: "admin123",

            name: "ዋና አስተዳዳሪ",

            role: "ADMIN",

            doctorId: "",

            status: "ንቁ",

            createdAt:
                new Date().toISOString()

        };

        securityUsersCache =
            [admin];

        localStorage.setItem(
            SECURITY_STORAGE,
            JSON.stringify([admin])
        );

        if (
            typeof saveFirestoreCollection === "function"
        ) {

            saveFirestoreCollection("securityUsers");

        }

    } else if (
        securityUsersCache.length === 0
    ) {

        securityUsersCache =
            parsedUsers;

    }

}

// ==========================================
// የSecurity Users ማንበብ
// ==========================================

let securityUsersCache =
    JSON.parse(
        localStorage.getItem(
            SECURITY_STORAGE
        )
    ) || [];


function getSecurityUsers() {

    return securityUsersCache;

}

// ==========================================
// Security Users ማስቀመጥ
// ==========================================

function saveSecurityUsers(users) {

    securityUsersCache =
        users;

    localStorage.setItem(
        SECURITY_STORAGE,
        JSON.stringify(users)
    );

    if (
        typeof saveFirestoreCollection ===
        "function"
    ) {

        saveFirestoreCollection("securityUsers");

    }

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "securityUsers",

        SECURITY_STORAGE,

        function () {

            return securityUsersCache;

        },

        function (newArray) {

            securityUsersCache = newArray;

        },

        function () {

            if (
                typeof rerenderCurrentPage === "function"
            ) {

                rerenderCurrentPage();

            }

        }

    );

}


/* ==========================================
   🌐 PREFETCH (ገና login ከመግባቱ በፊት)
   ------------------------------------------
   ሌላ ስልክ ላይ አድሚን አዲስ ተጠቃሚ ልክ አሁን ፈጥሮ ከሆነ፣
   ይህ ገጹ ሲከፈት አንድ ጊዜ Firestore ን በቀጥታ ጠይቆ
   የቅርብ ጊዜውን ዝርዝር ስለሚያመጣ ወዲያውኑ መግባት ይችላሉ።
========================================== */

async function prefetchSecurityUsersFromFirestore() {

    if (
        typeof isFirebaseConfigured !== "function" ||
        !isFirebaseConfigured()
    ) {

        return;

    }

    if (
        typeof initFirebaseBackup !== "function" ||
        !initFirebaseBackup()
    ) {

        return;

    }

    try {

        const collRef =
            typeof getClinicDataCollectionRef === "function"
                ? getClinicDataCollectionRef("securityUsers")
                : null;

        if (!collRef) {

            return;

        }

        const snapshot =
            await collRef.get();

        if (!snapshot.empty) {

            securityUsersCache =
                snapshot.docs.map(
                    function (doc) {

                        return doc.data();

                    }
                );

            localStorage.setItem(
                SECURITY_STORAGE,
                JSON.stringify(securityUsersCache)
            );

        }

    } catch (error) {

        console.error(
            "Security prefetch error:",
            error
        );

    }

}

// ==========================================
// Login
// ==========================================

/* ==========================================
   🔒 PASSWORD HASHING (SHA-256)
   ------------------------------------------
   የይለፍ ቃላት ገልጠው (plaintext) እንዳይቀመጡ - ይህ
   ፋንክሽን ወደ hash ይቀይራቸዋል። አሮጌ (ገና ያልተቀየሩ)
   ቀጥተኛ password ያላቸው አካውንቶች ላይ ለውጥ ላለማምጣት፣
   loginUser() ሁለቱንም (hash እና plaintext) ማወዳደር
   ይችላል፣ በተሳካ plaintext መግቢያ ላይ በራሱ ወደ hash
   ያሳድገዋል።
========================================== */

/* ==========================================
   🔐 የይለፍ ቃል አያያዝ (PBKDF2 + ለእያንዳንዱ ተጠቃሚ የተለየ "ጨው")
   ------------------------------------------
   አዲስ ቅርጸት፦ pbkdf2$<ድግግሞሽ>$<salt>$<hash>
   አሮጌ ቅርጸቶች (SHA-256 ብቻ ወይም ገልጦ የተቀመጠ) አሁንም ይነበባሉ፤
   በተሳካ መግቢያ ላይ በራሱ ወደ አዲሱ ቅርጸት ይሻሻላሉ።
========================================== */

const PASSWORD_PBKDF2_ITERATIONS = 150000;

const DEFAULT_ADMIN_PASSWORD = "admin123";

function passwordBytesToHex(bytes) {

    return Array.from(
        new Uint8Array(bytes)
    ).map(
        function (b) {

            return b.toString(16).padStart(2, "0");

        }
    ).join("");

}

function passwordHexToBytes(hex) {

    const out = new Uint8Array(hex.length / 2);

    for (let k = 0; k < out.length; k++) {

        out[k] = parseInt(hex.substr(k * 2, 2), 16);

    }

    return out;

}

async function pbkdf2Hex(password, saltBytes, iterations) {

    const keyMaterial =
        await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(String(password)),
            "PBKDF2",
            false,
            ["deriveBits"]
        );

    const bits =
        await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                salt: saltBytes,
                iterations: iterations,
                hash: "SHA-256"
            },
            keyMaterial,
            256
        );

    return passwordBytesToHex(bits);

}

async function sha256HexLegacy(password) {

    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(String(password))
        );

    return passwordBytesToHex(hashBuffer);

}

async function hashPassword(password) {

    if (
        typeof crypto === "undefined" ||
        !crypto.subtle
    ) {

        /* ደህንነቱ ያልተጠበቀ አሳሽ (https ያልሆነ)፤ ገልጦ ከማስቀመጥ ይልቅ ስህተት እንስጥ */
        throw new Error("ይህ አሳሽ የይለፍ ቃል በደህንነት ማስቀመጥ አይችልም (https ያስፈልጋል)።");

    }

    const salt =
        crypto.getRandomValues(new Uint8Array(16));

    const hex =
        await pbkdf2Hex(
            password,
            salt,
            PASSWORD_PBKDF2_ITERATIONS
        );

    return (
        "pbkdf2$" +
        PASSWORD_PBKDF2_ITERATIONS +
        "$" +
        passwordBytesToHex(salt) +
        "$" +
        hex
    );

}

function looksLikeHash(value) {

    return (
        typeof value === "string" &&
        (
            (
                value.length === 64 &&
                /^[0-9a-f]+$/i.test(value)
            ) ||
            /^pbkdf2\$\d+\$[0-9a-f]+\$[0-9a-f]+$/i.test(value)
        )
    );

}

/* ውጤት፦ { ok: ትክክል ነው?, needsUpgrade: ወደ አዲስ ቅርጸት መሻሻል አለበት? } */
async function verifyPassword(password, stored) {

    if (typeof stored !== "string" || stored === "") {

        return { ok: false, needsUpgrade: false };

    }

    const m =
        /^pbkdf2\$(\d+)\$([0-9a-f]+)\$([0-9a-f]+)$/i.exec(stored);

    if (m) {

        const iterations = parseInt(m[1], 10);

        if (!(iterations >= 1000 && iterations <= 5000000)) {

            return { ok: false, needsUpgrade: false };

        }

        const hex =
            await pbkdf2Hex(
                password,
                passwordHexToBytes(m[2]),
                iterations
            );

        return {
            ok: hex === m[3].toLowerCase(),
            needsUpgrade: false
        };

    }

    if (looksLikeHash(stored)) {

        const legacy =
            await sha256HexLegacy(password);

        const ok =
            legacy === stored.toLowerCase();

        return { ok: ok, needsUpgrade: ok };

    }

    /* በጣም አሮጌ፦ ገልጦ የተቀመጠ */
    const ok = stored === password;

    return { ok: ok, needsUpgrade: ok };

}

async function loginUser(username, password) {

    initializeSecurity();

    const users =
        getSecurityUsers();

    const candidate =
        users.find(
            function (item) {

                return (
                    item.username === username &&
                    item.status === "ንቁ"
                );

            }
        );

    if (!candidate) {

        return {

            success: false,

            message:
                "የተጠቃሚ ስም ወይም የይለፍ ቃል ተሳስቷል"

        };

    }

    const passwordCheck =
        await verifyPassword(
            password,
            candidate.password
        );

    const passwordMatches =
        passwordCheck.ok;

    if (
        passwordMatches &&
        passwordCheck.needsUpgrade
    ) {

        candidate.password =
            await hashPassword(password);

        saveSecurityUsers(users);

    }

    if (!passwordMatches) {

        return {

            success: false,

            message:
                "የተጠቃሚ ስም ወይም የይለፍ ቃል ተሳስቷል"

        };

    }

    /* ⚠️ ደህንነት፦ የመጀመሪያው ነባሪ የይለፍ ቃል (admin123) እንደተጠቀመ እንዲቀይር ይገደዳል */
    if (
        (await verifyPassword(
            DEFAULT_ADMIN_PASSWORD,
            candidate.password
        )).ok
    ) {

        return {

            success: false,

            mustChangePassword: true,

            userId: candidate.id,

            message:
                "ነባሪውን የይለፍ ቃል መቀየር አለብዎት"

        };

    }

    const user =
        candidate;

    const session = {

        userId:
            user.id,

        username:
            user.username,

        name:
            user.name,

        role:
            user.role,

        doctorId:
            user.doctorId || "",

        loginTime:
            new Date().toISOString()

    };

    sessionStorage.setItem(
        SESSION_STORAGE,
        JSON.stringify(session)
    );

    logActivity(
        user.id,
        user.name,
        "LOGIN",
        "ወደ ሲስተሙ ገባ"
    );

    return {

        success: true,

        user: session

    };

}

// ==========================================
// Logout
// ==========================================

function logoutUser() {

    const session =
        getCurrentSession();

    if (session) {

        logActivity(
            session.userId,
            session.name,
            "LOGOUT",
            "ከሲስተሙ ወጣ"
        );

    }

    sessionStorage.removeItem(
        SESSION_STORAGE
    );

}

// ==========================================
// Current User
// ==========================================

function getCurrentSession() {

    try {

        return JSON.parse(
            sessionStorage.getItem(
                SESSION_STORAGE
            )
        ) || null;

    } catch (error) {

        return null;

    }

}

// ==========================================
// Login መኖሩን ማረጋገጥ
// ==========================================

function isLoggedIn() {

    return getCurrentSession() !== null;

}

// ==========================================
// Admin መሆኑን ማረጋገጥ
// ==========================================

function isAdmin() {

    const session =
        getCurrentSession();

    return (
        session &&
        session.role === "ADMIN"
    );

}

// ==========================================
// ዶክተር መሆኑን ማረጋገጥ
// ==========================================

function isDoctorRole() {

    const session =
        getCurrentSession();

    return (
        session &&
        session.role === "DOCTOR"
    );

}


function getCurrentDoctorId() {

    const session =
        getCurrentSession();

    return (
        session && session.doctorId
    ) || "";

}


/* ==========================================
   🏷️ የስራ ክፍል ስሞች (department -> pageId)
========================================== */

const DEPARTMENT_PAGES = {

    "patients":
        "ካርድ ክፍል",

    "payments":
        "ካሸር",

    "laboratory":
        "ላቦራቶሪ",

    "radiology":
        "ራጅ/ኤክስሬይ",

    "pharmacy":
        "ፋርማሲ",

    "emergency":
        "🚨 ኤመርጀንሲ"

};


function departmentLabel(pageId) {

    return (
        DEPARTMENT_PAGES[pageId] ||
        pageId
    );

}


/* ==========================================
   🏠 የተጠቃሚ ራሱ ገጽ (home page)
========================================== */

function getUserHomePage(user) {

    if (!user) {

        return "";

    }

    if (user.role === "DOCTOR") {

        return "doctors";

    }

    return user.department || "";

}


/* ==========================================
   🔐 ለተለያዩ ገጾች - የይለፍ ቃል በማወቅ ብቻ መግባት
   (አድሚን ሁልጊዜ ይችላል፣ የራሱ ክፍል ያለው ተጠቃሚ ደግሞ
   የራሱን ገጽ ያለ ፍቃድ ይገባል፣ ሌላ ግን Username/Password
   ማወቅ አለበት)
========================================== */

async function verifyDepartmentAccess(
    pageId,
    username,
    password
) {

    const users =
        getSecurityUsers();

    const candidate =
        users.find(
            function (item) {

                return (
                    item.username === username &&
                    item.status === "ንቁ"
                );

            }
        );

    if (!candidate) {

        return false;

    }

    const passwordMatches =
        (await verifyPassword(
            password,
            candidate.password
        )).ok;

    if (!passwordMatches) {

        return false;

    }

    /* ነባሪ የይለፍ ቃል ያለው ተጠቃሚ ወደ ክፍል መግባት አይችልም */
    if (
        (await verifyPassword(
            DEFAULT_ADMIN_PASSWORD,
            candidate.password
        )).ok
    ) {

        return false;

    }

    const user =
        candidate;

    if (user.role === "ADMIN") {

        return true;

    }

    return (
        getUserHomePage(user) === pageId
    );

}

// ==========================================
// User መፍጠር
// ==========================================

async function createSecurityUser(userData) {

    if (!isAdmin()) {

        return {

            success: false,

            message:
                "ይህን ስራ ለማድረግ Admin መሆን አለብዎት"

        };

    }

    const users =
        getSecurityUsers();

    const exists =
        users.some(
            user =>
                user.username ===
                userData.username
        );

    if (exists) {

        return {

            success: false,

            message:
                "ይህ Username አስቀድሞ አለ"

        };

    }

    const newUser = {

        id:
            "USR-" +
            Date.now(),

        username:
            userData.username || "",

        password:
            await hashPassword(
                userData.password || ""
            ),

        name:
            userData.name || "",

        role:
            userData.role || "USER",

        department:
            userData.department || "",

        doctorId:
            userData.doctorId || "",

        status:
            "ንቁ",

        createdAt:
            new Date().toISOString()

    };

    users.push(newUser);

    saveSecurityUsers(users);

    logActivity(
        newUser.id,
        newUser.name,
        "CREATE_USER",
        "አዲስ ተጠቃሚ ተፈጠረ"
    );

    return {

        success: true,

        user: newUser

    };

}

// ==========================================
// 🩺 የዶክተር መግቢያ (username/password) ማስተዳደር
// doctors.js ዶክተር ሲፈጥር/ሲያርም ይህን ይጠራል
// ==========================================

async function createDoctorLogin(
    doctorId,
    username,
    password,
    fullName
) {

    const users =
        getSecurityUsers();

    const cleanUsername =
        String(username || "").trim();

    const cleanPassword =
        String(password || "").trim();

    if (
        !cleanUsername ||
        !cleanPassword
    ) {

        return {

            success: false,

            message:
                "የተጠቃሚ ስም እና የይለፍ ቃል ያስፈልጋል"

        };

    }

    const usernameTaken =
        users.some(
            function (user) {

                return (
                    user.username ===
                        cleanUsername &&
                    user.doctorId !== doctorId
                );

            }
        );

    if (usernameTaken) {

        return {

            success: false,

            message:
                "ይህ Username ቀድሞ ተይዟል"

        };

    }

    const newUser = {

        id:
            "USR-" +
            Date.now(),

        username:
            cleanUsername,

        password:
            await hashPassword(cleanPassword),

        name:
            fullName || "",

        role:
            "DOCTOR",

        doctorId:
            doctorId,

        status:
            "ንቁ",

        createdAt:
            new Date().toISOString()

    };

    users.push(newUser);

    saveSecurityUsers(users);

    return {

        success: true,

        user: newUser

    };

}


async function updateDoctorLogin(
    doctorId,
    username,
    password,
    fullName
) {

    const users =
        getSecurityUsers();

    const existing =
        users.find(
            function (user) {

                return (
                    user.doctorId ===
                        doctorId &&
                    user.role === "DOCTOR"
                );

            }
        );

    if (!existing) {

        if (username && password) {

            return createDoctorLogin(
                doctorId,
                username,
                password,
                fullName
            );

        }

        return {
            success: true
        };

    }

    const cleanUsername =
        String(username || "").trim();

    const cleanPassword =
        String(password || "").trim();

    if (cleanUsername) {

        const usernameTaken =
            users.some(
                function (user) {

                    return (
                        user.username ===
                            cleanUsername &&
                        user.id !== existing.id
                    );

                }
            );

        if (usernameTaken) {

            return {

                success: false,

                message:
                    "ይህ Username ቀድሞ ተይዟል"

            };

        }

        existing.username =
            cleanUsername;

    }

    if (cleanPassword) {

        existing.password =
            await hashPassword(cleanPassword);

    }

    existing.name =
        fullName || existing.name;

    saveSecurityUsers(users);

    return {

        success: true,

        user: existing

    };

}


function getDoctorLogin(doctorId) {

    return getSecurityUsers().find(
        function (user) {

            return (
                user.doctorId === doctorId &&
                user.role === "DOCTOR"
            );

        }
    ) || null;

}


function removeDoctorLogin(doctorId) {

    const allUsers =
        getSecurityUsers();

    const removedUser =
        allUsers.find(
            function (user) {

                return (
                    user.doctorId === doctorId &&
                    user.role === "DOCTOR"
                );

            }
        );

    const users =
        allUsers.filter(
            function (user) {

                return !(
                    user.doctorId === doctorId &&
                    user.role === "DOCTOR"
                );

            }
        );

    saveSecurityUsers(users);

    if (
        removedUser &&
        typeof deleteFirestoreDoc === "function"
    ) {

        deleteFirestoreDoc("securityUsers", removedUser.id);

    }

}

// ==========================================
// User ማቦዘን
// ==========================================

function deactivateSecurityUser(userId) {

    if (!isAdmin()) {

        return false;

    }

    const users =
        getSecurityUsers();

    const index =
        users.findIndex(
            user =>
                user.id === userId
        );

    if (index === -1) {

        return false;

    }

    users[index].status =
        "ቦዝኗል";

    saveSecurityUsers(users);

    logActivity(
        userId,
        users[index].name,
        "DEACTIVATE_USER",
        "ተጠቃሚው ታግዷል"
    );

    return true;

}

// ==========================================
// User ማንቃት
// ==========================================

function activateSecurityUser(userId) {

    if (!isAdmin()) {

        return false;

    }

    const users =
        getSecurityUsers();

    const index =
        users.findIndex(
            user =>
                user.id === userId
        );

    if (index === -1) {

        return false;

    }

    users[index].status =
        "ንቁ";

    saveSecurityUsers(users);

    logActivity(
        userId,
        users[index].name,
        "ACTIVATE_USER",
        "ተጠቃሚው ነቅቷል"
    );

    return true;

}

// ==========================================
// 🗑️ User ሙሉ በሙሉ ማጥፋት (ስራ የለቀቀ ሰራተኛ)
// ------------------------------------------
// ይህ ከ"ማገድ" (deactivate) የተለየ ነው - አካውንቱን
// ከዝርዝሩ ላይ ሙሉ በሙሉ ያስወግደዋል፣ መመለስ አይቻልም።
// Admin ብቻ ይህን ማድረግ ይችላል፣ የራሱን አካውንት ወይም
// የመጨረሻውን ንቁ Admin ማጥፋት አይችልም (ሲስተሙ ላይ
// ማንም Admin እንዳይቀር ለመከላከል)።
// ==========================================

function deleteSecurityUser(userId) {

    if (!isAdmin()) {

        return {

            success: false,

            message:
                "ይህን ስራ ለማድረግ Admin መሆን አለብዎት"

        };

    }

    const users =
        getSecurityUsers();

    const target =
        users.find(
            user =>
                user.id === userId
        );

    if (!target) {

        return {

            success: false,

            message:
                "ተጠቃሚው አልተገኘም"

        };

    }

    const session =
        getCurrentSession();

    if (
        session &&
        session.userId === userId
    ) {

        return {

            success: false,

            message:
                "የራስዎን አካውንት ማጥፋት አይችሉም"

        };

    }

    if (target.role === "ADMIN") {

        const activeAdminCount =
            users.filter(
                user =>
                    user.role === "ADMIN" &&
                    user.status === "ንቁ"
            ).length;

        if (activeAdminCount <= 1) {

            return {

                success: false,

                message:
                    "የመጨረሻውን ንቁ Admin ማጥፋት አይችሉም"

            };

        }

    }

    const remainingUsers =
        users.filter(
            user =>
                user.id !== userId
        );

    saveSecurityUsers(remainingUsers);

    if (
        typeof deleteFirestoreDoc === "function"
    ) {

        deleteFirestoreDoc("securityUsers", userId);

    }

    logActivity(
        session ? session.userId : userId,
        session ? session.name : target.name,
        "DELETE_USER",
        target.name + " ("+ target.username +") ሙሉ በሙሉ ጠፍቷል"
    );

    return {

        success: true

    };

}

// ==========================================
// Activity Log
// ==========================================

let activityLogsCache =
    JSON.parse(
        localStorage.getItem(
            ACTIVITY_STORAGE
        )
    ) || [];


function getActivityLogs() {

    return activityLogsCache;

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "activityLogs",

        ACTIVITY_STORAGE,

        function () {

            return activityLogsCache;

        },

        function (newArray) {

            activityLogsCache = newArray;

        },

        function () {

            if (
                typeof rerenderCurrentPage === "function"
            ) {

                rerenderCurrentPage();

            }

        }

    );

}

// ==========================================
// Activity መመዝገብ
// ==========================================

function logActivity(
    userId,
    userName,
    action,
    description
) {

    const logs =
        getActivityLogs();

    logs.push({

        id:
            "LOG-" +
            Date.now(),

        userId:
            userId || "",

        userName:
            userName || "",

        action:
            action || "",

        description:
            description || "",

        date:
            new Date().toISOString()

    });

    activityLogsCache =
        logs;

    localStorage.setItem(
        ACTIVITY_STORAGE,
        JSON.stringify(logs)
    );

    if (
        typeof saveFirestoreCollection === "function"
    ) {

        saveFirestoreCollection("activityLogs");

    }

}

// ==========================================
// የታካሚ History ላይ Activity መመዝገብ
// ==========================================

function logPatientAccess(
    patientId,
    action
) {

    const session =
        getCurrentSession();

    if (!session) {

        return false;

    }

    logActivity(

        session.userId,

        session.name,

        action,

        "Patient ID: " +
        patientId

    );

    return true;

}

// ==========================================
// የዶክተር መረጃ መዝገብ
// ==========================================

function logDoctorAction(
    doctorId,
    action
) {

    const session =
        getCurrentSession();

    if (!session) {

        return false;

    }

    logActivity(

        session.userId,

        session.name,

        action,

        "Doctor ID: " +
        doctorId

    );

    return true;

}

// ==========================================
// ሙሉ Activity History
// ==========================================

function getFullActivityHistory() {

    return getActivityLogs()
        .sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );

}

// ==========================================
// 🛡️ SAFE TEXT
// ==========================================

function escapeSecurityText(value) {

    return String(
        value ?? ""
    )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

// ==========================================
// 🔑 LOGIN FORM SETUP
// ==========================================

/* ==========================================
   🔑 ነባሪ የይለፍ ቃል መቀየሪያ
========================================== */

async function changeDefaultPassword(userId, newPassword) {

    const pwd = String(newPassword || "");

    if (pwd.length < 8) {

        return { success: false, message: "የይለፍ ቃሉ ቢያንስ 8 ፊደል/ቁጥር መሆን አለበት" };

    }

    if (pwd === DEFAULT_ADMIN_PASSWORD) {

        return { success: false, message: "አዲሱ የይለፍ ቃል ከነባሪው የተለየ መሆን አለበት" };

    }

    const users =
        getSecurityUsers();

    const target =
        users.find(
            function (item) {

                return item.id === userId;

            }
        );

    if (!target) {

        return { success: false, message: "ተጠቃሚው አልተገኘም" };

    }

    /* ይህ ተግባር የሚሰራው ነባሪ የይለፍ ቃል ላለው ተጠቃሚ ብቻ ነው */
    if (
        !(await verifyPassword(
            DEFAULT_ADMIN_PASSWORD,
            target.password
        )).ok
    ) {

        return { success: false, message: "ይህ ተጠቃሚ ነባሪ የይለፍ ቃል የለውም" };

    }

    target.password =
        await hashPassword(pwd);

    saveSecurityUsers(users);

    return { success: true };

}

/* ይለፍ ቃል የሚያስገባ ሙሉ ማያ (ጽሑፉ በኮከብ ይደበቃል)። ሲሰረዝ null ይመልሳል። */
function askNewPasswordOverlay() {

    return new Promise(
        function (resolve) {

            const wrap =
                document.createElement("div");

            wrap.style.cssText =
                "position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;";

            const box =
                document.createElement("div");

            box.style.cssText =
                "background:#fff;color:#222;border-radius:12px;padding:20px;width:100%;max-width:380px;font-family:sans-serif;";

            box.innerHTML =
                '<h3 style="margin:0 0 8px;">🔑 የይለፍ ቃል ይቀይሩ</h3>' +
                '<p style="margin:0 0 12px;font-size:14px;line-height:1.5;">ለደህንነት ሲባል ነባሪውን የይለፍ ቃል መቀየር አለብዎት። ቢያንስ 8 ፊደል/ቁጥር ይሁን።</p>' +
                '<input id="mpNew1" type="password" autocomplete="new-password" placeholder="አዲስ የይለፍ ቃል" style="width:100%;padding:10px;margin-bottom:8px;box-sizing:border-box;">' +
                '<input id="mpNew2" type="password" autocomplete="new-password" placeholder="አዲሱን እንደገና ያስገቡ" style="width:100%;padding:10px;margin-bottom:8px;box-sizing:border-box;">' +
                '<p id="mpErr" style="color:#c0392b;font-size:13px;min-height:18px;margin:0 0 8px;"></p>' +
                '<button id="mpOk" style="padding:10px 16px;">✔ ቀይር</button> ' +
                '<button id="mpCancel" style="padding:10px 16px;">ተወው</button>';

            wrap.appendChild(box);

            document.body.appendChild(wrap);

            function done(value) {

                document.body.removeChild(wrap);

                resolve(value);

            }

            box.querySelector("#mpCancel").onclick =
                function () { done(null); };

            box.querySelector("#mpOk").onclick =
                function () {

                    const a = box.querySelector("#mpNew1").value;

                    const b = box.querySelector("#mpNew2").value;

                    const err = box.querySelector("#mpErr");

                    if (a.length < 8) {

                        err.textContent = "ቢያንስ 8 ፊደል/ቁጥር ያስፈልጋል";

                        return;

                    }

                    if (a === DEFAULT_ADMIN_PASSWORD) {

                        err.textContent = "ከነባሪው የተለየ ይሁን";

                        return;

                    }

                    if (a !== b) {

                        err.textContent = "ሁለቱ አይመሳሰሉም";

                        return;

                    }

                    done(a);

                };

            box.querySelector("#mpNew1").focus();

        }
    );

}

function setupLoginForm() {

    const form =
        document.getElementById(
            "loginForm"
        );

    if (!form) {

        return;

    }

    if (form.dataset.ready === "true") {

        return;

    }

    form.dataset.ready = "true";

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const username =
                document.getElementById(
                    "loginUsername"
                ).value.trim();

            const password =
                document.getElementById(
                    "loginPassword"
                ).value;

            let result =
                await loginUser(
                    username,
                    password
                );

            if (result.mustChangePassword) {

                const newPassword =
                    await askNewPasswordOverlay();

                if (newPassword) {

                    const changed =
                        await changeDefaultPassword(
                            result.userId,
                            newPassword
                        );

                    if (changed.success) {

                        result =
                            await loginUser(
                                username,
                                newPassword
                            );

                    } else {

                        result = {
                            success: false,
                            message: changed.message
                        };

                    }

                } else {

                    result = {
                        success: false,
                        message:
                            "ነባሪውን የይለፍ ቃል መቀየር ግዴታ ነው"
                    };

                }

            }

            const errorBox =
                document.getElementById(
                    "loginError"
                );

            if (!result.success) {

                if (errorBox) {

                    errorBox.textContent =
                        result.message;

                }

                return;

            }

            if (errorBox) {

                errorBox.textContent = "";

            }

            form.reset();

            if (
                typeof showApp ===
                "function"
            ) {

                showApp();

            }

        }
    );

}

// ==========================================
// 🔐 DISPLAY SECURITY PAGE
// ==========================================

function displaySecurity() {

    const container =
        document.getElementById(
            "securityContent"
        );

    if (!container) {

        return;

    }

    const session =
        getCurrentSession();

    let html = `

        <div class="security-info">

            <h2>
                🔐 የመግቢያ መረጃ
            </h2>

            <p>
                ገብተዋል እንደ:
                <strong>
                    ${escapeSecurityText(
                        session ? session.name : "-"
                    )}
                </strong>
                (${escapeSecurityText(
                    session ? session.role : "-"
                )})
            </p>

        </div>

        <hr>

    `;

    if (isAdmin()) {

        html += `

            <div class="security-form-container">

                <h2>
                    📢 ማስታወቂያ እና ጥያቄዎች
                </h2>

                <div id="noticesAdminPanel"></div>

            </div>

            <hr>

        `;

    }

    if (isAdmin()) {

        html += `

            <div class="security-form-container">

                <h2>
                    ➕ አዲስ ተጠቃሚ መመዝገቢያ
                </h2>

                <p style="color:#52606d; font-size:14px;">
                    ማስታወሻ: የዶክተር መግቢያ ራሱ
                    "ዶክተሮች" ገጽ ላይ ዶክተር ሲመዘገብ
                    አብሮ ይፈጠራል። እዚህ የሚመዘገቡት
                    ካርድ ክፍል፣ ካሸር፣ ላቦራቶሪ፣ ፋርማሲ
                    ሰራተኞች ናቸው።
                </p>

                <form
                    id="securityUserForm"
                    class="clinic-form"
                >

                    <label>
                        የተጠቃሚ ስም *
                    </label>

                    <input
                        type="text"
                        id="secUsername"
                        required
                    >

                    <label>
                        የይለፍ ቃል *
                    </label>

                    <input
                        type="text"
                        id="secPassword"
                        required
                    >

                    <label>
                        ሙሉ ስም *
                    </label>

                    <input
                        type="text"
                        id="secFullName"
                        required
                    >

                    <label>
                        ሚና (Role) *
                    </label>

                    <select
                        id="secRole"
                        required
                        onchange="toggleSecDepartmentField()"
                    >

                        <option value="USER">
                            ተጠቃሚ (የስራ ክፍል ሰራተኛ)
                        </option>

                        <option value="ADMIN">
                            አስተዳዳሪ (ADMIN)
                        </option>

                    </select>

                    <label id="secDepartmentLabel">
                        የስራ ክፍል *
                    </label>

                    <select id="secDepartment">

                        <option value="patients">
                            🗂️ ካርድ ክፍል
                        </option>

                        <option value="payments">
                            💰 ካሸር
                        </option>

                        <option value="laboratory">
                            🧪 ላቦራቶሪ
                        </option>

                        <option value="radiology">
                            🩻 ራጅ/ኤክስሬይ
                        </option>

                        <option value="pharmacy">
                            💊 ፋርማሲ
                        </option>

                        <option value="emergency">
                            🚨 ኤመርጀንሲ
                        </option>

                    </select>

                    <button type="submit">
                        💾 ተጠቃሚ መዝግብ
                    </button>

                </form>

            </div>

            <hr>

            <div class="security-list-container">

                <h2>
                    👥 የተመዘገቡ ተጠቃሚዎች
                </h2>

                <div id="securityUserList"></div>

            </div>

            <hr>

        `;

    }

    if (isAdmin()) {

        const deviceId =
            typeof getDeviceId ===
            "function"
                ? getDeviceId()
                : "-";

        html += `

            <div class="security-form-container">

                <h2>
                    🔒 የመሳሪያ ፍቃድ (Device License)
                </h2>

                <p>
                    Device ID:
                    <strong>${escapeSecurityText(deviceId)}</strong>
                </p>

            </div>

            <hr>

        `;

        const cloudConfigured =
            typeof isFirebaseConfigured ===
            "function" &&
            isFirebaseConfigured();

        const clinicId =
            typeof getClinicBackupId ===
            "function"
                ? getClinicBackupId()
                : "-";

        const lastBackup =
            typeof getLastBackupTimeText ===
            "function"
                ? getLastBackupTimeText()
                : "-";

        html += `

            <div class="security-form-container cloud-backup-box">

                <h2>
                    ☁️ Cloud Backup
                </h2>

                ${
                    cloudConfigured
                    ? `
                        <p>
                            🆔 Clinic ID:
                            <strong>${escapeSecurityText(clinicId)}</strong>
                            <button onclick="copyClinicId()" style="margin-left:6px;">📋 ኮፒ</button>
                        </p>
                        <p style="font-size:12px;">
                            ⚠️ ይህ ID የክሊኒኩ ሚስጥራዊ ቁልፍ ነው፤ ለክሊኒኩ መሳሪያዎች ብቻ ይስጡ።
                        </p>

                        <p>
                            🕒 የመጨረሻ Backup:
                            <span id="lastBackupTimeDisplay">${escapeSecurityText(lastBackup)}</span>
                        </p>

                        <button onclick="backupToCloud()">
                            ☁️ አሁን Backup አድርግ
                        </button>

                        <hr>

                        <h3>
                            📥 ከCloud ውሂብ መልስ (Restore)
                        </h3>

                        <p class="backup-warning">
                            ⚠️ ይህ በስልኩ ላይ ያለውን ውሂብ ይተካል!
                        </p>

                        <input
                            type="text"
                            id="restoreClinicIdInput"
                            placeholder="Clinic ID ያስገቡ"
                        >

                        <button onclick="handleRestoreFromCloud()">
                            📥 ውሂብ መልስ
                        </button>
                    `
                    : `
                        <p>
                            ☁️ Cloud Backup ገና አልተዋቀረም። ገንቢውን (Claude) ያናግሩ Firebase project ለማዋቀር።
                        </p>
                    `
                }

            </div>

            <hr>

            <div class="security-form-container danger-zone-box">

                <h2>
                    ⚠️ አደገኛ ቀጣና (Danger Zone)
                </h2>

                <p class="backup-warning">
                    ⚠️ ይህ ታካሚ፣ ዶክተር፣ ላብ፣ ራጅ፣ ፋርማሲ፣ ክፍያ እና
                    ወጪ ውሂብ ሁሉንም ለዘላለም ያጠፋል።
                    <strong>መመለስ አይቻልም!</strong>
                    Admin login፣ License፣ ማስታወቂያ (notices)፣
                    Recycle Bin እና Activity Log ግን አይነኩም -
                    ወዲያውኑ ባዶ ስርዓት ሆኖ መስራት ይችላሉ (ለምሳሌ
                    ለአዲስ ክሊኒክ ስልክ ሲያዘጋጁ ይጠቅማል)።
                </p>

                <input
                    type="text"
                    id="factoryResetConfirmInput"
                    placeholder="ለማረጋገጫ 'ደምስስ' ብለው ይጻፉ"
                >

                <button
                    onclick="handleFactoryReset()"
                    style="background:#c0392b;"
                >
                    🗑️ ውሂብ ብቻ ደምስስ (Factory Reset)
                </button>

            </div>

            <hr>

        `;

    }

    html += `

        <div class="security-activity-container">

            <h2>
                📜 የቅርብ ጊዜ Activity
            </h2>

            <div id="securityActivityList"></div>

        </div>

    `;

    container.innerHTML = html;

    if (isAdmin()) {

        setupSecurityUserForm();

        renderSecurityUsersList();

        if (
            typeof renderNoticesAdminPanel === "function"
        ) {

            renderNoticesAdminPanel();

        }

    }

    renderSecurityActivityList();

}

// ==========================================
// 👥 SETUP + RENDER USERS
// ==========================================

function setupSecurityUserForm() {

    const form =
        document.getElementById(
            "securityUserForm"
        );

    if (!form) {

        return;

    }

    toggleSecDepartmentField();

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const role =
                document.getElementById(
                    "secRole"
                ).value;

            const data = {

                username:
                    document.getElementById(
                        "secUsername"
                    ).value.trim(),

                password:
                    document.getElementById(
                        "secPassword"
                    ).value,

                name:
                    document.getElementById(
                        "secFullName"
                    ).value.trim(),

                role:
                    role,

                department:
                    role === "USER"
                        ? document.getElementById(
                            "secDepartment"
                        ).value
                        : ""

            };

            const result =
                await createSecurityUser(data);

            if (!result.success) {

                alert(result.message);

                return;

            }

            alert(
                "✅ ተጠቃሚው በትክክል ተመዝግቧል።"
            );

            displaySecurity();

        }
    );

}


function toggleSecDepartmentField() {

    const roleSelect =
        document.getElementById(
            "secRole"
        );

    const departmentSelect =
        document.getElementById(
            "secDepartment"
        );

    const departmentLabelEl =
        document.getElementById(
            "secDepartmentLabel"
        );

    if (
        !roleSelect ||
        !departmentSelect ||
        !departmentLabelEl
    ) {

        return;

    }

    const isUserRole =
        roleSelect.value === "USER";

    departmentSelect.style.display =
        isUserRole ? "block" : "none";

    departmentLabelEl.style.display =
        isUserRole ? "block" : "none";

}


function renderSecurityUsersList() {

    const list =
        document.getElementById(
            "securityUserList"
        );

    if (!list) {

        return;

    }

    const users =
        getSecurityUsers();

    if (users.length === 0) {

        list.innerHTML = `
            <p>
                ምንም ተጠቃሚ አልተገኘም።
            </p>
        `;

        return;

    }

    const roleNames = {

        ADMIN: "አስተዳዳሪ",

        USER: "ተጠቃሚ",

        DOCTOR: "ዶክተር"

    };

    const currentSession =
        getCurrentSession();

    list.innerHTML =
        users.map(
            function (user) {

                const isSelf =
                    currentSession &&
                    currentSession.userId === user.id;

                return `

                    <div class="patient-item">

                        <h3>
                            👤
                            ${escapeSecurityText(user.name)}
                        </h3>

                        <p>
                            <strong>
                                Username:
                            </strong>
                            ${escapeSecurityText(user.username)}
                        </p>

                        <p>
                            <strong>
                                ሚና:
                            </strong>
                            ${escapeSecurityText(
                                roleNames[user.role] || user.role
                            )}
                            ${
                                user.role === "DOCTOR" && user.doctorId
                                ? " (" + escapeSecurityText(user.doctorId) + ")"
                                : ""
                            }
                            ${
                                user.role === "USER" && user.department
                                ? " - " + escapeSecurityText(departmentLabel(user.department))
                                : ""
                            }
                        </p>

                        <p>
                            <strong>
                                ሁኔታ:
                            </strong>
                            ${escapeSecurityText(user.status)}
                        </p>

                        ${
                            user.status === "ንቁ"
                            ? `<button onclick="handleDeactivateUser('${user.id}')">🚫 አግድ</button>`
                            : `<button onclick="handleActivateUser('${user.id}')">✅ ንቁ አድርግ</button>`
                        }

                        ${
                            isSelf
                            ? ""
                            : `<button
                                onclick="handleDeleteUser('${user.id}', '${escapeSecurityText(user.name)}')"
                                style="background:#c0392b;"
                            >
                                🗑️ ሙሉ በሙሉ አጥፋ
                            </button>`
                        }

                    </div>

                `;

            }
        ).join("");

}


function handleDeleteUser(userId, userName) {

    const confirmDelete =
        confirm(
            "«" + userName + "» ን ሙሉ በሙሉ ማጥፋት ይፈልጋሉ?\n\n⚠️ ይህ ተግባር መመለስ አይቻልም - ተጠቃሚው ከዝርዝሩ ላይ ለዘላለም ይጠፋል።"
        );

    if (!confirmDelete) {

        return;

    }

    const result =
        deleteSecurityUser(userId);

    if (!result.success) {

        alert(result.message);

        return;

    }

    alert(
        "✅ ተጠቃሚው ሙሉ በሙሉ ጠፍቷል።"
    );

    displaySecurity();

}


function handleDeactivateUser(userId) {

    const confirmAction =
        confirm(
            "ይህን ተጠቃሚ ማገድ ይፈልጋሉ?"
        );

    if (!confirmAction) {

        return;

    }

    deactivateSecurityUser(userId);

    displaySecurity();

}


function handleActivateUser(userId) {

    activateSecurityUser(userId);

    displaySecurity();

}


function renderSecurityActivityList() {

    const list =
        document.getElementById(
            "securityActivityList"
        );

    if (!list) {

        return;

    }

    const logs =
        getFullActivityHistory()
            .slice(0, 20);

    if (logs.length === 0) {

        list.innerHTML = `
            <p>
                ምንም Activity አልተመዘገበም።
            </p>
        `;

        return;

    }

    list.innerHTML =
        logs.map(
            function (log) {

                return `

                    <div class="patient-item">

                        <p>
                            <strong>
                                ${escapeSecurityText(log.action)}
                            </strong>
                            -
                            ${escapeSecurityText(log.userName)}
                        </p>

                        <p>
                            ${escapeSecurityText(log.description)}
                        </p>

                        <p>
                            🕒
                            ${
                                formatEthiopianDateTime(
                                    log.date
                                )
                            }
                        </p>

                    </div>

                `;

            }
        ).join("");

}

// ==========================================
// ገጹ ሲከፈት
// ==========================================

/* ==========================================
   🗑️ FACTORY RESET (ውሂብ ብቻ)
   ------------------------------------------
   ታካሚ / ዶክተር / ላብ / ራጅ / ፋርማሲ / ክፍያ / ወጪ
   ብቻ ያጠፋል። Admin login, License, notices,
   recycle bin, activity log አይነኩም።
   Firestore ላይም array-diff ውሂብ ስለማይሰርዝ
   (upsert-only) እያንዳንዱን document በቀጥታ
   deleteFirestoreDoc() በመጠቀም እናጠፋለን።
========================================== */

function handleFactoryReset() {

    if (!isAdmin()) {

        alert(
            "ይህን ስራ ለማድረግ Admin መሆን አለብዎት"
        );

        return;

    }

    const input =
        document.getElementById(
            "factoryResetConfirmInput"
        );

    const typed =
        input ? input.value.trim() : "";

    if (typed !== "ደምስስ") {

        alert(
            "ለማረጋገጫ በትክክል «ደምስስ» ብለው መጻፍ አለብዎት።"
        );

        return;

    }

    const confirmed =
        confirm(
            "እርግጠኛ ነዎት? ታካሚ፣ ዶክተር፣ ላብ፣ ራጅ፣ ፋርማሲ፣ ክፍያ እና ወጪ ውሂብ ሁሉ ለዘላለም ይጠፋል።\n\nይህ መመለስ አይቻልም!"
        );

    if (!confirmed) {

        return;

    }

    const result =
        factoryResetClinicalData();

    alert(
        "✅ ውሂቡ ጠርጓል።\n\n" +
        "ታካሚ: " + result.counts.patients + "\n" +
        "ዶክተር: " + result.counts.doctors + "\n" +
        "ላብ: " + result.counts.laboratoryOrders + "\n" +
        "ራጅ: " + result.counts.radiologyOrders + "\n" +
        "ፋርማሲ: " + result.counts.pharmacyPrescriptions + "\n" +
        "ምርመራ (diagnostics): " + result.counts.diagnosticRequests + "\n" +
        "ክፍያ: " + result.counts.payments + "\n" +
        "ወጪ: " + result.counts.expenses
    );

    if (input) {

        input.value = "";

    }

    displaySecurity();

}


function factoryResetClinicalData() {

    const counts = {

        patients: 0,
        doctors: 0,
        laboratoryOrders: 0,
        radiologyOrders: 0,
        pharmacyPrescriptions: 0,
        diagnosticRequests: 0,
        payments: 0,
        expenses: 0

    };

    function wipeCollection(collectionName, items, clearFn) {

        counts[collectionName] = items.length;

        items.forEach(function (item) {

            if (
                item &&
                item.id &&
                typeof deleteFirestoreDoc === "function"
            ) {

                deleteFirestoreDoc(
                    collectionName,
                    item.id
                );

            }

        });

        clearFn();

    }

    // ታካሚ (patients)
    if (
        typeof getAllPatients === "function" &&
        typeof patients !== "undefined"
    ) {

        wipeCollection(
            "patients",
            getAllPatients(),
            function () {

                patients = [];

                savePatients();

            }
        );

    }

    // ዶክተር (doctor roster)
    if (
        typeof getDoctors === "function" &&
        typeof doctors !== "undefined"
    ) {

        wipeCollection(
            "doctors",
            getDoctors(),
            function () {

                doctors = [];

                saveDoctors();

            }
        );

    }

    // ላብ ትዕዛዞች
    if (
        typeof getLaboratoryOrders === "function" &&
        typeof laboratoryOrders !== "undefined"
    ) {

        wipeCollection(
            "laboratoryOrders",
            getLaboratoryOrders(),
            function () {

                laboratoryOrders = [];

                saveLaboratoryOrders();

            }
        );

    }

    // ራጅ ትዕዛዞች
    if (
        typeof getRadiologyOrders === "function" &&
        typeof radiologyOrders !== "undefined"
    ) {

        wipeCollection(
            "radiologyOrders",
            getRadiologyOrders(),
            function () {

                radiologyOrders = [];

                saveRadiologyOrders();

            }
        );

    }

    // ፋርማሲ ማዘዣዎች
    if (
        typeof getPharmacyPrescriptions === "function" &&
        typeof savePharmacyPrescriptions === "function"
    ) {

        wipeCollection(
            "pharmacyPrescriptions",
            getPharmacyPrescriptions(),
            function () {

                savePharmacyPrescriptions([]);

            }
        );

    }

    // ምርመራ ጥያቄዎች (diagnostics)
    if (
        typeof getDiagnosticRequests === "function" &&
        typeof saveDiagnosticRequests === "function"
    ) {

        wipeCollection(
            "diagnosticRequests",
            getDiagnosticRequests(),
            function () {

                saveDiagnosticRequests([]);

            }
        );

    }

    // ክፍያ
    if (
        typeof getPayments === "function" &&
        typeof savePayments === "function"
    ) {

        wipeCollection(
            "payments",
            getPayments(),
            function () {

                savePayments([]);

            }
        );

    }

    // ወጪ
    if (
        typeof getExpenses === "function" &&
        typeof saveExpenses === "function"
    ) {

        wipeCollection(
            "expenses",
            getExpenses(),
            function () {

                saveExpenses([]);

            }
        );

    }

    const session =
        typeof getCurrentSession === "function"
            ? getCurrentSession()
            : null;

    if (typeof logActivity === "function") {

        logActivity(
            session ? session.userId : "-",
            session ? session.name : "-",
            "FACTORY_RESET",
            "ታካሚ/ዶክተር/ላብ/ራጅ/ፋርማሲ/ክፍያ/ወጪ ውሂብ ጠርጓል"
        );

    }

    return {

        success: true,

        counts: counts

    };

}


document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeSecurity();

        setupLoginForm();

        if (
            typeof prefetchSecurityUsersFromFirestore ===
            "function"
        ) {

            prefetchSecurityUsersFromFirestore();

        }

    }
);