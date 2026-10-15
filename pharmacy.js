
// ==========================================
// ፋርማሲ አስተዳደር - PHARMACY
// ==========================================

const PHARMACY_STORAGE = "clinic_pharmacy";

// ==========================================
// የፋርማሲ መረጃ ማንበብ
// ==========================================

let pharmacyPrescriptionsCache =
    JSON.parse(
        localStorage.getItem(PHARMACY_STORAGE)
    ) || [];


function getPharmacyPrescriptions() {

    return pharmacyPrescriptionsCache;

}

// ==========================================
// የፋርማሲ መረጃ ማስቀመጥ
// ==========================================

function savePharmacyPrescriptions(
    prescriptions
) {

    pharmacyPrescriptionsCache =
        prescriptions;

    localStorage.setItem(
        PHARMACY_STORAGE,
        JSON.stringify(prescriptions)
    );

    if (
        typeof saveFirestoreCollection ===
        "function"
    ) {

        saveFirestoreCollection("pharmacyPrescriptions");

    }

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "pharmacyPrescriptions",

        PHARMACY_STORAGE,

        function () {

            return pharmacyPrescriptionsCache;

        },

        function (newArray) {

            pharmacyPrescriptionsCache = newArray;

        },

        function () {

            if (
                typeof rerenderCurrentPage === "function"
            ) {

                rerenderCurrentPage();

            }

            if (
                typeof updatePharmacyCount === "function"
            ) {

                updatePharmacyCount();

            }

        }

    );

}

// ==========================================
// Prescription ID መፍጠር
// ==========================================

function createPrescriptionId() {

    const prescriptions =
        getPharmacyPrescriptions();

    let number =
        prescriptions.length + 1;

    let id =
        "RX-" +
        String(number).padStart(5, "0");

    while (
        prescriptions.some(
            prescription =>
                prescription.id === id
        )
    ) {

        number++;

        id =
            "RX-" +
            String(number).padStart(5, "0");

    }

    return id;

}

// ==========================================
// የመድሃኒት ዝርዝር
// ==========================================

const MEDICINES = [

    {
        id: "PARA500",
        name: "Paracetamol 500mg",
        form: "Tablet"
    },

    {
        id: "AMOX500",
        name: "Amoxicillin 500mg",
        form: "Capsule"
    },

    {
        id: "IBU400",
        name: "Ibuprofen 400mg",
        form: "Tablet"
    },

    {
        id: "ORS",
        name: "ORS",
        form: "Sachet"
    },

    {
        id: "OMEP20",
        name: "Omeprazole 20mg",
        form: "Capsule"
    },

    {
        id: "MET500",
        name: "Metformin 500mg",
        form: "Tablet"
    },

    {
        id: "AMLO5",
        name: "Amlodipine 5mg",
        form: "Tablet"
    },

    {
        id: "CET10",
        name: "Cetirizine 10mg",
        form: "Tablet"
    }

];

// ==========================================
// 💾 CUSTOM MEDICINES (added by doctor/pharmacist)
// ==========================================

function getCustomMedicines() {

    try {

        return (
            JSON.parse(
                localStorage.getItem(
                    "clinicCustomMedicines"
                )
            ) || []
        );

    } catch (error) {

        return [];

    }

}


function saveCustomMedicines(list) {

    localStorage.setItem(
        "clinicCustomMedicines",
        JSON.stringify(list)
    );

}


// ==========================================
// 💊 ALL MEDICINES (base + custom)
// ==========================================

function getAllMedicines() {

    return [

        ...MEDICINES,

        ...getCustomMedicines()

    ];

}


// ==========================================
// ➕ ADD CUSTOM MEDICINE
// ==========================================

function addCustomMedicine(
    name,
    form
) {

    const cleanName =
        String(name || "").trim();

    if (!cleanName) {

        alert(
            "የመድሃኒት ስም ያስገቡ።"
        );

        return null;

    }

    const all =
        getAllMedicines();

    const exists =
        all.some(
            function (medicine) {

                return (
                    medicine.name.toLowerCase() ===
                    cleanName.toLowerCase()
                );

            }
        );

    if (exists) {

        alert(
            "ይህ መድሃኒት ቀድሞ አለ።"
        );

        return null;

    }

    const newMedicine = {

        id:
            "CUSTOM-" +
            Date.now(),

        name:
            cleanName,

        form:
            String(form || "").trim() ||
            "-"

    };

    const custom =
        getCustomMedicines();

    custom.push(newMedicine);

    saveCustomMedicines(custom);

    return newMedicine;

}

// ==========================================
// Prescription መመዝገብ
// ==========================================

function createPrescription(
    prescriptionData
) {

    const prescriptions =
        getPharmacyPrescriptions();

    const prescription = {

        id:
            createPrescriptionId(),

        patientId:
            prescriptionData.patientId || "",

        patientName:
            prescriptionData.patientName || "",

        doctorId:
            prescriptionData.doctorId || "",

        doctorName:
            prescriptionData.doctorName || "",

        medicines:
            prescriptionData.medicines || [],

        notes:
            prescriptionData.notes || "",

        diagnosis:
            prescriptionData.diagnosis || "",

        weight:
            prescriptionData.weight || "",

        prescriberQualification:
            prescriptionData.prescriberQualification || "",

        prescriberRegistration:
            prescriptionData.prescriberRegistration || "",

        date:
            new Date().toISOString(),

        /* ==========================================
           status:
           "አዲስ ትዕዛዝ" → ፋርማሲ ገና አላየውም
           "ወደ ካሸር ተልኳል" → ክፍያ በካሸር እንዲፈጸም ተልኳል
           "ተከፍሏል" → ተከፍሏል፣ ፋርማሲ መስጠት ይችላል
           "ተሰጥቷል" → መድሃኒት ተሰጥቷል (ተጠናቋል)
        ========================================== */

        status:
            "አዲስ ትዕዛዝ",

        paymentAmount:
            0,

        dispensedBy:
            "",

        dispensedDate:
            ""

    };

    prescriptions.push(prescription);

    savePharmacyPrescriptions(
        prescriptions
    );

    return prescription;

}

// ==========================================
// የተጠባበቁ Prescription ማየት
// ==========================================

function getPendingPrescriptions() {

    return getPharmacyPrescriptions()
        .filter(
            prescription =>
                prescription.status !==
                "ተሰጥቷል"
        );

}

// ==========================================
// Prescription ID በመጠቀም መፈለግ
// ==========================================

function getPrescriptionById(
    prescriptionId
) {

    const prescriptions =
        getPharmacyPrescriptions();

    return prescriptions.find(
        prescription =>
            prescription.id ===
            prescriptionId
    ) || null;

}

// ==========================================
// መድሃኒት መስጠት
// ==========================================

function dispensePrescription(
    prescriptionId,
    pharmacistName
) {

    const prescriptions =
        getPharmacyPrescriptions();

    const index =
        prescriptions.findIndex(
            prescription =>
                prescription.id ===
                prescriptionId
        );

    if (index === -1) {

        return false;

    }

    prescriptions[index].status =
        "ተሰጥቷል";

    prescriptions[index].dispensedBy =
        pharmacistName || "";

    prescriptions[index].dispensedDate =
        new Date().toISOString();

    savePharmacyPrescriptions(
        prescriptions
    );

    return true;

}


// ==========================================
// 💰 ክፍያ በፋርማሲ ራሱ ፈጽም
// ==========================================

function payPrescriptionAtPharmacy(
    prescriptionId,
    amount
) {

    const prescriptions =
        getPharmacyPrescriptions();

    const index =
        prescriptions.findIndex(
            prescription =>
                prescription.id === prescriptionId
        );

    if (index === -1) {

        return false;

    }

    prescriptions[index].status =
        "ተከፍሏል";

    prescriptions[index].paymentAmount =
        Number(amount) || 0;

    savePharmacyPrescriptions(
        prescriptions
    );

    const session =
        typeof getCurrentSession === "function"
            ? getCurrentSession()
            : null;

    if (
        typeof createPayment === "function"
    ) {

        createPayment({

            patientId:
                prescriptions[index].patientId,

            patientName:
                prescriptions[index].patientName,

            doctorId:
                prescriptions[index].doctorId,

            doctorName:
                prescriptions[index].doctorName,

            serviceType:
                "PHARMACY",

            serviceName:
                "ፋርማሲ (RX " + prescriptionId + ")",

            amount:
                amount,

            paymentMethod:
                "ጥሬ ገንዘብ",

            notes:
                "በፋርማሲ ራሱ የተከፈለ",

            receivedBy:
                session ? session.name : ""

        });

    }

    return true;

}


// ==========================================
// ➡️ ወደ ካሸር ላክ (ክፍያ)
// ==========================================

function sendPrescriptionToCashier(
    prescriptionId
) {

    const prescriptions =
        getPharmacyPrescriptions();

    const index =
        prescriptions.findIndex(
            prescription =>
                prescription.id === prescriptionId
        );

    if (index === -1) {

        return false;

    }

    prescriptions[index].status =
        "ወደ ካሸር ተልኳል";

    savePharmacyPrescriptions(
        prescriptions
    );

    return true;

}


// ==========================================
// 🗑️ CANCEL PRESCRIPTION (→ ቆሻሻ ማጠራቀሚያ)
// ==========================================

function cancelPrescription(prescriptionId) {

    const prescriptions =
        getPharmacyPrescriptions();

    const index =
        prescriptions.findIndex(
            prescription =>
                prescription.id === prescriptionId
        );

    if (index === -1) {

        return false;

    }

    const prescription =
        prescriptions[index];

    if (
        typeof addToRecycleBin === "function"
    ) {

        addToRecycleBin(
            "PRESCRIPTION",
            prescription,
            (
                prescription.patientName ||
                prescription.patientId
            ) +
            " - " +
            (prescription.medicines || [])
                .map(m => m.name)
                .join(", ")
        );

    }

    prescriptions.splice(index, 1);

    savePharmacyPrescriptions(prescriptions);

    if (
        typeof deleteFirestoreDoc === "function"
    ) {

        deleteFirestoreDoc("pharmacyPrescriptions", prescriptionId);

    }

    return true;

}

// ==========================================
// የታካሚ መድሃኒት History
// ==========================================

function getPatientPrescriptionHistory(
    patientId
) {

    return getPharmacyPrescriptions()
        .filter(
            prescription =>
                prescription.patientId ===
                patientId
        );

}

// ==========================================
// የዶክተር Prescription History
// ==========================================

function getDoctorPrescriptions(
    doctorId
) {

    return getPharmacyPrescriptions()
        .filter(
            prescription =>
                prescription.doctorId ===
                doctorId
        );

}

// ==========================================
// የPharmacy Prescription ብዛት
// ==========================================

function getPharmacyCount() {

    return getPharmacyPrescriptions()
        .length;

}

// ==========================================
// Dashboard ላይ የPharmacy ቁጥር
// ==========================================

function updatePharmacyCount() {

    const element =
        document.getElementById(
            "pharmacyCount"
        );

    if (element) {

        element.textContent =
            getPharmacyCount();

    }

}

// ==========================================
// 🛡️ SAFE TEXT
// ==========================================

function escapePharmacyText(value) {

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
// 💊 DISPLAY PHARMACY PAGE
// ==========================================

function displayPharmacy() {

    const container =
        document.getElementById(
            "pharmacyContent"
        );

    if (!container) {

        return;

    }

    const medicineCheckboxes =
        getAllMedicines().map(
            function (medicine) {

                return `

                    <label>
                        <input
                            type="checkbox"
                            value="${medicine.id}"
                            data-name="${escapePharmacyText(medicine.name)}"
                        >
                        ${escapePharmacyText(medicine.name)}
                        (${escapePharmacyText(medicine.form)})
                    </label>

                `;

            }
        ).join("");

    container.innerHTML = `

        <div class="pharmacy-form-container">

            <h2>
                ➕ አዲስ Prescription
            </h2>

            <form
                id="prescriptionForm"
                class="clinic-form"
            >

                <label>
                    ታካሚ ID *
                </label>

                <input
                    type="text"
                    id="rxPatientId"
                    placeholder="ለምሳሌ PAT00001"
                    required
                >

                <label>
                    ዶክተር ID
                </label>

                <input
                    type="text"
                    id="rxDoctorId"
                    placeholder="ለምሳሌ DOC00001"
                >

                <label style="grid-column:1/-1;">
                    💊 መድሃኒቶች ይምረጡ
                </label>

                <button
                    type="button"
                    style="grid-column:1/-1; background:#0b5d45; color:white; border:none; border-radius:8px; padding:10px; cursor:pointer;"
                    onclick="handleAddCustomMedicine()"
                >
                    ➕ አዲስ መድሃኒት ጨምር
                </button>

                <div
                    class="checkbox-list"
                    style="grid-column:1/-1;"
                    id="rxMedicineList"
                >

                    ${medicineCheckboxes}

                </div>

                <label style="grid-column:1/-1;">
                    ማስታወሻ (መጠን፣ የቀናት ብዛት...)
                </label>

                <textarea
                    id="rxNotes"
                    style="grid-column:1/-1;"
                ></textarea>

                <button type="submit">
                    💾 Prescription መዝግብ
                </button>

            </form>

        </div>

        <hr>

        <div class="pharmacy-list-container">

            <h2>
                💊 የተጠባበቁ Prescriptions
            </h2>

            <div id="pharmacyList"></div>

        </div>

    `;

    setupPrescriptionForm();

    renderPharmacyList();

}

// ==========================================
// ➕ ADD MEDICINE FROM PHARMACY PAGE
// ==========================================

function handleAddCustomMedicine() {

    const name =
        prompt(
            "➕ አዲስ የመድሃኒት ስም ያስገቡ:"
        );

    if (name === null) {

        return;

    }

    const form =
        prompt(
            "💊 ፎርም (ለምሳሌ Tablet, Syrup, Injection):"
        ) || "";

    const result =
        addCustomMedicine(
            name,
            form
        );

    if (result) {

        alert(
            "✅ መድሃኒቱ ተጨምሯል።"
        );

        displayPharmacy();

    }

}

// ==========================================
// 📝 SETUP PRESCRIPTION FORM
// ==========================================

function setupPrescriptionForm() {

    const form =
        document.getElementById(
            "prescriptionForm"
        );

    if (!form) {

        return;

    }

    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const patientId =
                document.getElementById(
                    "rxPatientId"
                ).value.trim();

            const doctorId =
                document.getElementById(
                    "rxDoctorId"
                ).value.trim();

            const patient =
                typeof getPatientById ===
                "function"
                    ? getPatientById(patientId)
                    : null;

            if (!patient) {

                alert(
                    "❌ ይህ ታካሚ ID አልተገኘም። እባክዎ ትክክለኛ ID ያስገቡ።"
                );

                return;

            }

            let doctor = null;

            if (doctorId) {

                doctor =
                    typeof getDoctorById ===
                    "function"
                        ? getDoctorById(doctorId)
                        : null;

                if (!doctor) {

                    alert(
                        "❌ ይህ ዶክተር ID አልተገኘም።"
                    );

                    return;

                }

            }

            const checkboxes =
                document.querySelectorAll(
                    "#rxMedicineList input[type=checkbox]:checked"
                );

            if (checkboxes.length === 0) {

                alert(
                    "ቢያንስ አንድ መድሃኒት ይምረጡ።"
                );

                return;

            }

            const medicines =
                Array.from(checkboxes).map(
                    function (checkbox) {

                        return {

                            id:
                                checkbox.value,

                            name:
                                checkbox.dataset.name

                        };

                    }
                );

            const notes =
                document.getElementById(
                    "rxNotes"
                ).value.trim();

            const prescription =
                createPrescription({

                    patientId:
                        patient.id,

                    patientName:
                        patient.firstName +
                        " " +
                        patient.fatherName,

                    doctorId:
                        doctor
                            ? doctor.id
                            : "",

                    doctorName:
                        doctor
                            ? doctor.firstName +
                              " " +
                              doctor.fatherName
                            : "",

                    medicines:
                        medicines,

                    notes:
                        notes

                });

            if (prescription) {

                alert(

                    "✅ Prescription ተመዝግቧል።\n\n" +

                    "Prescription ID: " +
                    prescription.id

                );

                displayPharmacy();

            }

        }
    );

}

// ==========================================
// 📋 RENDER PHARMACY LIST
// ==========================================

function renderPharmacyList() {

    const list =
        document.getElementById(
            "pharmacyList"
        );

    if (!list) {

        return;

    }

    const prescriptions =
        getPendingPrescriptions();

    if (prescriptions.length === 0) {

        list.innerHTML = `
            <p>
                አሁን የተጠባበቀ Prescription የለም።
            </p>
        `;

        return;

    }

    list.innerHTML =
        prescriptions.map(
            function (prescription) {

                const medicineRows =
                    (prescription.medicines || [])
                        .map(
                            function (medicine, index) {

                                return `
                                    <div style="border:1px solid #d9e2ec; border-radius:8px; padding:8px 10px; margin:6px 0; background:white;">
                                        <strong>${index + 1}. ${escapePharmacyText(medicine.name)}</strong>
                                        ${medicine.strength ? " - " + escapePharmacyText(medicine.strength) : ""}
                                        ${medicine.form ? " (" + escapePharmacyText(medicine.form) + ")" : ""}
                                        <br>
                                        ${
                                            [
                                                medicine.dose ? "መጠን: " + escapePharmacyText(medicine.dose) : "",
                                                medicine.frequency ? "ድግግሞሽ: " + escapePharmacyText(medicine.frequency) : "",
                                                medicine.duration ? "ጊዜ: " + escapePharmacyText(medicine.duration) : "",
                                                medicine.quantity ? "ብዛት: " + escapePharmacyText(medicine.quantity) : ""
                                            ].filter(Boolean).join(" | ")
                                        }
                                        ${
                                            medicine.instructions
                                            ? "<br><em>" + escapePharmacyText(medicine.instructions) + "</em>"
                                            : ""
                                        }
                                    </div>
                                `;

                            }
                        )
                        .join("");

                let actionButtons = "";

                if (
                    prescription.status ===
                    "አዲስ ትዕዛዝ"
                ) {

                    actionButtons = `
                        <button onclick="handlePayHere('${prescription.id}')">
                            💰 እዚሁ ክፈል & ስጥ
                        </button>

                        <button onclick="handleSendToCashier('${prescription.id}')">
                            ➡️ ወደ ካሸር ላክ
                        </button>
                    `;

                } else if (
                    prescription.status ===
                    "ወደ ካሸር ተልኳል"
                ) {

                    actionButtons = `
                        <p style="color:#c0392b;">
                            ⏳ ክፍያ በካሸር በመጠባበቅ ላይ
                        </p>
                    `;

                } else if (
                    prescription.status ===
                    "ተከፍሏል"
                ) {

                    actionButtons = `
                        <p style="color:#0b5d45;">
                            ✅ ተከፍሏል
                        </p>

                        <button onclick="handleDispensePrescription('${prescription.id}')">
                            💊 መድሃኒት ስጥ (Dispense)
                        </button>
                    `;

                }

                return `

                    <div class="patient-item">

                        <h3>
                            💊
                            Prescription
                        </h3>

                        <p>
                            <strong>
                                RX ID:
                            </strong>
                            ${escapePharmacyText(prescription.id)}
                        </p>

                        <p>
                            <strong>
                                ታካሚ:
                            </strong>
                            ${escapePharmacyText(prescription.patientName || prescription.patientId)}
                        </p>

                        <p>
                            <strong>
                                ዶክተር:
                            </strong>
                            ${escapePharmacyText(prescription.doctorName || prescription.doctorId || "-")}
                            ${
                                prescription.prescriberQualification
                                ? " (" + escapePharmacyText(prescription.prescriberQualification) + ")"
                                : ""
                            }
                        </p>

                        ${
                            prescription.diagnosis
                            ? `<p><strong>Diagnosis:</strong> ${escapePharmacyText(prescription.diagnosis)}</p>`
                            : ""
                        }

                        ${
                            prescription.weight
                            ? `<p><strong>ክብደት:</strong> ${escapePharmacyText(prescription.weight)}</p>`
                            : ""
                        }

                        <p>
                            <strong>
                                💊 RX:
                            </strong>
                        </p>

                        ${medicineRows}

                        <p>
                            <strong>
                                ማስታወሻ:
                            </strong>
                            ${escapePharmacyText(prescription.notes || "-")}
                        </p>

                        ${actionButtons}

                        <button
                            onclick="handleCancelPrescription('${prescription.id}')"
                            style="background:#c0392b;"
                        >
                            🗑️ ትዕዛዙን ሰርዝ
                        </button>

                    </div>

                `;

            }
        ).join("");

}


// ==========================================
// 💰 PAY HERE HANDLER
// ==========================================

function handlePayHere(prescriptionId) {

    const amountText =
        prompt(
            "💰 የክፍያ መጠን (ብር) ያስገቡ:"
        );

    if (amountText === null) {

        return;

    }

    const amount =
        Number(amountText);

    if (
        isNaN(amount) ||
        amount <= 0
    ) {

        alert(
            "ትክክለኛ የክፍያ መጠን ያስገቡ።"
        );

        return;

    }

    payPrescriptionAtPharmacy(
        prescriptionId,
        amount
    );

    const session =
        typeof getCurrentSession === "function"
            ? getCurrentSession()
            : null;

    dispensePrescription(
        prescriptionId,
        session ? session.name : ""
    );

    alert(
        "✅ ክፍያው ተፈጽሟል፣ መድሃኒቱም ተሰጥቷል።"
    );

    displayPharmacy();

}


// ==========================================
// ➡️ SEND TO CASHIER HANDLER
// ==========================================

function handleSendToCashier(prescriptionId) {

    sendPrescriptionToCashier(prescriptionId);

    alert(
        "➡️ ወደ ካሸር ተልኳል። ካሸር ክፍያውን ከተቀበለ በኋላ እዚህ ተመልሶ ይታያል።"
    );

    displayPharmacy();

}


// ==========================================
// 🗑️ CANCEL HANDLER
// ==========================================

function handleCancelPrescription(prescriptionId) {

    const confirmCancel =
        confirm(
            "ይህን Prescription መሰረዝ ይፈልጋሉ? (ወደ ቆሻሻ ማጠራቀሚያ ይገባል)"
        );

    if (!confirmCancel) {

        return;

    }

    cancelPrescription(prescriptionId);

    displayPharmacy();

}

// ==========================================
// ✅ DISPENSE HANDLER (ክፍያ ከካሸር ከተረጋገጠ በኋላ)
// ==========================================

function handleDispensePrescription(
    prescriptionId
) {

    const confirmAction =
        confirm(
            "ይህን Prescription እንደተሰጠ ማመልከት ይፈልጋሉ?"
        );

    if (!confirmAction) {

        return;

    }

    const session =
        typeof getCurrentSession ===
        "function"
            ? getCurrentSession()
            : null;

    const pharmacistName =
        session
            ? session.name
            : (
                prompt(
                    "የፋርማሲስት ስም ያስገቡ:"
                ) || ""
            );

    const success =
        dispensePrescription(
            prescriptionId,
            pharmacistName
        );

    if (success) {

        alert(
            "✅ መድሃኒቱ ተሰጥቷል።"
        );

        displayPharmacy();

    }

}

// ==========================================
// ገጹ ሲከፈት
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updatePharmacyCount();

    }
);