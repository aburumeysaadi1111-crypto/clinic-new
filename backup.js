

/* ==========================================
   ☁️ CLOUD BACKUP (Firebase Firestore)
   ------------------------------------------
   ይህ ፋይል ከ Firebase ፕሮጀክት ጋር መገናኛ ነው፤ የፕሮጀክቱ መረጃ
   (firebaseConfig) ይፋ መሆኑ ችግር የለውም - ደህንነቱ የሚጠበቀው
   በ Firestore Rules እና በረጅሙ ሚስጥራዊ Clinic ID ነው።
========================================== */

const firebaseConfig = {

    apiKey:
        "AIzaSyDnAHczybT6_kyHnZSGvGhKE6-_9pzshXc",

    authDomain:
        "clinic-new-4489d.firebaseapp.com",

    projectId:
        "clinic-new-4489d",

    storageBucket:
        "clinic-new-4489d.firebasestorage.app",

    messagingSenderId:
        "1001818355910",

    appId:
        "1:1001818355910:web:fb12dc6184de5698d0bfc7"

};


/* ==========================================
   💾 WHICH localStorage KEYS TO BACK UP
========================================== */

const CLINIC_BACKUP_KEYS = [

    "clinicPatients",

    "clinicDoctors",

    "clinicLaboratoryOrders",

    "clinicRadiologyOrders",

    "clinic_diagnostic_requests",

    "clinic_pharmacy",

    "clinicCustomMedicines",

    "clinicCustomLabTests",

    "clinic_payments",

    "clinic_expenses",

    "clinic_recycle",

    "clinic_notices",

    "clinic_phem_facility",

    "clinic_phem_reports",

    "clinic_security",

    "clinic_activity",

    "clinic_reports"

];

const CLINIC_ID_STORAGE =
    "clinicBackupId";

const LAST_BACKUP_STORAGE =
    "clinicLastBackupTime";

const BACKUP_HASHES_STORAGE =
    "clinicBackupHashes";

/* አንድ Firestore ሰነድ ከ1 MiB መብለጥ አይችልም፤ አማርኛ ፊደል 3 ባይት ስለሆነ
   በ200,000 ፊደል እንቆርጣለን (≈600 KB) */
const BACKUP_CHUNK_CHARS =
    200000;

let firebaseReady = false;

let firebaseAuthStarted = false;

let firebaseAuthPromise = null;

let firestoreDb = null;

let backupInProgress = false;


/* ==========================================
   🔍 IS FIREBASE CONFIGURED?
========================================== */

function isFirebaseConfigured() {

    return (
        firebaseConfig.apiKey &&
        firebaseConfig.apiKey.indexOf("YOUR_") === -1
    );

}


/* ==========================================
   🚀 INIT FIREBASE (lazy, once)
========================================== */

function initFirebaseBackup() {

    if (firebaseReady) {

        return true;

    }

    if (!isFirebaseConfigured()) {

        return false;

    }

    if (typeof firebase === "undefined") {

        return false;

    }

    try {

        firebase.initializeApp(
            firebaseConfig
        );

        firestoreDb =
            firebase.firestore();

        /* ኢንተርኔት ሲቋረጥ የተደረጉ ለውጦች በስልኩ ውስጥ ተቀምጠው
           ኢንተርኔት ሲመለስ ወደ ደመና እንዲሄዱ፣ እና የሚነበበው
           (ወጪ) እንዲቀንስ */
        try {

            firestoreDb
                .enablePersistence({ synchronizeTabs: true })
                .catch(
                    function (error) {

                        console.warn(
                            "Firestore offline cache አልበራም:",
                            error && error.code
                        );

                    }
                );

        } catch (error) {

            console.warn(error);

        }

        if (
            firebase.auth &&
            !firebaseAuthStarted
        ) {

            firebaseAuthStarted = true;

            firebaseAuthPromise =
                new Promise(
                    function (resolve) {

                        const unsubscribe =
                            firebase.auth()
                                .onAuthStateChanged(
                                    function (user) {

                                        if (user) {

                                            try { unsubscribe(); } catch (e) {}

                                            resolve(true);

                                        }

                                    }
                                );

                        firebase.auth()
                            .signInAnonymously()
                            .catch(
                                function (error) {

                                    /* ኢንተርኔት ከሌለ ቀደም ሲል የተቀመጠ መግቢያ ካለ
                                       onAuthStateChanged ራሱ ይፈታዋል */
                                    console.error(
                                        "Firebase anonymous auth failed:",
                                        error
                                    );

                                }
                            );

                        setTimeout(
                            function () { resolve(false); },
                            20000
                        );

                    }
                );

        }

        firebaseReady = true;

        return true;

    } catch (error) {

        console.error(error);

        return false;

    }

}


/* ==========================================
   🔑 መግቢያው (anonymous sign-in) እስኪጠናቀቅ መጠበቅ
   (Firestore ደንቡ መግባትን ስለሚጠይቅ ማንኛውም ንባብ/ጽሑፍ
   ከዚህ በኋላ ብቻ መደረግ አለበት)
========================================== */

async function waitForFirebaseAuth() {

    if (!initFirebaseBackup()) {

        return false;

    }

    try {

        if (firebase.auth().currentUser) {

            return true;

        }

        if (firebaseAuthPromise) {

            await firebaseAuthPromise;

        }

        return !!firebase.auth().currentUser;

    } catch (error) {

        return false;

    }

}


/* ==========================================
   🆔 CLINIC BACKUP ID
   ------------------------------------------
   ይህ ID የክሊኒኩ ዳታ "ሚስጥራዊ ቁልፍ" ነው፤ ማንም ይህን ID የሚያውቅ
   ሰው ዳታውን ማንበብ ይችላል። ስለዚህ 128-bit ዘፈቀደ ነው፣ እና
   ለክሊኒኩ ስልኮች/ኮምፒውተሮች ብቻ ይሰጥ።
========================================== */

function isValidClinicId(id) {

    return /^CLINIC-[0-9A-F]{32}$/.test(
        String(id || "")
    );

}

function generateClinicId() {

    const bytes =
        new Uint8Array(16);

    crypto.getRandomValues(bytes);

    return (
        "CLINIC-" +
        Array.from(bytes).map(
            function (b) {

                return b.toString(16).padStart(2, "0");

            }
        ).join("").toUpperCase()
    );

}

function getClinicBackupId() {

    let id =
        localStorage.getItem(
            CLINIC_ID_STORAGE
        );

    if (!isValidClinicId(id)) {

        id = generateClinicId();

        localStorage.setItem(
            CLINIC_ID_STORAGE,
            id
        );

    }

    return id;

}

/* ትክክለኛ ID ከሆነ ያስቀምጣል እና true ይመልሳል */
function setClinicBackupId(id) {

    const clean =
        String(id || "").trim().toUpperCase();

    if (!isValidClinicId(clean)) {

        return false;

    }

    localStorage.setItem(
        CLINIC_ID_STORAGE,
        clean
    );

    return true;

}

function copyClinicId() {

    const id =
        getClinicBackupId();

    function ok() {

        alert("✅ Clinic ID ተኮፒ ተደርጓል። ለክሊኒኩ መሳሪያዎች ብቻ ይስጡ፤ ለሌላ ማንም አይላኩ።");

    }

    function fallback() {

        const t =
            document.createElement("textarea");

        t.value = id;

        t.style.position = "fixed";

        t.style.opacity = "0";

        document.body.appendChild(t);

        t.focus();

        t.select();

        try {

            document.execCommand("copy");

            ok();

        } catch (e) {

            alert("በእጅ ይገልብጡ፦\n\n" + id);

        }

        document.body.removeChild(t);

    }

    if (
        navigator.clipboard &&
        navigator.clipboard.writeText
    ) {

        navigator.clipboard.writeText(id).then(ok).catch(fallback);

    } else {

        fallback();

    }

}


/* ==========================================
   🕒 LAST BACKUP TIME (display text)
========================================== */

function getLastBackupTimeText() {

    const time =
        localStorage.getItem(
            LAST_BACKUP_STORAGE
        );

    if (!time) {

        return "እስካሁን Backup አልተደረገም";

    }

    return formatEthiopianDateTime(time);

}


/* ==========================================
   📦 COLLECT DATA TO BACK UP
========================================== */

function collectBackupData() {

    const data = {};

    CLINIC_BACKUP_KEYS.forEach(
        function (key) {

            data[key] =
                localStorage.getItem(key) ||
                null;

        }
    );

    return data;

}


/* ==========================================
   🧮 ለውጥ ያልተደረገበትን እንዳይደግም (የ Firestore ነጻ ገደብ ለመቆጠብ)
========================================== */

function quickHash(text) {

    let h = 5381;

    for (let i = 0; i < text.length; i++) {

        h = ((h << 5) + h + text.charCodeAt(i)) | 0;

    }

    return text.length + ":" + (h >>> 0).toString(16);

}

function readBackupHashes(clinicId) {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(BACKUP_HASHES_STORAGE) || "null"
            );

        if (saved && saved.clinicId === clinicId && saved.h) {

            return saved.h;

        }

    } catch (e) {}

    return {};

}

function writeBackupHashes(clinicId, hashes) {

    localStorage.setItem(
        BACKUP_HASHES_STORAGE,
        JSON.stringify({ clinicId: clinicId, h: hashes })
    );

}

function backupDocRef(clinicId, docId) {

    return firestoreDb
        .collection("clinicBackups")
        .doc(clinicId)
        .collection("keys")
        .doc(docId);

}

/* አንድ ቁልፍን በቁርጥራጭ ይጭናል (ቁርጥራጭ 0 የመጨረሻ ይጻፋል) */
async function uploadBackupKey(clinicId, key, value) {

    const chunks = [];

    for (let i = 0; i < value.length; i += BACKUP_CHUNK_CHARS) {

        chunks.push(
            value.slice(i, i + BACKUP_CHUNK_CHARS)
        );

    }

    if (chunks.length === 0) {

        chunks.push("");

    }

    const now =
        new Date().toISOString();

    for (let i = chunks.length - 1; i >= 0; i--) {

        await backupDocRef(
            clinicId,
            i === 0 ? key : key + "__" + i
        ).set({
            v: chunks[i],
            n: chunks.length,
            updatedAt: now
        });

    }

}

/* ውጤት፦ { ok, uploaded, reason } */
async function runCloudBackup(force) {

    if (backupInProgress) {

        return { ok: false, reason: "busy" };

    }

    if (!initFirebaseBackup()) {

        return { ok: false, reason: "not-configured" };

    }

    if (!(await waitForFirebaseAuth())) {

        return { ok: false, reason: "no-auth" };

    }

    backupInProgress = true;

    try {

        const clinicId =
            getClinicBackupId();

        const data =
            collectBackupData();

        const hashes =
            readBackupHashes(clinicId);

        let uploaded = 0;

        for (const key of CLINIC_BACKUP_KEYS) {

            const value = data[key];

            if (value === null || value === undefined) {

                continue;

            }

            const h = quickHash(value);

            if (!force && hashes[key] === h) {

                continue;

            }

            await uploadBackupKey(clinicId, key, value);

            hashes[key] = h;

            writeBackupHashes(clinicId, hashes);

            uploaded++;

        }

        localStorage.setItem(
            LAST_BACKUP_STORAGE,
            new Date().toISOString()
        );

        const timeDisplay =
            document.getElementById(
                "lastBackupTimeDisplay"
            );

        if (timeDisplay) {

            timeDisplay.textContent =
                getLastBackupTimeText();

        }

        return { ok: true, uploaded: uploaded };

    } catch (error) {

        console.error("Backup failed:", error);

        return { ok: false, reason: "error", error: error };

    } finally {

        backupInProgress = false;

    }

}


/* ==========================================
   🤫 SILENT AUTO-BACKUP
   (ውሂብ ሲቀየር በራሱ ጊዜ ወደ Cloud ይላካል፣
   ምንም alert ወይም ማስታወቂያ አይታይም)
========================================== */

let autoBackupTimer = null;

const AUTO_BACKUP_DEBOUNCE_MS =
    20000;

const AUTO_BACKUP_INTERVAL_MS =
    5 * 60 * 1000;

function scheduleAutoBackup() {

    if (!isFirebaseConfigured()) {

        return;

    }

    if (autoBackupTimer) {

        clearTimeout(autoBackupTimer);

    }

    autoBackupTimer =
        setTimeout(
            function () {

                silentBackupToCloud();

            },
            AUTO_BACKUP_DEBOUNCE_MS
        );

}

async function silentBackupToCloud() {

    await runCloudBackup(false);

}

let autoBackupLoopStarted = false;

function startAutoBackupLoop() {

    if (!isFirebaseConfigured()) {

        return;

    }

    if (autoBackupLoopStarted) {

        return;

    }

    autoBackupLoopStarted = true;

    silentBackupToCloud();

    setInterval(
        function () {

            silentBackupToCloud();

        },
        AUTO_BACKUP_INTERVAL_MS
    );

    document.addEventListener(
        "visibilitychange",
        function () {

            if (
                document.visibilityState ===
                "hidden"
            ) {

                silentBackupToCloud();

            }

        }
    );

}


/* ==========================================
   ☁️ BACKUP NOW (manual button - shows alerts)
========================================== */

async function backupToCloud() {

    if (!initFirebaseBackup()) {

        alert(
            "❌ Cloud Backup ገና አልተዋቀረም ወይም ኢንተርኔት የለም። ገንቢውን ያናግሩ።"
        );

        return;

    }

    const result =
        await runCloudBackup(true);

    if (!result.ok) {

        alert(
            result.reason === "busy"
                ? "⏳ Backup አሁን እየተደረገ ነው፣ ጥቂት ቆይተው ይሞክሩ።"
                : "❌ Backup አልተሳካም። ኢንተርኔት ያረጋግጡ እና እንደገና ይሞክሩ።"
        );

        return;

    }

    alert(

        "✅ ውሂቡ በትክክል ወደ Cloud ተቀምጧል።\n\n" +

        "🆔 Clinic ID: " +
        getClinicBackupId() +

        "\n\nይህን ID በሌላ መሳሪያ ላይ ተጠቅመው ውሂቡን መልሰው ማምጣት ይችላሉ። " +
        "ID ሚስጥር ነው፤ ለክሊኒኩ መሳሪያዎች ብቻ ይስጡ።"

    );

    if (
        typeof displaySecurity ===
        "function"
    ) {

        displaySecurity();

    }

}


/* ==========================================
   📥 RESTORE FROM CLOUD
========================================== */

async function readBackupKey(clinicId, key) {

    const first =
        await backupDocRef(clinicId, key).get({ source: "server" });

    if (!first.exists) {

        return null;

    }

    const head = first.data();

    const total =
        Number(head.n) || 1;

    let value =
        String(head.v || "");

    for (let i = 1; i < total; i++) {

        const part =
            await backupDocRef(
                clinicId,
                key + "__" + i
            ).get({ source: "server" });

        if (!part.exists) {

            throw new Error("የመጠባበቂያ ቁርጥራጭ ጎድሏል (" + key + ")");

        }

        value += String(part.data().v || "");

    }

    return value;

}

async function restoreFromCloud(
    inputClinicId
) {

    if (!initFirebaseBackup()) {

        alert(
            "❌ Cloud Backup ገና አልተዋቀረም ወይም ኢንተርኔት የለም። ገንቢውን ያናግሩ።"
        );

        return;

    }

    const clinicId =
        String(
            inputClinicId ||
            getClinicBackupId()
        ).trim().toUpperCase();

    if (!clinicId) {

        alert(
            "Clinic ID ያስገቡ።"
        );

        return;

    }

    if (!isValidClinicId(clinicId)) {

        alert(
            "❌ የClinic ID ቅርጸት ትክክል አይደለም። ከ CLINIC- ጀምሮ ሙሉውን በትክክል ይገልብጡ።"
        );

        return;

    }

    const confirmRestore =
        confirm(

            "⚠️ ማስጠንቀቂያ!\n\n" +

            "ይህ በዚህ ስልክ ላይ ያለውን ውሂብ ሁሉ ይሰርዝና በCloud ላይ በዚህ Clinic ID የተቀመጠውን ውሂብ ይተካዋል።\n\n" +

            "እርግጠኛ ነዎት?"

        );

    if (!confirmRestore) {

        return;

    }

    try {

        if (!(await waitForFirebaseAuth())) {

            alert("❌ ከደመና ጋር መገናኘት አልተቻለም። ኢንተርኔት ያረጋግጡ።");

            return;

        }

        const restored = {};

        let count = 0;

        for (const key of CLINIC_BACKUP_KEYS) {

            const value =
                await readBackupKey(clinicId, key);

            if (value !== null) {

                restored[key] = value;

                count++;

            }

        }

        if (count === 0) {

            alert(
                "❌ በዚህ Clinic ID ምንም የተቀመጠ ውሂብ አልተገኘም። ID ትክክል መሆኑን ያረጋግጡ።"
            );

            return;

        }

        Object.keys(restored).forEach(
            function (key) {

                localStorage.setItem(
                    key,
                    restored[key]
                );

            }
        );

        setClinicBackupId(clinicId);

        localStorage.removeItem(BACKUP_HASHES_STORAGE);

        alert(
            "✅ ውሂቡ ተመልሷል! ገጹ እንደገና ይከፈታል።"
        );

        location.reload();

    } catch (error) {

        alert(
            "❌ ስህተት ተፈጥሯል፦ " +
            error.message
        );

    }

}


/* ==========================================
   🖱️ RESTORE BUTTON HANDLER (reads the input box)
========================================== */

function handleRestoreFromCloud() {

    const input =
        document.getElementById(
            "restoreClinicIdInput"
        );

    const value =
        input
            ? input.value.trim()
            : "";

    restoreFromCloud(
        value || getClinicBackupId()
    );

}
