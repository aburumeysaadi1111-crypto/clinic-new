

/* =====================================================
   🏥 CLINIC SYSTEM
   👤 PATIENTS SYSTEM (ካርድ ክፍል)
===================================================== */


/* =====================================================
   📦 PATIENT DATA
===================================================== */

let patients =
    JSON.parse(
        localStorage.getItem("clinicPatients")
    ) || [];


let currentEditingPatientId =
    null;


/* =====================================================
   ✏️ UPDATE PATIENT
===================================================== */

function updatePatient(
    patientId,
    data
) {

    const patient =
        getPatientById(patientId);

    if (!patient) {

        return null;

    }

    patient.firstName =
        data.firstName || "";

    patient.fatherName =
        data.fatherName || "";

    patient.grandfatherName =
        data.grandfatherName || "";

    patient.gender =
        data.gender || "";

    patient.age =
        data.age || "";

    patient.phone =
        data.phone || "";

    patient.kebele =
        data.kebele || "";

    patient.address =
        data.address || "";

    patient.bloodType =
        data.bloodType || "";

    patient.emergencyContact =
        data.emergencyContact || "";

    savePatients();

    return patient;

}


/* =====================================================
   🗑️ DELETE PATIENT (ካርድ ክፍል ብቻ - ሙሉ በሙሉ ይሰርዛል)
===================================================== */

function deletePatient(patientId) {

    const index =
        patients.findIndex(
            function (patient) {

                return (
                    String(patient.id)
                        .toLowerCase() ===
                    String(patientId)
                        .toLowerCase()
                );

            }
        );

    if (index === -1) {

        return false;

    }

    /* መጀመሪያ ወደ ቆሻሻ (Recycle Bin) ይቀመጣል፤ Admin መልሶ ማምጣት ይችላል */
    if (typeof addToRecycleBin === "function") {

        const removedPatient =
            patients[index];

        addToRecycleBin(
            "PATIENT_RECORD",
            JSON.parse(
                JSON.stringify(removedPatient)
            ),
            (
                (removedPatient.name || "") +
                " " +
                (removedPatient.fatherName || "") +
                " " +
                (removedPatient.grandfatherName || "")
            ).trim()
        );

    }

    patients.splice(index, 1);

    savePatients();

    if (
        typeof deleteFirestoreDoc === "function"
    ) {

        deleteFirestoreDoc("patients", patientId);

    }

    updatePatientCount();

    return true;

}


/* =====================================================
   💾 SAVE PATIENTS
===================================================== */

function savePatients() {

    localStorage.setItem(
        "clinicPatients",
        JSON.stringify(patients)
    );

    if (
        typeof saveFirestoreCollection ===
        "function"
    ) {

        saveFirestoreCollection("patients");

    }

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "patients",

        "clinicPatients",

        function () {

            return patients;

        },

        function (newArray) {

            patients = newArray;

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


/* =====================================================
   🆔 CREATE PATIENT ID
===================================================== */

function createPatientId() {

    let highestNumber = 0;

    patients.forEach(function (patient) {

        const match =
            String(patient.id || "")
                .match(/PAT-?(\d+)/i);

        if (match) {

            const number =
                parseInt(match[1], 10);

            if (
                !isNaN(number) &&
                number > highestNumber
            ) {

                highestNumber = number;

            }

        }

    });


    return (
        "PAT" +
        String(highestNumber + 1)
            .padStart(5, "0")
    );

}


/* =====================================================
   CREATE PATIENT
===================================================== */

function createPatient(data) {

    if (!data) {
        return null;
    }


    const patient = {

        id: createPatientId(),

        firstName:
            data.firstName || "",

        fatherName:
            data.fatherName || "",

        grandfatherName:
            data.grandfatherName || "",

        gender:
            data.gender || "",

        age:
            data.age || "",

        phone:
            data.phone || "",

        kebele:
            data.kebele || "",

        address:
            data.address || "",

        bloodType:
            data.bloodType || "",

        emergencyContact:
            data.emergencyContact || "",

        createdAt:
            new Date().toISOString(),

        /* ==========================================
           🔄 WORKFLOW STATUS
           ካርድ → ካሸር → ሀኪም → (ተጠናቀቀ ማለት ወደ ካርድ ይመለሳል)
        ========================================== */

        status:
            "ካርድ",

        assignedDoctorId:
            "",

        hasPaidCardFee:
            false,

        history: []

    };


    patients.push(patient);

    savePatients();

    updatePatientCount();

    return patient;

}


/* =====================================================
   👤 GET ALL PATIENTS
===================================================== */

function getAllPatients() {

    return patients;

}


/* =====================================================
   🔎 GET PATIENT BY ID
===================================================== */

function getPatientById(patientId) {

    if (!patientId) {
        return null;
    }


    return patients.find(
        function (patient) {

            return (
                String(patient.id)
                .toLowerCase() ===
                String(patientId)
                .toLowerCase()
            );

        }
    ) || null;

}


/* =====================================================
   🔍 SEARCH PATIENTS
===================================================== */

function searchPatients(keyword = "") {

    const text =
        String(keyword)
            .toLowerCase()
            .trim();


    if (!text) {

        return patients;

    }


    return patients.filter(
        function (patient) {

            const fullName = (

                patient.firstName +
                " " +
                patient.fatherName +
                " " +
                patient.grandfatherName

            ).toLowerCase();


            return (

                String(patient.id)
                    .toLowerCase()
                    .includes(text)

                ||

                fullName.includes(text)

                ||

                String(
                    patient.phone || ""
                )
                    .toLowerCase()
                    .includes(text)

                ||

                String(
                    patient.kebele || ""
                )
                    .toLowerCase()
                    .includes(text)

            );

        }
    );

}


/* =====================================================
   🔄 WORKFLOW: GET PATIENTS BY STATUS
===================================================== */

function getPatientsByStatus(status) {

    return patients.filter(
        function (patient) {

            return patient.status === status;

        }
    );

}


/* =====================================================
   ➡️ SEND PATIENT TO CASHIER (ካርድ → ካሸር)
===================================================== */

function sendPatientToCashier(patientId) {

    const patient =
        getPatientById(patientId);

    if (!patient) {

        alert(
            "ታካሚው አልተገኘም።"
        );

        return false;

    }

    patient.status =
        "ካሸር";

    patient.assignedDoctorId =
        "";

    savePatients();

    if (
        typeof logPatientAccess ===
        "function"
    ) {

        logPatientAccess(
            patient.id,
            "SEND_TO_CASHIER"
        );

    }

    alert(
        "➡️ ታካሚው ወደ ካሸር ተልኳል።"
    );

    displayPatients();

    return true;

}


/* =====================================================
   🩺 SEND PATIENT DIRECTLY TO DOCTOR (ያለ ክፍያ)
   ------------------------------------------
   ክፍያ የማያስፈልገው ታካሚ (ለምሳሌ ተመላሽ ክትትል) ካሸር
   ሳያልፍ በቀጥታ ወደ ተመረጠው ዶክተር ይላካል።
===================================================== */

function sendPatientDirectlyToDoctor(patientId) {

    const patient =
        getPatientById(patientId);

    if (!patient) {

        alert(
            "ታካሚው አልተገኘም።"
        );

        return false;

    }

    const doctors =
        typeof getDoctors === "function"
            ? getDoctors()
            : [];

    if (doctors.length === 0) {

        alert(
            "እስካሁን ምንም ዶክተር አልተመዘገበም።"
        );

        return false;

    }

    let message =
        "🩺 ይህ ታካሚ ያለ ክፍያ ወደ የትኛው ዶክተር ይላክ? የዶክተር ID ያስገቡ:\n\n";

    doctors.forEach(
        function (doctor) {

            message +=

                doctor.id +
                " - " +
                doctor.firstName +
                " " +
                doctor.fatherName +
                "\n";

        }
    );

    const doctorIdInput =
        prompt(message);

    if (!doctorIdInput) {

        return false;

    }

    const doctor =
        typeof getDoctorById === "function"
            ? getDoctorById(doctorIdInput.trim())
            : null;

    if (!doctor) {

        alert(
            "ይህ የዶክተር ID አልተገኘም።"
        );

        return false;

    }

    patient.status =
        "ሀኪም";

    patient.assignedDoctorId =
        doctor.id;

    savePatients();

    if (
        typeof logPatientAccess ===
        "function"
    ) {

        logPatientAccess(
            patient.id,
            "SEND_DIRECTLY_TO_DOCTOR"
        );

    }

    alert(
        "🩺 ታካሚው ያለ ክፍያ በቀጥታ ወደ ዶክተር " +
        doctor.firstName +
        " ተልኳል።"
    );

    displayPatients();

    return true;

}


/* =====================================================
   ✅ COMPLETE VISIT (ሀኪም ጨርሶ → ወደ ካርድ ብቻ ይመለሳል)
===================================================== */

function completePatientVisit(patientId) {

    const patient =
        getPatientById(patientId);

    if (!patient) {

        return false;

    }

    /* 🚨 ኤመርጀንሲ ታካሚ ገና ካልከፈለ (ክፍያ ሳይቀድም ወደ ዶክተር
       የገባ) ወደ ካሸር ይላካል ለክፍያ/ማሰናበት - ወደ ካርድ
       (ሙሉ በሙሉ የተዘጋ) ገና አይሂድም። */

    if (
        patient.isEmergency &&
        !patient.hasPaidCardFee
    ) {

        patient.status =
            "ካሸር";

    } else {

        patient.status =
            "ካርድ";

    }

    patient.assignedDoctorId =
        "";

    savePatients();

    return true;

}


/* =====================================================
   📚 PATIENT HISTORY
===================================================== */

function getPatientHistory(patientId) {

    const patient =
        getPatientById(patientId);


    if (!patient) {
        return [];
    }


    if (!Array.isArray(patient.history)) {

        patient.history = [];

    }


    return patient.history;

}


/* =====================================================
   ADD HISTORY
===================================================== */

function addPatientHistory(
    patientId,
    historyData
) {

    const patient =
        getPatientById(patientId);


    if (!patient) {
        return false;
    }


    if (!Array.isArray(patient.history)) {

        patient.history = [];

    }


    patient.history.push({

        date:
            formatEthiopianDateTime(new Date()),

        doctorId:
            historyData &&
            historyData.doctorId
                ? historyData.doctorId
                : "",

        doctorName:
            historyData &&
            historyData.doctorName
                ? historyData.doctorName
                : "",

        note:
            historyData &&
            historyData.note
                ? historyData.note
                : "",

        diagnosis:
            historyData &&
            historyData.diagnosis
                ? historyData.diagnosis
                : "",

        treatment:
            historyData &&
            historyData.treatment
                ? historyData.treatment
                : "",

        diagnosticResults:
            historyData &&
            historyData.diagnosticResults
                ? historyData.diagnosticResults
                : ""

    });


    savePatients();

    return true;

}


/* =====================================================
   📊 PATIENT COUNT
===================================================== */

function updatePatientCount() {

    const count =
        document.getElementById(
            "patientCount"
        );


    if (count) {

        count.textContent =
            patients.length;

    }

}


/* =====================================================
   🛡️ SAFE TEXT
===================================================== */

function escapePatientText(value) {

    return String(
        value ?? ""
    )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =====================================================
   🏷️ STATUS BADGE TEXT
===================================================== */

function patientStatusLabel(patient) {

    if (patient.status === "ካርድ") {

        return "🗂️ በካርድ ክፍል";

    }

    if (patient.status === "ካሸር") {

        return "💰 በካሸር ወረፋ ላይ";

    }

    if (patient.status === "ሀኪም") {

        const doctor =
            typeof getDoctorById === "function"
                ? getDoctorById(patient.assignedDoctorId)
                : null;

        return (
            "🩺 ከሀኪም ጋር" +
            (
                doctor
                    ? " (" + doctor.firstName + ")"
                    : ""
            )
        );

    }

    return "-";

}


/* =====================================================
   📋 DISPLAY PATIENTS (ካርድ ክፍል)
===================================================== */

function displayPatients() {

    const list =
        document.getElementById(
            "patientList"
        );


    if (!list) {
        return;
    }


    const searchInput =
        document.getElementById(
            "patientSearch"
        );


    const keyword =
        searchInput
            ? searchInput.value
            : "";


    const results =
        searchPatients(keyword);


    if (results.length === 0) {

        list.innerHTML = `

            <p>
                ምንም ታካሚ አልተገኘም።
            </p>

        `;

        return;

    }


    list.innerHTML =
        results
            .slice()
            .reverse()
            .map(
        function (patient) {

                return `

                    <div class="patient-item">

                        <h3>
                            👤
                            ${escapePatientText(
                                patient.firstName
                            )}
                            ${escapePatientText(
                                patient.fatherName
                            )}
                        </h3>


                        <p>

                            <strong>
                                🪪 የታካሚ ID:
                            </strong>

                            ${escapePatientText(
                                patient.id
                            )}

                        </p>


                        <p>

                            <strong>
                                📍 ሁኔታ:
                            </strong>

                            ${patientStatusLabel(patient)}

                        </p>


                        <p>

                            <strong>
                                ⚥ ፆታ:
                            </strong>

                            ${escapePatientText(
                                patient.gender
                            )}

                        </p>


                        <p>

                            <strong>
                                🎂 ዕድሜ:
                            </strong>

                            ${escapePatientText(
                                patient.age
                            )}

                        </p>


                        <p>

                            <strong>
                                📞 ስልክ:
                            </strong>

                            ${
                                escapePatientText(
                                    patient.phone || "-"
                                )
                            }

                        </p>


                        <p>

                            <strong>
                                🏘️ ቀበሌ:
                            </strong>

                            ${
                                escapePatientText(
                                    patient.kebele || "-"
                                )
                            }

                        </p>


                        <button
                            onclick="viewPatient('${patient.id}')"
                        >
                            👁️ መረጃ ክፈት
                        </button>

                        ${
                            patient.status === "ካርድ"
                            ? `<button onclick="sendPatientToCashier('${patient.id}')" style="background:#0b5d45;">➡️ ወደ ካሸር ላክ (ክፍያ ካለው)</button>
                               <button onclick="sendPatientDirectlyToDoctor('${patient.id}')" style="background:#2f6fed;">🩺 ወደ ሀኪም ላክ (ያለ ክፍያ)</button>`
                            : ""
                        }

                        <button
                            onclick="editPatient('${patient.id}')"
                        >
                            ✏️ አርም
                        </button>

                        <button
                            onclick="handleDeletePatient('${patient.id}')"
                            style="background:#c0392b;"
                        >
                            🗑️ ሰርዝ
                        </button>

                    </div>

                `;

            }
        ).join("");

}


/* =====================================================
   👁️ VIEW PATIENT
===================================================== */

function viewPatient(patientId) {

    const patient =
        getPatientById(patientId);


    if (!patient) {

        alert(
            "ታካሚው አልተገኘም።"
        );

        return;

    }


    let message =

        "👤 የታካሚ መረጃ\n\n" +

        "🪪 ID: " +
        patient.id +

        "\n\nስም: " +
        patient.firstName +
        " " +
        patient.fatherName +
        " " +
        (
            patient.grandfatherName || ""
        ) +

        "\n\nፆታ: " +
        patient.gender +

        "\nዕድሜ: " +
        patient.age +

        "\nስልክ: " +
        (
            patient.phone || "-"
        ) +

        "\nቀበሌ: " +
        (
            patient.kebele || "-"
        ) +

        "\nአድራሻ: " +
        (
            patient.address || "-"
        ) +

        "\nየደም አይነት: " +
        (
            patient.bloodType || "-"
        ) +

        "\n\nየአሁኑ ሁኔታ: " +
        patientStatusLabel(patient);


    const history =
        getPatientHistory(
            patient.id
        );


    message +=
        "\n\n📚 የቀድሞ History: " +
        history.length +
        " መዝገብ";


    if (history.length > 0) {

        history.forEach(
            function (item, index) {

                message +=

                    "\n\n" +
                    (index + 1) +
                    ". " +
                    (
                        item.date || "-"
                    ) +

                    "\nDoctor ID: " +
                    (
                        item.doctorId || "-"
                    ) +

                    "\nዶክተር: " +
                    (
                        item.doctorName || "-"
                    ) +

                    "\nDiagnosis: " +
                    (
                        item.diagnosis || "-"
                    ) +

                    "\nNote: " +
                    (
                        item.note || "-"
                    ) +

                    (
                        item.diagnosticResults
                            ? "\n\n📋 የላብ/ራጅ ውጤት፦\n" + item.diagnosticResults
                            : ""
                    );

            }
        );

    }


    alert(message);

}


/* =====================================================
   ✏️ EDIT PATIENT (fills the existing form)
===================================================== */

function editPatient(patientId) {

    const patient =
        getPatientById(patientId);

    if (!patient) {

        alert(
            "ታካሚው አልተገኘም።"
        );

        return;

    }

    document.getElementById(
        "patientFirstName"
    ).value =
        patient.firstName || "";

    document.getElementById(
        "patientFatherName"
    ).value =
        patient.fatherName || "";

    document.getElementById(
        "patientGrandfatherName"
    ).value =
        patient.grandfatherName || "";

    document.getElementById(
        "patientGender"
    ).value =
        patient.gender || "";

    document.getElementById(
        "patientAge"
    ).value =
        patient.age || "";

    document.getElementById(
        "patientPhone"
    ).value =
        patient.phone || "";

    document.getElementById(
        "patientKebele"
    ).value =
        patient.kebele || "";

    document.getElementById(
        "patientAddress"
    ).value =
        patient.address || "";

    document.getElementById(
        "patientBloodType"
    ).value =
        patient.bloodType || "";

    document.getElementById(
        "patientEmergency"
    ).value =
        patient.emergencyContact || "";

    currentEditingPatientId =
        patient.id;

    const submitBtn =
        document.querySelector(
            "#patientForm button[type=submit]"
        );

    if (submitBtn) {

        submitBtn.textContent =
            "🔄 ለውጡን አስቀምጥ";

    }

    showCancelEditPatientButton();

    const form =
        document.getElementById(
            "patientForm"
        );

    if (form) {

        form.scrollIntoView({
            behavior: "smooth"
        });

    }

}


/* =====================================================
   ❌ CANCEL EDIT
===================================================== */

function cancelEditPatient() {

    currentEditingPatientId =
        null;

    const form =
        document.getElementById(
            "patientForm"
        );

    if (form) {

        form.reset();

    }

    const submitBtn =
        document.querySelector(
            "#patientForm button[type=submit]"
        );

    if (submitBtn) {

        submitBtn.textContent =
            "💾 ታካሚውን መዝግብ";

    }

    hideCancelEditPatientButton();

}


function showCancelEditPatientButton() {

    let btn =
        document.getElementById(
            "cancelEditPatientBtn"
        );

    if (!btn) {

        btn =
            document.createElement(
                "button"
            );

        btn.type = "button";

        btn.id =
            "cancelEditPatientBtn";

        btn.textContent =
            "❌ ማረም ተወው";

        btn.style.gridColumn =
            "1 / -1";

        btn.style.background =
            "#94a3b8";

        btn.onclick =
            cancelEditPatient;

        const form =
            document.getElementById(
                "patientForm"
            );

        if (form) {

            form.appendChild(btn);

        }

    }

    btn.style.display = "block";

}


function hideCancelEditPatientButton() {

    const btn =
        document.getElementById(
            "cancelEditPatientBtn"
        );

    if (btn) {

        btn.style.display = "none";

    }

}


/* =====================================================
   🗑️ DELETE HANDLER (with confirmation)
===================================================== */

function handleDeletePatient(patientId) {

    const confirmDelete =
        confirm(
            "ይህን ታካሚ ወደ ቆሻሻ ማንቀሳቀስ ይፈልጋሉ? Admin ከቆሻሻ ክፍል መልሶ ማምጣት ይችላል።"
        );

    if (!confirmDelete) {

        return;

    }

    deletePatient(patientId);

    if (
        currentEditingPatientId ===
        patientId
    ) {

        cancelEditPatient();

    }

    displayPatients();

}


/* =====================================================
   🚀 PATIENT PAGE
===================================================== */

function setupPatientSystem() {

    const form =
        document.getElementById(
            "patientForm"
        );


    if (!form) {
        return;
    }


    if (
        form.dataset.ready === "true"
    ) {

        return;

    }


    form.dataset.ready = "true";


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const data = {

                firstName:
                    document.getElementById(
                        "patientFirstName"
                    ).value.trim(),

                fatherName:
                    document.getElementById(
                        "patientFatherName"
                    ).value.trim(),

                grandfatherName:
                    document.getElementById(
                        "patientGrandfatherName"
                    ).value.trim(),

                gender:
                    document.getElementById(
                        "patientGender"
                    ).value,

                age:
                    document.getElementById(
                        "patientAge"
                    ).value,

                phone:
                    document.getElementById(
                        "patientPhone"
                    ).value.trim(),

                kebele:
                    document.getElementById(
                        "patientKebele"
                    ).value.trim(),

                address:
                    document.getElementById(
                        "patientAddress"
                    ).value.trim(),

                bloodType:
                    document.getElementById(
                        "patientBloodType"
                    ).value,

                emergencyContact:
                    document.getElementById(
                        "patientEmergency"
                    ).value.trim()

            };


            const patient =
                currentEditingPatientId
                    ? updatePatient(
                        currentEditingPatientId,
                        data
                    )
                    : createPatient(data);


            if (!patient) {

                alert(
                    currentEditingPatientId
                        ? "ማዘመን አልተቻለም።"
                        : "ታካሚው ሊመዘገብ አልቻለም።"
                );

                return;

            }


            if (currentEditingPatientId) {

                alert(
                    "✅ የታካሚው መረጃ ተስተካክሏል።"
                );

                cancelEditPatient();

            } else {

                alert(

                    "✅ ታካሚው በትክክል ተመዝግቧል።\n\n" +

                    "🪪 የታካሚ ID: " +
                    patient.id +

                    "\n\nአሁን «➡️ ወደ ካሸር ላክ» (ክፍያ ካለው) ወይም «🩺 ወደ ሀኪም ላክ» (ክፍያ ከሌለው) የሚለውን ተጭነው መላክ ይችላሉ።"

                );

                form.reset();

            }

            displayPatients();

            updatePatientCount();

        }
    );


    displayPatients();

    updatePatientCount();

}


/* =====================================================
   🚀 START PATIENT SYSTEM
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupPatientSystem();

        displayPatients();

        updatePatientCount();

    }
);