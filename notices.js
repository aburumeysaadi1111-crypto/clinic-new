
/* ==========================================
   📢 CLINIC NOTICES
   ------------------------------------------
   ሁለት አይነት መልእክት፦
   1) ANNOUNCEMENT - Admin ለሁሉም የሚያስተላልፈው
      (በአል እንኳን አደረሳችሁ፣ የስራ ሰዓት አልቆል...)
   2) REQUEST - ማንኛውም ክፍል (ካርድ/ካሸር/ላብ/ፋርማሲ)
      ለAdmin የሚልከው ጥያቄ (ማቴሪያል፣ ጽዳት...)
========================================== */

const NOTICE_STORAGE = "clinic_notices";


let noticesCache =
    JSON.parse(
        localStorage.getItem(NOTICE_STORAGE)
    ) || [];


function getNotices() {

    return noticesCache;

}


function saveNotices(noticesList) {

    noticesCache =
        noticesList;

    localStorage.setItem(
        NOTICE_STORAGE,
        JSON.stringify(noticesList)
    );

    if (
        typeof saveFirestoreCollection === "function"
    ) {

        saveFirestoreCollection("notices");

    }

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "notices",

        NOTICE_STORAGE,

        function () {

            return noticesCache;

        },

        function (newArray) {

            noticesCache = newArray;

        },

        function () {

            if (
                typeof updateNoticeBoard === "function"
            ) {

                updateNoticeBoard();

            }

            if (
                typeof renderNoticesAdminPanel === "function"
            ) {

                renderNoticesAdminPanel();

            }

        }

    );

}


/* ==========================================
   ➕ CREATE NOTICE
========================================== */

function createNotice(data) {

    const notices =
        getNotices();

    const session =
        typeof getCurrentSession === "function"
            ? getCurrentSession()
            : null;

    const notice = {

        id:
            "NOTE-" + Date.now(),

        type:
            data.type || "ANNOUNCEMENT",

        message:
            data.message || "",

        fromDepartment:
            data.fromDepartment || "",

        fromName:
            session ? session.name : "",

        active:
            true,

        createdAt:
            new Date().toISOString()

    };

    notices.push(notice);

    saveNotices(notices);

    return notice;

}


/* ==========================================
   📌 LATEST ACTIVE ANNOUNCEMENT (ለሁሉም)
========================================== */

function getActiveAnnouncement() {

    const announcements =
        getNotices()
            .filter(
                function (notice) {

                    return (
                        notice.type === "ANNOUNCEMENT" &&
                        notice.active
                    );

                }
            )
            .sort(
                function (a, b) {

                    return (
                        new Date(b.createdAt) -
                        new Date(a.createdAt)
                    );

                }
            );

    return announcements[0] || null;

}


/* ==========================================
   📨 PENDING REQUESTS (ለAdmin)
========================================== */

function getPendingRequests() {

    return getNotices()
        .filter(
            function (notice) {

                return (
                    notice.type === "REQUEST" &&
                    notice.active
                );

            }
        )
        .sort(
            function (a, b) {

                return (
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
                );

            }
        );

}


/* ==========================================
   ✅ DISMISS / RESOLVE NOTICE
========================================== */

function dismissNotice(noticeId) {

    const notices =
        getNotices();

    const index =
        notices.findIndex(
            function (notice) {

                return notice.id === noticeId;

            }
        );

    if (index === -1) {

        return false;

    }

    notices[index].active =
        false;

    saveNotices(notices);

    return true;

}


/* ==========================================
   🛡️ SAFE TEXT
========================================== */

function escapeNoticeText(value) {

    return String(
        value ?? ""
    )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* ==========================================
   📌 UPDATE DASHBOARD NOTICE BOX
   (ካሸር ላይ ያለ ብዛት + የAdmin ማስታወቂያ)
========================================== */

function updateNoticeBoard() {

    const cashierCountBox =
        document.getElementById(
            "dashNoticeCashierCount"
        );

    if (cashierCountBox) {

        const cashierQueue =
            typeof getPatientsByStatus === "function"
                ? getPatientsByStatus("ካሸር")
                : [];

        cashierCountBox.textContent =
            cashierQueue.length;

    }

    const announcementBox =
        document.getElementById(
            "dashNoticeAnnouncement"
        );

    if (announcementBox) {

        const announcement =
            getActiveAnnouncement();

        announcementBox.textContent =
            announcement
                ? announcement.message
                : "ከታች ያሉትን ሜኑዎች በመጫን ስቶክ፣ ሽያጭ፣ ዲቤ፣ ወጪ እና ሪፖርት ይከታተሱ።";

    }

    const requestsBadge =
        document.getElementById(
            "dashNoticeRequestsBadge"
        );

    if (requestsBadge) {

        const isAdminUser =
            typeof isAdmin === "function" &&
            isAdmin();

        if (!isAdminUser) {

            requestsBadge.style.display =
                "none";

        } else {

            const pending =
                getPendingRequests();

            if (pending.length === 0) {

                requestsBadge.style.display =
                    "none";

            } else {

                requestsBadge.style.display =
                    "inline-block";

                requestsBadge.textContent =
                    "🔔 " +
                    pending.length +
                    " ያልታዩ ጥያቄዎች";

            }

        }

    }

}


/* ==========================================
   📨 ADMIN: POST NEW ANNOUNCEMENT
========================================== */

function handlePostAnnouncement() {

    const message =
        prompt(
            "📢 ለሁሉም የሚደርስ ማስታወቂያ ጻፉ (ለምሳሌ: 'እንኳን ለገና በአል በሰላም አደረሳችሁ' ወይም 'የስራ ሰዓት አልቋል'):"
        );

    if (message === null) {

        return;

    }

    const cleanMessage =
        message.trim();

    if (!cleanMessage) {

        alert(
            "መልእክት ያስገቡ።"
        );

        return;

    }

    createNotice({

        type: "ANNOUNCEMENT",

        message: cleanMessage,

        fromDepartment: "ADMIN"

    });

    alert(
        "✅ ማስታወቂያው ተለጥፏል።"
    );

    if (
        typeof renderNoticesAdminPanel === "function"
    ) {

        renderNoticesAdminPanel();

    }

    updateNoticeBoard();

}


/* ==========================================
   🚫 ADMIN: CLEAR CURRENT ANNOUNCEMENT
========================================== */

function handleClearAnnouncement() {

    const announcement =
        getActiveAnnouncement();

    if (!announcement) {

        alert(
            "የተለጠፈ ማስታወቂያ የለም።"
        );

        return;

    }

    dismissNotice(announcement.id);

    alert(
        "✅ ማስታወቂያው ተነስቷል።"
    );

    if (
        typeof renderNoticesAdminPanel === "function"
    ) {

        renderNoticesAdminPanel();

    }

    updateNoticeBoard();

}


/* ==========================================
   📨 DEPARTMENT: SEND REQUEST TO ADMIN
========================================== */

function handleSendDepartmentRequest(departmentName) {

    const message =
        prompt(
            "📨 ለAdmin ምን መልእክት/ጥያቄ መላክ ይፈልጋሉ? (ለምሳሌ: 'ማቴሪያል እያለቀ ነው' ወይም 'የኮሪደር ጽዳት ያስፈልጋል'):"
        );

    if (message === null) {

        return;

    }

    const cleanMessage =
        message.trim();

    if (!cleanMessage) {

        alert(
            "መልእክት ያስገቡ።"
        );

        return;

    }

    createNotice({

        type: "REQUEST",

        message:
            "[" + departmentName + "] " + cleanMessage,

        fromDepartment:
            departmentName

    });

    alert(
        "✅ መልእክቱ ለAdmin ተልኳል።"
    );

}


/* ==========================================
   📋 ADMIN NOTICES PANEL (ደህንነት ገጽ ላይ)
========================================== */

function renderNoticesAdminPanel() {

    const box =
        document.getElementById(
            "noticesAdminPanel"
        );

    if (!box) {

        return;

    }

    const announcement =
        getActiveAnnouncement();

    const pending =
        getPendingRequests();

    let html = `

        <p>
            <strong>የአሁኑ ማስታወቂያ:</strong>
            ${
                announcement
                    ? escapeNoticeText(announcement.message)
                    : "የለም"
            }
        </p>

        <button onclick="handlePostAnnouncement()">
            📢 አዲስ ማስታወቂያ ለጥፍ
        </button>

    `;

    if (announcement) {

        html += `
            <button onclick="handleClearAnnouncement()" style="background:#c0392b;">
                🚫 ማስታወቂያውን አንሳ
            </button>
        `;

    }

    html += `

        <hr>

        <h3>
            📨 ከየክፍሎቹ የደረሱ ጥያቄዎች
        </h3>

    `;

    if (pending.length === 0) {

        html += `
            <p>
                ምንም አዲስ ጥያቄ የለም።
            </p>
        `;

    } else {

        html += pending.map(
            function (notice) {

                return `

                    <div class="patient-item">

                        <p>
                            ${escapeNoticeText(notice.message)}
                        </p>

                        <p>
                            🕒
                            ${formatEthiopianDateTime(notice.createdAt)}
                            —
                            ${escapeNoticeText(notice.fromName)}
                        </p>

                        <button onclick="handleDismissNotice('${notice.id}')">
                            ✅ ታይቷል
                        </button>

                    </div>

                `;

            }
        ).join("");

    }

    box.innerHTML = html;

}


function handleDismissNotice(noticeId) {

    dismissNotice(noticeId);

    renderNoticesAdminPanel();

    updateNoticeBoard();

}


/* ==========================================
   🚀 START
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateNoticeBoard();

    }
);