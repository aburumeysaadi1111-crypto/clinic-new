

/* ==========================================
   🔒 LICENSE / ACTIVATION SYSTEM
   ------------------------------------------
   እያንዳንዱ መሳሪያ (ስልክ) የራሱ ልዩ Device ID አለው።
   ደንበኛው ይህን Device ID ለ Abdulaziz ይልካል፣
   Abdulaziz በFirebase Console ላይ (Firestore ->
   license collection) ፈቃድ ይሰጠዋል፣ ከዚያ
   ብቻ አፑ ይከፈታል።

   ገንቢው (Abdulaziz) ኮድ መጻፍ ወይም keygen ፋይል
   መጠቀም አያስፈልገውም - ሁሉም ነገር Firebase Console
   ላይ በጣት ንክኪ ብቻ ይከናወናል።
========================================== */

const LICENSE_COLLECTION =
    "license";

const DEVICE_ID_STORAGE =
    "clinicDeviceId";

const LICENSE_VALID_STORAGE =
    "clinicLicenseValid";

const LICENSE_CHECKED_AT_STORAGE =
    "clinicLicenseCheckedAt";

const LICENSE_GRACE_DAYS =
    7;


/* ==========================================
   🆔 DEVICE ID (permanent per phone/install)
========================================== */

function getDeviceId() {

    let id =
        localStorage.getItem(
            DEVICE_ID_STORAGE
        );

    if (!id) {

        id =
            "DEV-" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase() +
            Date.now()
                .toString(36)
                .toUpperCase();

        localStorage.setItem(
            DEVICE_ID_STORAGE,
            id
        );

    }

    return id;

}


/* ==========================================
   ⏳ GRACE PERIOD (offline days allowed
   since last successful online check)
========================================== */

function isWithinLicenseGracePeriod() {

    const checkedAt =
        localStorage.getItem(
            LICENSE_CHECKED_AT_STORAGE
        );

    const valid =
        localStorage.getItem(
            LICENSE_VALID_STORAGE
        );

    if (
        valid !== "true" ||
        !checkedAt
    ) {

        return false;

    }

    const elapsedMs =
        Date.now() -
        new Date(checkedAt).getTime();

    const graceMs =
        LICENSE_GRACE_DAYS *
        24 * 60 * 60 * 1000;

    return elapsedMs < graceMs;

}


/* ==========================================
   🌐 CHECK LICENSE ONLINE (Firestore)
========================================== */

async function checkLicenseOnline() {

    if (
        typeof initFirebaseBackup !==
            "function" ||
        !initFirebaseBackup()
    ) {

        return {
            ok: false,
            reason: "no-connection"
        };

    }

    const deviceId =
        getDeviceId();

    try {

        /* ደንቡ መግባትን ስለሚጠይቅ መጀመሪያ መግቢያው መጠናቀቅ አለበት */
        if (!(await waitForFirebaseAuth())) {

            return {
                ok: false,
                reason: "no-connection"
            };

        }

        /* ሁልጊዜ ከአገልጋዩ ያነባል (ከስልኩ cache አይደለም)፤ ያለዚያ ኢንተርኔት
           ሳይኖር የድሮ "ፈቃድ አለው" መልስ ተደግሞ የ7 ቀን ገደቡ ያለ ገደብ ይታደስ ነበር */
        const docSnapshot =
            await firestoreDb
                .collection(LICENSE_COLLECTION)
                .doc(deviceId)
                .get({ source: "server" });

        if (
            docSnapshot.exists &&
            docSnapshot.data().active === true
        ) {

            localStorage.setItem(
                LICENSE_VALID_STORAGE,
                "true"
            );

            localStorage.setItem(
                LICENSE_CHECKED_AT_STORAGE,
                new Date().toISOString()
            );

            return {
                ok: true
            };

        }

        localStorage.setItem(
            LICENSE_VALID_STORAGE,
            "false"
        );

        return {
            ok: false,
            reason: "not-licensed"
        };

    } catch (error) {

        return {
            ok: false,
            reason: "error",
            error: error
        };

    }

}


/* ==========================================
   🚦 MAIN GATE - runs before login screen
========================================== */

async function verifyLicenseAndProceed() {

    if (isWithinLicenseGracePeriod()) {

        proceedPastActivation();

        /* ጸጥ ብሎ ደግሞ ያረጋግጣል፣
           grace timer ለማደስ */

        checkLicenseOnline();

        return;

    }

    showActivationChecking();

    const result =
        await checkLicenseOnline();

    if (result.ok) {

        proceedPastActivation();

    } else if (
        result.reason === "no-connection" ||
        result.reason === "error"
    ) {

        showActivationScreen("offline");

    } else {

        showActivationScreen("not-licensed");

    }

}


/* ==========================================
   ✅ PASS - hide activation, continue to login
========================================== */

function proceedPastActivation() {

    const activationScreen =
        document.getElementById(
            "activationScreen"
        );

    if (activationScreen) {

        activationScreen.style.display =
            "none";

    }

    if (
        typeof checkLoginAndInit ===
        "function"
    ) {

        checkLoginAndInit();

    }

}


/* ==========================================
   🖥️ SCREEN HELPERS
========================================== */

function showActivationChecking() {

    const screen =
        document.getElementById(
            "activationScreen"
        );

    const idBox =
        document.getElementById(
            "deviceIdDisplay"
        );

    const statusBox =
        document.getElementById(
            "activationStatus"
        );

    if (idBox) {

        idBox.textContent =
            getDeviceId();

    }

    if (statusBox) {

        statusBox.textContent =
            "🔄 እየተረጋገጠ ነው...";

    }

    hideLoginAndApp();

    if (screen) {

        screen.style.display =
            "flex";

    }

}


function showActivationScreen(reason) {

    const screen =
        document.getElementById(
            "activationScreen"
        );

    const idBox =
        document.getElementById(
            "deviceIdDisplay"
        );

    const statusBox =
        document.getElementById(
            "activationStatus"
        );

    if (idBox) {

        idBox.textContent =
            getDeviceId();

    }

    if (statusBox) {

        if (reason === "offline") {

            statusBox.textContent =
                "📡 ኢንተርኔት የለም ወይም Cloud Backup ገና አልተዋቀረም። ኢንተርኔት ካገናኙ በኋላ 'እንደገና ሞክር' ይጫኑ።";

        } else {

            statusBox.textContent =
                "🔒 ይህ መሳሪያ ገና አልተፈቀደም። ከላይ ያለውን Device ID ገልብጠው ለሻጭዎ ይላኩና ፍቃድ ይጠይቁ።";

        }

    }

    hideLoginAndApp();

    if (screen) {

        screen.style.display =
            "flex";

    }

}


function hideLoginAndApp() {

    const loginScreen =
        document.getElementById(
            "loginScreen"
        );

    const appContainer =
        document.getElementById(
            "appContainer"
        );

    if (loginScreen) {

        loginScreen.style.display =
            "none";

    }

    if (appContainer) {

        appContainer.style.display =
            "none";

    }

}


function handleRetryActivation() {

    verifyLicenseAndProceed();

}


/* ==========================================
   📋 COPY DEVICE ID (ገዢው ስህተት ሳይሰራ ለሻጭ
   እንዲልክ - በእጅ መገልበጥ ስህተት/ስንኝ ማጣት ያስቀራል)
========================================== */

function copyDeviceIdToClipboard() {

    const deviceId =
        getDeviceId();

    if (
        navigator.clipboard &&
        navigator.clipboard.writeText
    ) {

        navigator.clipboard
            .writeText(deviceId)
            .then(
                function () {

                    alert(
                        "✅ ተኮፒ ተደርጓል! አሁን ለሻጭዎ (Telegram/SMS/WhatsApp) ይለጥፉት።"
                    );

                }
            )
            .catch(
                function () {

                    fallbackCopyDeviceId(
                        deviceId
                    );

                }
            );

        return;

    }

    fallbackCopyDeviceId(deviceId);

}


function fallbackCopyDeviceId(deviceId) {

    const tempInput =
        document.createElement(
            "textarea"
        );

    tempInput.value =
        deviceId;

    tempInput.style.position =
        "fixed";

    tempInput.style.opacity =
        "0";

    document.body.appendChild(
        tempInput
    );

    tempInput.focus();

    tempInput.select();

    try {

        document.execCommand(
            "copy"
        );

        alert(
            "✅ ተኮፒ ተደርጓል! አሁን ለሻጭዎ (Telegram/SMS/WhatsApp) ይለጥፉት።"
        );

    } catch (error) {

        alert(
            "❌ ራሱ በራሱ መገልበጥ አልተሳካም። ከላይ ያለውን Device ID በእጅ ይምረጡና ይገልብጡ፦\n\n" +
            deviceId
        );

    }

    document.body.removeChild(
        tempInput
    );

}


/* ==========================================
   🚀 START (this replaces app.js as the
   first thing that runs)
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        verifyLicenseAndProceed();

    }
);