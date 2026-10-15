
/* ==========================================
   🧪 CLINIC LABORATORY SYSTEM
========================================== */

let laboratoryOrders =
    JSON.parse(
        localStorage.getItem("clinicLaboratoryOrders")
    ) || [];


/* ==========================================
   💾 SAVE LAB ORDERS
========================================== */

function saveLaboratoryOrders() {

    localStorage.setItem(
        "clinicLaboratoryOrders",
        JSON.stringify(laboratoryOrders)
    );

    if (
        typeof saveFirestoreCollection ===
        "function"
    ) {

        saveFirestoreCollection("laboratoryOrders");

    }

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "laboratoryOrders",

        "clinicLaboratoryOrders",

        function () {

            return laboratoryOrders;

        },

        function (newArray) {

            laboratoryOrders = newArray;

        },

        function () {

            if (
                typeof rerenderCurrentPage === "function"
            ) {

                rerenderCurrentPage();

            }

            if (
                typeof updateLabCount === "function"
            ) {

                updateLabCount();

            }

            if (
                typeof checkDiagnosticCompletion === "function"
            ) {

                laboratoryOrders.forEach(
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
   🆔 CREATE LAB ORDER ID
========================================== */

function createLabOrderId() {

    let highest = 0;

    laboratoryOrders.forEach(
        function(order) {

            const match =
                String(order.id || "")
                    .match(/LAB-?(\d+)/i);

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
        "LAB-" +
        String(highest + 1)
            .padStart(5, "0")
    );

}


/* ==========================================
   🧪 AVAILABLE LAB TESTS
========================================== */

const laboratoryTests = [

    "CBC",

    "የደም ስኳር",

    "የሽንት ምርመራ",

    "የጉበት ምርመራ",

    "የኩላሊት ምርመራ",

    "የደም አይነት",

    "Malaria",

    "HIV",

    "HBsAg",

    "HCV",

    "Pregnancy Test",

    "Stool Examination"

];


/* ==========================================
   ➕ CREATE LAB ORDER
========================================== */

function createLabOrder(
    patientId,
    doctorId,
    tests,
    note = ""
) {

    if (!patientId) {

        alert(
            "የታካሚ ID ያስፈልጋል።"
        );

        return null;

    }


    if (!doctorId) {

        alert(
            "የዶክተር ID ያስፈልጋል።"
        );

        return null;

    }


    if (
        !Array.isArray(tests) ||
        tests.length === 0
    ) {

        alert(
            "ቢያንስ አንድ የላብ ምርመራ ይምረጡ።"
        );

        return null;

    }


    const order = {

        id:
            createLabOrderId(),

        patientId:
            patientId,

        doctorId:
            doctorId,

        tests:
            tests,

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


    laboratoryOrders.push(order);

    saveLaboratoryOrders();


    updateLabCount();


    return order;

}


/* ==========================================
   🔎 GET LAB ORDER
========================================== */

function getLabOrderById(
    orderId
) {

    return laboratoryOrders.find(
        function(order) {

            return (
                order.id === orderId
            );

        }
    ) || null;

}


/* ==========================================
   📋 GET ALL LAB ORDERS (used by reports.js)
========================================== */

function getLaboratoryOrders() {

    return laboratoryOrders;

}


/* ==========================================
   📥 RESULTS RECEIVED BY A DOCTOR
========================================== */

function getDoctorReceivedResults(
    doctorId
) {

    return laboratoryOrders.filter(
        function (order) {

            return (
                order.doctorId === doctorId &&
                order.status ===
                    "ውጤት ወደ ዶክተር ተልኳል"
            );

        }
    );

}


/* ==========================================
   ✅ MARK RESULT AS VIEWED BY DOCTOR
========================================== */

function markLabResultViewed(
    orderId
) {

    const order =
        getLabOrderById(orderId);

    if (!order) {

        return false;

    }

    order.status =
        "ውጤት ታይቷል";

    order.viewedAt =
        new Date().toISOString();

    saveLaboratoryOrders();

    return true;

}


/* ==========================================
   📋 GET ORDERS FOR LAB
========================================== */

function getPendingLabOrders() {

    return laboratoryOrders.filter(
        function(order) {

            return (
                order.status ===
                "ትዕዛዝ ተላከ"
            );

        }
    );

}


/* ==========================================
   🧪 COMPLETE LAB RESULT
========================================== */

function completeLabOrder(
    orderId,
    results
) {

    const order =
        getLabOrderById(
            orderId
        );


    if (!order) {

        alert(
            "የላብ ትዕዛዙ አልተገኘም።"
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


    saveLaboratoryOrders();


    updateLabCount();


    if (
        typeof checkDiagnosticCompletion === "function"
    ) {

        checkDiagnosticCompletion(
            order.patientId,
            order.doctorId
        );

    }


    alert(
        "✅ የላብ ውጤቱ ተመዝግቦ ወደ ዶክተር ተልኳል።"
    );


    return true;

}


/* ==========================================
   📤 SEND RESULT TO DOCTOR
========================================== */

function sendLabResultToDoctor(
    orderId
) {

    const order =
        getLabOrderById(
            orderId
        );


    if (!order) {

        alert(
            "የላብ ትዕዛዙ አልተገኘም።"
        );

        return false;

    }


    if (
        order.status !==
        "ውጤት ተጠናቋል"
    ) {

        alert(
            "መጀመሪያ የላብ ውጤቱን ያጠናቅቁ።"
        );

        return false;

    }


    order.status =
        "ውጤት ወደ ዶክተር ተልኳል";


    order.sentToDoctorAt =
        new Date().toISOString();


    saveLaboratoryOrders();


    alert(
        "የላብ ውጤቱ ወደ ዶክተር ተልኳል።"
    );


    return true;

}


/* ==========================================
   📊 LAB COUNT
========================================== */

function updateLabCount() {

    const count =
        document.getElementById(
            "labCount"
        );


    if (count) {

        count.textContent =
            laboratoryOrders.length;

    }

}


/* ==========================================
   📋 DISPLAY LABORATORY
========================================== */

function displayLaboratory() {

    const container =
        document.getElementById(
            "laboratoryContent"
        );


    if (!container) {

        return;

    }


    const orders =
        getPendingLabOrders();


    let html = `

        <h2>
            🧪 የላብ ትዕዛዞች
        </h2>

    `;


    if (orders.length === 0) {

        html += `

            <p>
                አሁን የተጠባበቀ የላብ
                ትዕዛዝ የለም።
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
                        🧪
                        የላብ ትዕዛዝ
                    </h3>

                    <p>
                        <strong>
                            Lab ID:
                        </strong>
                        ${order.id}
                    </p>

                    <p>
                        <strong>
                            ታካሚ:
                        </strong>
                        ${escapeLabText(patient ? (patient.firstName + " " + patient.fatherName + " (" + order.patientId + ")") : order.patientId)}
                    </p>

                    <p>
                        <strong>
                            ዶክተር ID:
                        </strong>
                        ${escapeLabText(order.doctorId)}
                    </p>

                    <p>
                        <strong>
                            ምርመራዎች:
                        </strong>
                        ${escapeLabText(order.tests.join(", "))}
                    </p>

                    <p>
                        <strong>
                            ማስታወሻ:
                        </strong>
                        ${escapeLabText(order.note || "-")}
                    </p>

                    <button
                        onclick="enterLabResult('${order.id}')"
                    >
                        📝 ውጤት መዝግብ
                    </button>

                    <button
                        onclick="handleCancelLabOrder('${order.id}')"
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
   📝 ENTER LAB RESULT
========================================== */

function enterLabResult(
    orderId
) {

    const order =
        getLabOrderById(
            orderId
        );

    if (!order) {

        alert(
            "የላብ ትዕዛዙ አልተገኘም።"
        );

        return;

    }

    const container =
        document.getElementById(
            "laboratoryContent"
        );

    if (!container) {
        return;
    }

    const patient =
        typeof getPatientById === "function"
            ? getPatientById(order.patientId)
            : null;

    const testRowsHtml =
        order.tests.map(
            function (test, index) {

                const range =
                    typeof findLabTestRange === "function"
                        ? findLabTestRange(test)
                        : "";

                const inputId =
                    "labResultInput-" + index;

                return `

                    <div style="border:1px solid #d9e2ec; border-radius:8px; padding:10px; margin-bottom:8px; background:#f8fafc;">

                        <label style="display:flex; justify-content:space-between;">
                            <strong>${escapeLabText(test)}</strong>
                            ${
                                range
                                ? `<span style="color:#52606d; font-size:12px;">Normal: ${escapeLabText(range)}</span>`
                                : ""
                            }
                        </label>

                        <input
                            type="text"
                            id="${inputId}"
                            class="lab-result-value"
                            data-test="${escapeLabText(test)}"
                            placeholder="ውጤት ያስገቡ"
                            style="width:100%; margin-top:6px;"
                        >

                    </div>

                `;

            }
        ).join("");

    container.innerHTML = `

        <button onclick="displayLaboratory()">
            ← ተመለስ
        </button>

        <h2>
            📝 የላብ ውጤት መመዝገቢያ
        </h2>

        <p>
            <strong>Lab ID:</strong> ${escapeLabText(order.id)}
            <br>
            <strong>ታካሚ:</strong>
            ${
                patient
                    ? escapeLabText(patient.firstName) + " " + escapeLabText(patient.fatherName)
                    : escapeLabText(order.patientId)
            }
        </p>

        ${testRowsHtml}

        <button
            onclick="handleSubmitLabResult('${order.id}')"
            style="background:#0b5d45; color:white; border:none; border-radius:8px; padding:13px 18px; font-size:16px; cursor:pointer; width:100%; margin-top:10px;"
        >
            ✅ ውጤት መዝግብ እና ላክ ለሀኪም
        </button>

    `;

}


function handleSubmitLabResult(orderId) {

    const inputs =
        document.querySelectorAll(
            ".lab-result-value"
        );

    const results = {};

    let hasAnyValue = false;

    inputs.forEach(
        function (input) {

            const value =
                input.value.trim();

            results[input.dataset.test] =
                value;

            if (value) {

                hasAnyValue = true;

            }

        }
    );

    if (!hasAnyValue) {

        alert(
            "ቢያንስ ለአንድ ምርመራ ውጤት ያስገቡ።"
        );

        return;

    }

    completeLabOrder(
        orderId,
        results
    );


    displayLaboratory();

}


function escapeLabText(value) {

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
   🗑️ CANCEL LAB ORDER (→ ቆሻሻ ማጠራቀሚያ)
========================================== */

function handleCancelLabOrder(orderId) {

    const confirmCancel =
        confirm(
            "ይህን የላብ ትዕዛዝ መሰረዝ ይፈልጋሉ? (ወደ ቆሻሻ ማጠራቀሚያ ይገባል፣ Admin መልሶ ማምጣት ይችላል)"
        );

    if (!confirmCancel) {

        return;

    }

    const index =
        laboratoryOrders.findIndex(
            function (order) {

                return order.id === orderId;

            }
        );

    if (index === -1) {

        return;

    }

    const order =
        laboratoryOrders[index];

    const patient =
        typeof getPatientById === "function"
            ? getPatientById(order.patientId)
            : null;

    if (
        typeof addToRecycleBin ===
        "function"
    ) {

        addToRecycleBin(
            "LAB_ORDER",
            order,
            (
                patient
                    ? patient.firstName + " " + patient.fatherName
                    : order.patientId
            ) +
            " - " +
            order.tests.join(", ")
        );

    }

    laboratoryOrders.splice(index, 1);

    saveLaboratoryOrders();

    if (
        typeof deleteFirestoreDoc === "function"
    ) {

        deleteFirestoreDoc("laboratoryOrders", orderId);

    }

    updateLabCount();

    displayLaboratory();

}


/* ==========================================
   🚀 START
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        updateLabCount();

        displayLaboratory();

    }
);