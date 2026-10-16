

/* ==========================================
   🏥 CLINIC SYSTEM - APP
========================================== */

let currentVisiblePageId =
    "dashboard";


function getCurrentVisiblePageId() {

    return currentVisiblePageId;

}


function showPage(pageId) {

    currentVisiblePageId =
        pageId;

    const pages =
        document.querySelectorAll(
            ".page-section"
        );


    pages.forEach(
        function(page) {

            page.style.display = "none";

        }
    );


    const selectedPage =
        document.getElementById(
            pageId
        );


    if (selectedPage) {

        selectedPage.style.display =
            "block";

    }


    /* ======================================
       PAGE TITLE
    ====================================== */

    const title =
        document.querySelector(
            ".page-title"
        );


    const titles = {

        dashboard: "ዳሽቦርድ",

        patients: "ካርድ ክፍል",

        doctors: "ሀኪሞች",

        laboratory: "ላቦራቶሪ",

        radiology: "ራጅ/ኤክስሬይ",

        pharmacy: "ፋርማሲ",

        payments: "ካሸር",

        emergency: "🚨 ኤመርጀንሲ",

        reports: "ሪፖርት",

        security: "ደህንነት",

        recycle: "ቆሻሻ ማጠራቀሚያ"

    };


    if (
        title &&
        titles[pageId]
    ) {

        title.textContent =
            titles[pageId];

    }


    /* ======================================
       LOAD DOCTORS PAGE
    ====================================== */

    if (
        pageId === "doctors" &&
        typeof displayDoctors === "function"
    ) {

        displayDoctors();

    }


    /* ======================================
       LOAD PATIENTS PAGE
    ====================================== */

    if (
        pageId === "patients" &&
        typeof displayPatients === "function"
    ) {

        displayPatients();

    }


    /* ======================================
       LOAD LABORATORY PAGE
    ====================================== */

    if (
        pageId === "laboratory" &&
        typeof displayLaboratory === "function"
    ) {

        displayLaboratory();

    }


    /* ======================================
       LOAD RADIOLOGY PAGE
    ====================================== */

    if (
        pageId === "radiology" &&
        typeof displayRadiology === "function"
    ) {

        displayRadiology();

    }


    /* ======================================
       LOAD PHARMACY PAGE
    ====================================== */

    if (
        pageId === "pharmacy" &&
        typeof displayPharmacy === "function"
    ) {

        displayPharmacy();

    }


    /* ======================================
       LOAD EMERGENCY PAGE
    ====================================== */

    if (
        pageId === "emergency" &&
        typeof displayEmergency === "function"
    ) {

        displayEmergency();

    }


    /* ======================================
       LOAD PAYMENTS PAGE
    ====================================== */

    if (
        pageId === "payments" &&
        typeof displayPayments === "function"
    ) {

        displayPayments();

    }


    /* ======================================
       LOAD REPORTS PAGE
    ====================================== */

    if (
        pageId === "reports" &&
        typeof displayReports === "function"
    ) {

        displayReports();

    }


    /* ======================================
       LOAD SECURITY PAGE
    ====================================== */

    if (
        pageId === "security" &&
        typeof displaySecurity === "function"
    ) {

        displaySecurity();

    }


    /* ======================================
       LOAD RECYCLE PAGE
    ====================================== */

    if (
        pageId === "recycle" &&
        typeof displayRecycle === "function"
    ) {

        displayRecycle();

    }


    if (
        pageId === "dashboard" &&
        typeof updateDashboardNotice === "function"
    ) {

        updateDashboardNotice();

    }


    window.scrollTo(
        0,
        0
    );

}


/* ==========================================
   🔐 LOGIN GATE
========================================== */

function showLoginScreen() {

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
            "flex";

    }


    if (appContainer) {

        appContainer.style.display =
            "none";

    }

}


function showApp() {

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
            "block";

    }


    updateCurrentUserDisplay();


    showPage("dashboard");


    if (
        typeof updatePatientCount ===
        "function"
    ) {

        updatePatientCount();

    }


    if (
        typeof updateDoctorCount ===
        "function"
    ) {

        updateDoctorCount();

    }


    if (
        typeof startAutoBackupLoop ===
        "function"
    ) {

        startAutoBackupLoop();

    }


    if (
        typeof startFirestoreSync ===
        "function"
    ) {

        startFirestoreSync();

    }

}


/* ==========================================
   🚪 GUARDED PAGE ACCESS
   ------------------------------------------
   ዳሽቦርድ ላይ ያሉት 8 tiles ለሁሉም ተጠቃሚ ይታያሉ።
   ራሱ tile ተጫነ ማለት ግን ወደ ገጹ በቀጥታ አይገባም -
   Admin ወይም ገጹ የራሱ ክፍል የሆነለት ተጠቃሚ ብቻ ያለ
   ተጨማሪ ማረጋገጫ ይገባል፣ ሌላ ማንኛውም ሰው ትክክለኛ
   Username/Password ማወቅ አለበት።
========================================== */

function guardedShowPage(pageId) {

    const session =
        typeof getCurrentSession === "function"
            ? getCurrentSession()
            : null;

    if (!session) {

        showPage(pageId);

        return;

    }

    if (session.role === "ADMIN") {

        showPage(pageId);

        return;

    }

    const homePage =
        typeof getUserHomePage === "function"
            ? getUserHomePage(
                typeof getSecurityUsers === "function"
                    ? getSecurityUsers().find(
                        function (user) {

                            return user.id === session.userId;

                        }
                    )
                    : null
            )
            : "";

    if (homePage === pageId) {

        showPage(pageId);

        return;

    }

    requestDepartmentAccess(pageId);

}


function pageLabel(pageId) {

    const labels = {

        patients: "🗂️ ካርድ ክፍል",

        doctors: "ሀኪሞች",

        laboratory: "🧪 ላቦራቶሪ",

        radiology: "🩻 ራጅ/ኤክስሬይ",

        pharmacy: "💊 ፋርማሲ",

        payments: "💰 ካሸር",

        reports: "📊 ጠቅላላ ሪፖርት",

        security: "🔐 ደህንነት",

        recycle: "🗑️ ቆሻሻ"

    };

    return labels[pageId] || pageId;

}


async function requestDepartmentAccess(pageId) {

    const username =
        prompt(
            "🔒 " +
            pageLabel(pageId) +
            " ገጽ ለመግባት የተጠቃሚ ስም ያስገቡ:"
        );

    if (username === null) {

        return;

    }

    const password =
        prompt(
            "🔑 የይለፍ ቃል ያስገቡ:"
        );

    if (password === null) {

        return;

    }

    const allowed =
        typeof verifyDepartmentAccess === "function"
            ? await verifyDepartmentAccess(
                pageId,
                username.trim(),
                password
            )
            : false;

    if (!allowed) {

        alert(
            "❌ ፍቃድ የለም። የተሳሳተ Username/Password ወይም ለዚህ ክፍል ስልጣን የለዎትም።"
        );

        return;

    }

    showPage(pageId);

}


function updateCurrentUserDisplay() {

    const nameBox =
        document.getElementById(
            "currentUserName"
        );


    if (!nameBox) {

        return;

    }


    const session =
        typeof getCurrentSession ===
        "function"
            ? getCurrentSession()
            : null;


    if (session) {

        nameBox.textContent =
            "👤 " +
            session.name +
            " (" +
            session.role +
            ")";

    } else {

        nameBox.textContent =
            "👤 አድሚን";

    }

}


function handleLogout() {

    const confirmLogout =
        confirm(
            "ከሲስተሙ መውጣት ይፈልጋሉ?"
        );


    if (!confirmLogout) {

        return;

    }


    if (
        typeof logoutUser ===
        "function"
    ) {

        logoutUser();

    }


    if (
        typeof stopFirestoreSync ===
        "function"
    ) {

        stopFirestoreSync();

    }


    showLoginScreen();

}


function checkLoginAndInit() {

    if (
        typeof initializeSecurity ===
        "function"
    ) {

        initializeSecurity();

    }


    if (
        typeof isLoggedIn === "function" &&
        isLoggedIn()
    ) {

        showApp();

    } else {

        showLoginScreen();

    }

}


/* ==========================================
   📌 DASHBOARD NOTICE (አሁን ምን ምን አለ)
========================================== */

function updateDashboardNotice() {

    if (
        typeof updateNoticeBoard === "function"
    ) {

        updateNoticeBoard();

    }

}


/* ==========================================
   🚀 START APPLICATION
   ------------------------------------------
   ማስታወሻ: ይህ ፋንክሽን ከዚህ በፊት በራሱ በ
   DOMContentLoaded ይነሳ ነበር። አሁን ግን
   license.js የፍቃድ ማረጋገጫውን (activation)
   ካጠናቀቀ በኋላ ይህን ፋንክሽን ራሱ ይጠራዋል፣
   ስለዚህ እዚህ ላይ ተጨማሪ auto-start
   አያስፈልግም።
========================================== */