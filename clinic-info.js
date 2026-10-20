
/* ==========================================
   🏥 የክሊኒክ መረጃ (Clinic Info / Branding)
   ------------------------------------------
   የክሊኒኩ ስም፣ ስልክ እና አድራሻ በአስተዳዳሪው (Admin) አንድ ጊዜ
   ይገባል፤ ከዚያ በመግቢያ ገጽ፣ በራስጌ፣ በግርጌ እና በሚታተሙ
   ወረቀቶች ሁሉ ይታያል። ኮዱ ውስጥ የክሊኒክ ስም አልተጻፈም፣
   ስለዚህ ለማንኛውም ክሊኒክ ይሰራል።
========================================== */

const CLINIC_SETTINGS_STORAGE =
    "clinic_settings";

const DEFAULT_CLINIC_TITLE =
    "የክሊኒክ ሲስተም";


let clinicSettingsCache =
    (function () {

        try {

            return (
                JSON.parse(
                    localStorage.getItem(
                        CLINIC_SETTINGS_STORAGE
                    )
                ) || []
            );

        } catch (error) {

            return [];

        }

    })();


function escapeClinicInfoText(value) {

    return String(
        value ?? ""
    )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "clinicSettings",

        CLINIC_SETTINGS_STORAGE,

        function () {

            return clinicSettingsCache;

        },

        function (newArray) {

            clinicSettingsCache = newArray;

        },

        function () {

            applyClinicBranding();

        }

    );

}


/* ==========================================
   📖 GET / SAVE
========================================== */

function getClinicInfo() {

    const record =
        clinicSettingsCache.find(
            function (item) {

                return item && item.id === "main";

            }
        ) || {};

    return {

        nameAm: record.nameAm || "",
        nameEn: record.nameEn || "",
        phone: record.phone || "",
        phone2: record.phone2 || "",
        address: record.address || "",
        footerNote: record.footerNote || ""

    };

}


function getClinicDisplayName() {

    const info =
        getClinicInfo();

    return (
        info.nameAm ||
        info.nameEn ||
        DEFAULT_CLINIC_TITLE
    );

}


function saveClinicInfo(info) {

    clinicSettingsCache = [

        {

            id: "main",

            nameAm: String(info.nameAm || "").trim(),
            nameEn: String(info.nameEn || "").trim(),
            phone: String(info.phone || "").trim(),
            phone2: String(info.phone2 || "").trim(),
            address: String(info.address || "").trim(),
            footerNote: String(info.footerNote || "").trim(),

            updatedAt: new Date().toISOString()

        }

    ];

    localStorage.setItem(
        CLINIC_SETTINGS_STORAGE,
        JSON.stringify(clinicSettingsCache)
    );

    if (
        typeof saveFirestoreCollection === "function"
    ) {

        saveFirestoreCollection("clinicSettings");

    }

    applyClinicBranding();

}


/* ==========================================
   🎨 ስሙን በሁሉም ቦታ ማሳየት
========================================== */

function applyClinicBranding() {

    const name =
        getClinicDisplayName();

    document.title =
        name;

    document
        .querySelectorAll("[data-clinic-name]")
        .forEach(
            function (element) {

                element.textContent = name;

            }
        );

    document
        .querySelectorAll("[data-clinic-footer]")
        .forEach(
            function (element) {

                element.textContent =
                    name +
                    " © " +
                    new Date().getFullYear();

            }
        );

}


/* ==========================================
   🖨️ ለሚታተሙ ወረቀቶች ራስጌ (ማዘዣ፣ ውጤት፣ ደረሰኝ)
========================================== */

function getClinicPrintHeaderHtml() {

    const info =
        getClinicInfo();

    const phones =
        [info.phone, info.phone2]
            .filter(Boolean)
            .join(" / ");

    const contactLine =
        [
            phones ? "📞 " + phones : "",
            info.address
        ]
            .filter(Boolean)
            .join(" • ");

    return `

        <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:12px;">

            <div style="font-size:22px; font-weight:bold;">
                ${escapeClinicInfoText(info.nameAm || info.nameEn || DEFAULT_CLINIC_TITLE)}
            </div>

            ${
                info.nameAm && info.nameEn
                ? `<div style="font-size:17px;">${escapeClinicInfoText(info.nameEn)}</div>`
                : ""
            }

            ${
                contactLine
                ? `<div style="font-size:14px; margin-top:2px;">${escapeClinicInfoText(contactLine)}</div>`
                : ""
            }

        </div>

    `;

}


function getClinicPrintFooterHtml() {

    const info =
        getClinicInfo();

    if (!info.footerNote) {

        return "";

    }

    return `

        <div style="text-align:center; font-size:12px; border-top:1px solid #999; margin-top:14px; padding-top:6px;">
            ${escapeClinicInfoText(info.footerNote)}
        </div>

    `;

}


/* ==========================================
   ⚙️ ቅንብር ቅጽ (🔐 ደህንነት ገጽ ውስጥ፣ Admin ብቻ)
========================================== */

function renderClinicInfoSettings(containerId) {

    const container =
        document.getElementById(
            containerId
        );

    if (!container) {

        return;

    }

    if (
        typeof isAdmin === "function" &&
        !isAdmin()
    ) {

        container.innerHTML = "";

        return;

    }

    const info =
        getClinicInfo();

    const inputStyle =
        "width:100%; box-sizing:border-box; margin-bottom:8px;";

    container.innerHTML = `

        <div class="security-form-container">

            <h2>
                🏥 የክሊኒክ መረጃ
            </h2>

            <p style="font-size:13px;">
                እዚህ የሞሉት ስም፣ ስልክ እና አድራሻ በመግቢያ ገጽ፣ በራስጌ እና
                በሚታተሙ ወረቀቶች ሁሉ ላይ ይታያል።
            </p>

            <label>የክሊኒክ ስም (አማርኛ)</label>
            <input type="text" id="clinicInfoNameAm" style="${inputStyle}"
                value="${escapeClinicInfoText(info.nameAm)}"
                placeholder="ለምሳሌ፦ ... መካከለኛ ክሊኒክ">

            <label>Clinic Name (English)</label>
            <input type="text" id="clinicInfoNameEn" style="${inputStyle}"
                value="${escapeClinicInfoText(info.nameEn)}"
                placeholder="e.g. ... Medium Clinic">

            <label>ስልክ ቁጥር</label>
            <input type="text" id="clinicInfoPhone" style="${inputStyle}"
                value="${escapeClinicInfoText(info.phone)}"
                placeholder="09...">

            <label>ሁለተኛ ስልክ (አማራጭ)</label>
            <input type="text" id="clinicInfoPhone2" style="${inputStyle}"
                value="${escapeClinicInfoText(info.phone2)}">

            <label>አድራሻ (ከተማ / ወረዳ)</label>
            <input type="text" id="clinicInfoAddress" style="${inputStyle}"
                value="${escapeClinicInfoText(info.address)}"
                placeholder="ለምሳሌ፦ ባቲ">

            <label>በወረቀት ግርጌ የሚታተም ማስታወሻ (አማራጭ)</label>
            <input type="text" id="clinicInfoFooterNote" style="${inputStyle}"
                value="${escapeClinicInfoText(info.footerNote)}">

            <button onclick="handleSaveClinicInfo()">
                💾 መረጃውን አስቀምጥ
            </button>

        </div>

        <hr>

    `;

}


function handleSaveClinicInfo() {

    function value(id) {

        const input =
            document.getElementById(id);

        return input
            ? input.value.trim()
            : "";

    }

    const nameAm =
        value("clinicInfoNameAm");

    const nameEn =
        value("clinicInfoNameEn");

    if (!nameAm && !nameEn) {

        alert(
            "ቢያንስ የክሊኒኩን ስም (በአማርኛ ወይም በእንግሊዝኛ) ያስገቡ።"
        );

        return;

    }

    saveClinicInfo({

        nameAm: nameAm,
        nameEn: nameEn,
        phone: value("clinicInfoPhone"),
        phone2: value("clinicInfoPhone2"),
        address: value("clinicInfoAddress"),
        footerNote: value("clinicInfoFooterNote")

    });

    const prompt =
        document.getElementById(
            "clinicInfoPrompt"
        );

    if (prompt) {

        prompt.remove();

    }

    alert(
        "✅ የክሊኒክ መረጃ ተቀምጧል።"
    );

}


/* ==========================================
   🔔 አዲስ ክሊኒክ፦ መረጃ ካልገባ አስተዳዳሪውን ያስታውሳል
========================================== */

function promptClinicInfoIfMissing() {

    setTimeout(
        function () {

            try {

                if (
                    typeof isAdmin !== "function" ||
                    !isAdmin()
                ) {

                    return;

                }

                const info =
                    getClinicInfo();

                if (info.nameAm || info.nameEn) {

                    return;

                }

                if (
                    sessionStorage.getItem(
                        "clinicInfoPromptDismissed"
                    ) === "1"
                ) {

                    return;

                }

                if (
                    document.getElementById(
                        "clinicInfoPrompt"
                    )
                ) {

                    return;

                }

                const box =
                    document.createElement("div");

                box.id =
                    "clinicInfoPrompt";

                box.style.cssText =
                    "position:fixed; left:10px; right:10px; bottom:12px; z-index:9999; background:#fff8e1; border:2px solid #f0c36d; border-radius:10px; padding:12px; box-shadow:0 4px 14px rgba(0,0,0,.25); text-align:center;";

                box.innerHTML = `

                    <div style="margin-bottom:8px; font-weight:bold;">
                        🏥 የክሊኒክዎን ስም፣ ስልክ እና አድራሻ ያስገቡ
                    </div>

                    <button id="clinicInfoPromptGo">
                        አሁን ሙላ
                    </button>

                    <button id="clinicInfoPromptLater">
                        በኋላ
                    </button>

                `;

                document.body.appendChild(box);

                document
                    .getElementById("clinicInfoPromptGo")
                    .onclick = function () {

                        box.remove();

                        if (typeof showPage === "function") {

                            showPage("security");

                        }

                    };

                document
                    .getElementById("clinicInfoPromptLater")
                    .onclick = function () {

                        sessionStorage.setItem(
                            "clinicInfoPromptDismissed",
                            "1"
                        );

                        box.remove();

                    };

            } catch (error) {

                console.warn(error);

            }

        },
        4000
    );

}


document.addEventListener(
    "DOMContentLoaded",
    function () {

        applyClinicBranding();

    }
);
