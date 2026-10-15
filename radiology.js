
/* ==========================================
   🩻 CLINIC RADIOLOGY SYSTEM (ራጅ/ኤክስሬይ)
========================================== */

let radiologyOrders =
    JSON.parse(
        localStorage.getItem("clinicRadiologyOrders")
    ) || [];


/* ==========================================
   💾 SAVE RADIOLOGY ORDERS
========================================== */

function saveRadiologyOrders() {

    localStorage.setItem(
        "clinicRadiologyOrders",
        JSON.stringify(radiologyOrders)
    );

    if (
        typeof saveFirestoreCollection ===
        "function"
    ) {

        saveFirestoreCollection("radiologyOrders");

    }

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "radiologyOrders",

        "clinicRadiologyOrders",

        function () {

            return radiologyOrders;

        },

        function (newArray) {

            radiologyOrders = newArray;

        },

        function () {

            if (
                typeof rerenderCurrentPage === "function"
            ) {

                rerenderCurrentPage();

            }

            if (
                typeof updateRadiologyCount === "function"
            ) {

                updateRadiologyCount();

            }

            if (
                typeof checkDiagnosticCompletion === "function"
            ) {

                radiologyOrders.forEach(
                    function (order) {

                        checkDiagnosticCompletion(
                            order.patientId,
                            order.doctorId
                        );

                    }
                );

            }

        }

    );

}


/* ==========================================
   🆔 CREATE RADIOLOGY ORDER ID
========================================== */

function createRadiologyOrderId() {

    let highest = 0;

    radiologyOrders.forEach(
        function(order) {

            const match =
                String(order.id || "")
                    .match(/RAD-?(\d+)/i);

            if (match) {

                const number =
                    parseInt(
                        match[1],
                        10
                    );

                if (
                    !isNaN(number) &&
                    number > highest
                ) {

                    highest = number;

                }

            }

        }
    );


    return (
        "RAD-" +
        String(highest + 1)
            .padStart(5, "0")
    );

}


/* ==========================================
   🩻 AVAILABLE RADIOLOGY EXAMS
========================================== */

const radiologyExams = [

    "የደረት ራጅ (Chest X-ray)",

    "የእጅ/እግር ራጅ",

    "የአከርካሪ ራጅ",

    "የሆድ አልትራሳውንድ",

    "የኩላሊት አልትራሳውንድ",

    "የእርግዝና አልትራሳውንድ",

    "CT Scan",

    "ECG"

];


/* ==========================================
   💾 CUSTOM (ተጨማሪ) የራጅ ምርመራዎች
========================================== */

function getCustomRadiologyExams() {

    try {

        return (
            JSON.parse(
                localStorage.getItem(
                    "clinicCustomRadiologyExams"
                )
            ) || []
        );

    } catch (error) {

        return [];

    }

}


function addCustomRadiologyExam(name) {

    const cleanName =
        String(name || "").trim();

    if (!cleanName) {

        return null;

    }

    const all =
        getFullRadiologyExamList();

    const exists =
        all.some(
            function (exam) {

                return (
                    exam.toLowerCase() ===
                    cleanName.toLowerCase()
                );

            }
        );

    if (exists) {

        return null;

    }

    const custom =
        getCustomRadiologyExams();

    custom.push(cleanName);

    localStorage.setItem(
        "clinicCustomRadiologyExams",
        JSON.stringify(custom)
    );

    return cleanName;

}


function getFullRadiologyExamList() {

    return [

        ...radiologyExams,

        ...getCustomRadiologyExams()

    ];

}


/* ==========================================
   ➕ CREATE RADIOLOGY ORDER
   (ካሸር ክፍያ ከተቀበለ በኋላ ብቻ ነው የሚፈጠረው)
========================================== */

function createRadiologyOrder(
    patientId,
    doctorId,
    exams,
    note = ""
) {

    if (!patientId || !doctorId) {

        return null;

    }

    if (
        !Array.isArray(exams) ||
        exams.length === 0
    ) {

        return null;

    }

    const order = {

        id:
            createRadiologyOrderId(),

        patientId:
            patientId,

        doctorId:
            doctorId,

        exams:
            exams,

        note:
            note,

        status:
            "ትዕዛዝ ተላከ",

        results:
            {},

        createdAt:
            new Date().toISOString(),

        completedAt:
            null

    };

    radiologyOrders.push(order);

    saveRadiologyOrders();

    updateRadiologyCount();

    return order;

}


/* ==========================================
   🔎 GET RADIOLOGY ORDER
========================================== */

function getRadiologyOrderById(
    orderId
) {

    return radiologyOrders.find(
        function(order) {

            return order.id === orderId;

        }
    ) || null;

}


function getRadiologyOrders() {

    return radiologyOrders;

}


/* ==========================================
   📥 RESULTS RECEIVED BY A DOCTOR
========================================== */

function getDoctorReceivedRadiologyResults(
    doctorId
) {

    return radiologyOrders.filter(
        function (order) {

            return (
                order.doctorId === doctorId &&
                order.status ===
                    "ውጤት ወደ ዶክተር ተልኳል"
            );

        }
    );

}


function markRadiologyResultViewed(
    orderId
) {

    const order =
        getRadiologyOrderById(orderId);

    if (!order) {

        return false;

    }

    order.status =
        "ውጤት ታይቷል";

    order.viewedAt =
        new Date().toISOString();

    saveRadiologyOrders();

    return true;

}


/* ==========================================
   📋 GET ORDERS PENDING FOR RADIOLOGY
========================================== */

function getPendingRadiologyOrders() {

    return radiologyOrders.filter(
        function(order) {

            return (
                order.status ===
                "ትዕዛዝ ተላከ"
            );

        }
    );

}


/* ==========================================
   🩻 COMPLETE + AUTO-SEND RESULT TO DOCTOR
========================================== */

function completeRadiologyOrder(
    orderId,
    results
) {

    const order =
        getRadiologyOrderById(
            orderId
        );

    if (!order) {

        alert(
            "የራጅ ትዕዛዙ አልተገኘም።"
        );

        return false;

    }

    order.results =
        results || {};

    order.status =
        "ውጤት ወደ ዶክተር ተልኳል";

    order.completedAt =
        new Date().toISOString();

    order.sentToDoctorAt =
        new Date().toISOString();

    saveRadiologyOrders();

    updateRadiologyCount();

    if (
        typeof checkDiagnosticCompletion === "function"
    ) {

        checkDiagnosticCompletion(
            order.patientId,
            order.doctorId
        );

    }

    alert(
        "✅ የራጅ ውጤቱ ተመዝግቦ ወደ ዶክተር ተልኳል።"
    );

    return true;

}


/* ==========================================
   📊 RADIOLOGY COUNT
========================================== */

function updateRadiologyCount() {

    const count =
        document.getElementById(
            "radiologyCount"
        );

    if (count) {

        count.textContent =
            radiologyOrders.length;

    }

}


/* ==========================================
   🛡️ SAFE TEXT
========================================== */

function escapeRadiologyText(value) {

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
   📋 DISPLAY RADIOLOGY
========================================== */

function displayRadiology() {

    const container =
        document.getElementById(
            "radiologyContent"
        );

    if (!container) {

        return;

    }

    const orders =
        getPendingRadiologyOrders();

    let html = `

        <h2>
            🩻 የራጅ/ኤክስሬይ ትዕዛዞች
        </h2>

    `;

    if (orders.length === 0) {

        html += `
            <p>
                አሁን የተጠባበቀ የራጅ ትዕዛዝ የለም።
            </p>
        `;

    }

    orders.forEach(
        function(order) {

            const patient =
                typeof getPatientById === "function"
                    ? getPatientById(order.patientId)
                    : null;

            html += `

                <div class="patient-item">

                    <h3>
                        🩻
                        የራጅ ትዕዛዝ
                    </h3>

                    <p>
                        <strong>Radiology ID:</strong>
                        ${order.id}
                    </p>

                    <p>
                        <strong>ታካሚ:</strong>
                        ${escapeRadiologyText(patient ? (patient.firstName + " " + patient.fatherName + " (" + order.patientId + ")") : order.patientId)}
                    </p>

                    <p>
                        <strong>ዶክተር ID:</strong>
                        ${escapeRadiologyText(order.doctorId)}
                    </p>

                    <p>
                        <strong>ምርመራዎች:</strong>
                        ${escapeRadiologyText(order.exams.join(", "))}
                    </p>

                    <p>
                        <strong>ማስታወሻ:</strong>
                        ${escapeRadiologyText(order.note || "-")}
                    </p>

                    <button onclick="enterRadiologyResult('${order.id}')">
                        📝 ውጤት መዝግብ
                    </button>

                    <button
                        onclick="handleCancelRadiologyOrder('${order.id}')"
                        style="background:#c0392b;"
                    >
                        🗑️ ትዕዛዙን ሰርዝ
                    </button>

                </div>

            `;

        }
    );

    container.innerHTML =
        html;

}


/* ==========================================
   📝 ENTER RADIOLOGY RESULT
========================================== */

function enterRadiologyResult(
    orderId
) {

    const order =
        getRadiologyOrderById(
            orderId
        );

    if (!order) {

        alert(
            "የራጅ ትዕዛዙ አልተገኘም።"
        );

        return;

    }

    const container =
        document.getElementById(
            "radiologyContent"
        );

    if (!container) {
        return;
    }

    const patient =
        typeof getPatientById === "function"
            ? getPatientById(order.patientId)
            : null;

    container.innerHTML = `

        <button onclick="displayRadiology()">
            ← ተመለስ
        </button>

        <h2>
            📝 የራጅ/ኤክስሬይ ውጤት መመዝገቢያ
        </h2>

        <p>
            <strong>Radiology ID:</strong> ${escapeRadiologyText(order.id)}
            <br>
            <strong>ታካሚ:</strong>
            ${
                patient
                    ? escapeRadiologyText(patient.firstName) + " " + escapeRadiologyText(patient.fatherName)
                    : escapeRadiologyText(order.patientId)
            }
            <br>
            <strong>የታዘዙ ምርመራዎች:</strong>
            ${escapeRadiologyText(order.exams.join(", "))}
        </p>

        <label>
            🩻 RADIOLOGIST'S REPORT
        </label>

        <textarea
            id="radiologyReportInput"
            style="width:100%; min-height:220px; padding:10px; border:1px solid #cbd5e1; border-radius:8px; font-size:15px;"
            placeholder="ግኝቶችን እዚህ ይጻፉ..."
        ></textarea>

        <button
            onclick="handleSubmitRadiologyResult('${order.id}')"
            style="background:#0b5d45; color:white; border:none; border-radius:8px; padding:13px 18px; font-size:16px; cursor:pointer; width:100%; margin-top:12px;"
        >
            ✅ ሪፖርት መዝግብ እና ላክ ለሀኪም
        </button>

    `;

}


function handleSubmitRadiologyResult(orderId) {

    const textarea =
        document.getElementById(
            "radiologyReportInput"
        );

    const report =
        textarea ? textarea.value.trim() : "";

    if (!report) {

        alert(
            "እባክዎ ግኝቱን/ሪፖርቱን ይጻፉ።"
        );

        return;

    }

    completeRadiologyOrder(
        orderId,
        {

            "ሪፖርት":
                report

        }
    );

    displayRadiology();

}


/* ==========================================
   🗑️ CANCEL RADIOLOGY ORDER (→ ቆሻሻ ማጠራቀሚያ)
========================================== */

function handleCancelRadiologyOrder(orderId) {

    const confirmCancel =
        confirm(
            "ይህን የራጅ ትዕዛዝ መሰረዝ ይፈልጋሉ? (ወደ ቆሻሻ ማጠራቀሚያ ይገባል)"
        );

    if (!confirmCancel) {

        return;

    }

    const index =
        radiologyOrders.findIndex(
            function (order) {

                return order.id === orderId;

            }
        );

    if (index === -1) {

        return;

    }

    const order =
        radiologyOrders[index];

    const patient =
        typeof getPatientById === "function"
            ? getPatientById(order.patientId)
            : null;

    if (
        typeof addToRecycleBin ===
        "function"
    ) {

        addToRecycleBin(
            "RADIOLOGY_ORDER",
            order,
            (
                patient
                    ? patient.firstName + " " + patient.fatherName
                    : order.patientId
            ) +
            " - " +
            order.exams.join(", ")
        );

    }

    radiologyOrders.splice(index, 1);

    saveRadiologyOrders();

    if (
        typeof deleteFirestoreDoc === "function"
    ) {

        deleteFirestoreDoc("radiologyOrders", orderId);

    }

    updateRadiologyCount();

    displayRadiology();

}


/* ==========================================
   🚀 START
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        updateRadiologyCount();

        displayRadiology();

    }
);