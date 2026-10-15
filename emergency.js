

/* =====================================================
   🚨 EMERGENCY (ኤመርጀንሲ)
   ------------------------------------------
   ኤመርጀንሲ ታካሚ ካርድ/ካሸር ሳያልፍ በቀጥታ ወደ ዶክተር ይላካል።
   ክፍያ ግን ህክምናው ከተጠናቀቀ በኋላ በካሸር በኩል ይሰበሰባል
   (patients.js → completePatientVisit,
    payments.js → handleEmergencyBilling)።
===================================================== */


/* =====================================================
   🆕 ኤመርጀንሲ ታካሚ መመዝገብ
===================================================== */

function createEmergencyPatient(data) {

    if (
        !data ||
        !data.doctorId
    ) {

        return null;

    }

    if (
        typeof getDoctorById !== "function" ||
        typeof createPatient !== "function"
    ) {

        return null;

    }

    const doctor =
        getDoctorById(data.doctorId);

    if (!doctor) {

        return null;

    }

    const patient =
        createPatient({

            firstName: data.firstName || "",

            fatherName: data.fatherName || "",

            grandfatherName: data.grandfatherName || "",

            gender: data.gender || "",

            age: data.age || "",

            phone: data.phone || "",

            kebele: data.kebele || "",

            address: data.address || "",

            bloodType: data.bloodType || "",

            emergencyContact: data.emergencyContact || ""

        });

    if (!patient) {

        return null;

    }

    patient.isEmergency = true;

    patient.emergencyReason =
        data.emergencyReason || "";

    patient.emergencyRegisteredAt =
        new Date().toISOString();

    patient.status = "ሀኪም";

    patient.assignedDoctorId = doctor.id;

    patient.hasPaidCardFee = false;

    savePatients();

    if (typeof logActivity === "function") {

        const session =
            typeof getCurrentSession === "function"
                ? getCurrentSession()
                : null;

        logActivity(
            session ? session.userId : "-",
            session ? session.name : "-",
            "EMERGENCY_REGISTER",
            patient.firstName + " " + patient.fatherName +
            " → ዶ/ር " + doctor.firstName
        );

    }

    return patient;

}


/* =====================================================
   🖥️ ኤመርጀንሲ ገጽ ማሳያ
===================================================== */

function displayEmergency() {

    const container =
        document.getElementById(
            "emergencyContent"
        );

    if (!container) {

        return;

    }

    const activeDoctors =
        (
            typeof getDoctors === "function"
                ? getDoctors()
                : []
        ).filter(
            function (doctor) {

                return doctor.active === true;

            }
        );

    const doctorOptions =
        activeDoctors.map(
            function (doctor) {

                return `
                    <option value="${doctor.id}">
                        ${escapeEmergencyText(doctor.firstName)}
                        ${escapeEmergencyText(doctor.fatherName)}
                        (${escapeEmergencyText(doctor.specialization)})
                    </option>
                `;

            }
        ).join("");

    container.innerHTML = `

        <div class="security-form-container" style="border:2px solid #c0392b;">

            <h2 style="color:#c0392b;">
                🚨 አዲስ ኤመርጀንሲ ታካሚ መዝግብ
            </h2>

            <p style="color:#c0392b;">
                ይህ ታካሚ ካርድ/ካሸር ሳያልፍ ወዲያውኑ ወደ ዶክተር
                ይላካል። ክፍያ ህክምናው ካለቀ ቡኋላ በካሸር በኩል
                ይሰበሰባል።
            </p>

            <form id="emergencyForm" class="clinic-form" onsubmit="handleSubmitEmergency(event)">

                <label>የመጀመሪያ ስም *</label>
                <input type="text" id="emgFirstName" required>

                <label>የአባት ስም *</label>
                <input type="text" id="emgFatherName" required>

                <label>የአያት ስም</label>
                <input type="text" id="emgGrandfatherName">

                <label>ፆታ *</label>
                <select id="emgGender" required>
                    <option value="">ይምረጡ</option>
                    <option value="ወንድ">ወንድ</option>
                    <option value="ሴት">ሴት</option>
                </select>

                <label>ዕድሜ *</label>
                <input type="number" id="emgAge" min="0" required>

                <label>ስልክ</label>
                <input type="text" id="emgPhone">

                <label>🚨 የህመም/አደጋ ምክንያት (Chief Complaint) *</label>
                <input type="text" id="emgReason" required placeholder="ለምሳሌ: የመኪና አደጋ፣ ከፍተኛ ደም መፍሰስ...">

                <label>ወደ የትኛው ዶክተር ይላክ? *</label>
                <select id="emgDoctorId" required>
                    <option value="">ዶክተር ይምረጡ</option>
                    ${doctorOptions}
                </select>

                <button type="submit" style="background:#c0392b;">
                    🚨 ወዲያውኑ ወደ ዶክተር ላክ
                </button>

            </form>

        </div>

        <hr>

        <h3>📋 ዛሬ የተመዘገቡ ኤመርጀንሲ ታካሚዎች</h3>

        <div id="emergencyTodayList"></div>

    `;

    renderEmergencyTodayList();

}


/* =====================================================
   📋 ዛሬ የተመዘገቡ ኤመርጀንሲ ታካሚዎች ዝርዝር
===================================================== */

function renderEmergencyTodayList() {

    const box =
        document.getElementById(
            "emergencyTodayList"
        );

    if (!box) {

        return;

    }

    const allPatients =
        typeof getAllPatients === "function"
            ? getAllPatients()
            : [];

    const todayStr =
        new Date().toDateString();

    const todaysEmergencies =
        allPatients.filter(
            function (patient) {

                return (
                    patient.isEmergency &&
                    patient.emergencyRegisteredAt &&
                    new Date(patient.emergencyRegisteredAt).toDateString() === todayStr
                );

            }
        );

    if (todaysEmergencies.length === 0) {

        box.innerHTML = `
            <p>ዛሬ የተመዘገበ ኤመርጀንሲ ታካሚ የለም።</p>
        `;

        return;

    }

    box.innerHTML =
        todaysEmergencies.map(
            function (patient) {

                return `

                    <div class="patient-item" style="border:2px solid #c0392b;">

                        <h3>
                            🚨
                            ${escapeEmergencyText(patient.firstName)}
                            ${escapeEmergencyText(patient.fatherName)}
                        </h3>

                        <p>
                            <strong>ID:</strong>
                            ${escapeEmergencyText(patient.id)}
                        </p>

                        <p>
                            <strong>ምክንያት:</strong>
                            ${escapeEmergencyText(patient.emergencyReason)}
                        </p>

                        <p>
                            <strong>ሁኔታ:</strong>
                            ${escapeEmergencyText(patient.status)}
                            ${
                                !patient.hasPaidCardFee
                                ? " (ገና አልተከፈለም)"
                                : " (ተከፍሏል)"
                            }
                        </p>

                    </div>

                `;

            }
        ).join("");

}


/* =====================================================
   📝 ፎርም ማስገቢያ ማስተናገጃ
===================================================== */

function handleSubmitEmergency(event) {

    if (event && event.preventDefault) {

        event.preventDefault();

    }

    const firstName =
        document.getElementById("emgFirstName").value.trim();

    const fatherName =
        document.getElementById("emgFatherName").value.trim();

    const grandfatherName =
        document.getElementById("emgGrandfatherName").value.trim();

    const gender =
        document.getElementById("emgGender").value;

    const age =
        document.getElementById("emgAge").value;

    const phone =
        document.getElementById("emgPhone").value.trim();

    const emergencyReason =
        document.getElementById("emgReason").value.trim();

    const doctorId =
        document.getElementById("emgDoctorId").value;

    if (
        !firstName ||
        !fatherName ||
        !gender ||
        !age ||
        !emergencyReason ||
        !doctorId
    ) {

        alert(
            "እባክዎ ሁሉንም አስፈላጊ (*) መስኮች ይሙሉ።"
        );

        return;

    }

    const patient =
        createEmergencyPatient({

            firstName: firstName,

            fatherName: fatherName,

            grandfatherName: grandfatherName,

            gender: gender,

            age: age,

            phone: phone,

            emergencyReason: emergencyReason,

            doctorId: doctorId

        });

    if (!patient) {

        alert(
            "ስህተት ተፈጥሯል - እንደገና ይሞክሩ።"
        );

        return;

    }

    alert(
        "✅ ኤመርጀንሲ ታካሚው ወደ ዶክተር ተልኳል።\n\nID: " +
        patient.id
    );

    displayEmergency();

}


/* =====================================================
   🧹 ESCAPE HELPER
===================================================== */

function escapeEmergencyText(value) {

    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

}
