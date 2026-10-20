

/* =====================================================
   🏥 CLINIC SYSTEM
   🩺 DOCTORS SYSTEM
===================================================== */


/* =====================================================
   📦 DOCTORS DATA
===================================================== */

let doctors =
    JSON.parse(
        localStorage.getItem("clinicDoctors")
    ) || [];


/* =====================================================
   💾 SAVE DOCTORS
===================================================== */

function saveDoctors() {

    localStorage.setItem(
        "clinicDoctors",
        JSON.stringify(doctors)
    );

    if (
        typeof saveFirestoreCollection ===
        "function"
    ) {

        saveFirestoreCollection("doctors");

    }

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "doctors",

        "clinicDoctors",

        function () {

            return doctors;

        },

        function (newArray) {

            doctors = newArray;

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
   🆔 CREATE DOCTOR ID
===================================================== */

function createDoctorId() {

    let highestNumber = 0;

    doctors.forEach(function (doctor) {

        const match =
            String(doctor.id || "")
                .match(/DOC-?(\d+)/i);

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
        "DOC" +
        String(highestNumber + 1)
            .padStart(5, "0")
    );

}


/* =====================================================
   CREATE DOCTOR
===================================================== */

function createDoctor(data) {

    if (!data) {
        return null;
    }


    const doctor = {

        id: createDoctorId(),

        firstName:
            data.firstName || "",

        fatherName:
            data.fatherName || "",

        grandfatherName:
            data.grandfatherName || "",

        gender:
            data.gender || "",

        specialization:
            data.specialization || "",

        phone:
            data.phone || "",

        email:
            data.email || "",

        licenseNumber:
            data.licenseNumber || "",

        createdAt:
            new Date().toISOString(),

        active: true

    };


    doctors.push(doctor);

    saveDoctors();

    updateDoctorCount();

    return doctor;

}


/* =====================================================
   🩺 GET ALL DOCTORS (used by reports.js)
===================================================== */

function getDoctors() {

    return doctors;

}


let currentEditingDoctorId =
    null;


/* =====================================================
   ✏️ UPDATE DOCTOR
===================================================== */

function updateDoctor(
    doctorId,
    data
) {

    const doctor =
        getDoctorById(doctorId);

    if (!doctor) {

        return null;

    }

    doctor.firstName =
        data.firstName || "";

    doctor.fatherName =
        data.fatherName || "";

    doctor.grandfatherName =
        data.grandfatherName || "";

    doctor.gender =
        data.gender || "";

    doctor.specialization =
        data.specialization || "";

    doctor.phone =
        data.phone || "";

    doctor.email =
        data.email || "";

    doctor.licenseNumber =
        data.licenseNumber || "";

    saveDoctors();

    return doctor;

}


/* =====================================================
   🗑️ DELETE DOCTOR
===================================================== */

function deleteDoctor(doctorId) {

    const index =
        doctors.findIndex(
            function (doctor) {

                return (
                    String(doctor.id)
                        .toLowerCase() ===
                    String(doctorId)
                        .toLowerCase()
                );

            }
        );

    if (index === -1) {

        return false;

    }

    doctors.splice(index, 1);

    saveDoctors();

    if (
        typeof deleteFirestoreDoc === "function"
    ) {

        deleteFirestoreDoc("doctors", doctorId);

    }

    if (
        typeof removeDoctorLogin ===
        "function"
    ) {

        removeDoctorLogin(doctorId);

    }

    updateDoctorCount();

    return true;

}


/* =====================================================
   🔎 GET DOCTOR BY ID
===================================================== */

function getDoctorById(doctorId) {

    return doctors.find(
        function (doctor) {

            return doctor.id === doctorId;

        }
    ) || null;

}


/* =====================================================
   🔍 SEARCH DOCTORS
===================================================== */

function searchDoctors(keyword = "") {

    const text =
        String(keyword)
            .toLowerCase()
            .trim();


    if (!text) {

        return doctors;

    }


    return doctors.filter(
        function (doctor) {

            const fullName = (

                doctor.firstName +
                " " +
                doctor.fatherName +
                " " +
                doctor.grandfatherName

            ).toLowerCase();


            return (

                String(doctor.id)
                    .toLowerCase()
                    .includes(text)

                ||

                fullName.includes(text)

                ||

                String(
                    doctor.specialization || ""
                )
                    .toLowerCase()
                    .includes(text)

            );

        }
    );

}


/* =====================================================
   🩺 DISPLAY DOCTORS PAGE
   -----------------------------------------------------
   ADMIN → ሙሉ የዶክተር አስተዳደር (መመዝገቢያ/ማርም/መሰረዝ + መግቢያ)
   DOCTOR ራሱ ሲገባ → የራሱ ታካሚ ወረፋ ብቻ ያያል
===================================================== */

function displayDoctors() {

    const container =
        document.getElementById(
            "doctorsContent"
        );


    if (!container) {
        return;
    }


    const session =
        typeof getCurrentSession ===
        "function"
            ? getCurrentSession()
            : null;


    if (
        session &&
        session.role === "DOCTOR"
    ) {

        renderDoctorOwnQueue(
            session.doctorId
        );

        return;

    }


    if (
        session &&
        session.role !== "ADMIN"
    ) {

        container.innerHTML = `
            <p>
                ይህን ገጽ ማየት የሚችለው
                አስተዳዳሪ (Admin) ብቻ ነው።
            </p>
        `;

        return;

    }


    container.innerHTML = `

        <div class="doctor-form-container">

            <h2>
                አዲስ ዶክተር መመዝገቢያ
            </h2>


            <form
                id="doctorForm"
                class="clinic-form"
            >


                <label>
                    ስም *
                </label>

                <input
                    type="text"
                    id="doctorFirstName"
                    required
                >


                <label>
                    የአባት ስም *
                </label>

                <input
                    type="text"
                    id="doctorFatherName"
                    required
                >


                <label>
                    የአያት ስም
                </label>

                <input
                    type="text"
                    id="doctorGrandfatherName"
                >


                <label>
                    ፆታ *
                </label>

                <select
                    id="doctorGender"
                    required
                >

                    <option value="">
                        ፆታ ይምረጡ
                    </option>

                    <option value="ወንድ">
                        ወንድ
                    </option>

                    <option value="ሴት">
                        ሴት
                    </option>

                </select>


                <label>
                    ስፔሻሊቲ *
                </label>

                <input
                    type="text"
                    id="doctorSpecialization"
                    placeholder="ለምሳሌ Internal Medicine"
                    required
                >


                <label>
                    📞 ስልክ
                </label>

                <input
                    type="tel"
                    id="doctorPhone"
                >


                <label>
                    📧 Email (አማራጭ)
                </label>

                <input
                    type="text"
                    id="doctorEmail"
                    placeholder="ካለ ብቻ ያስገቡ"
                >


                <label>
                    🪪 የሙያ ፈቃድ ቁጥር
                </label>

                <input
                    type="text"
                    id="doctorLicense"
                >


                <label style="grid-column:1/-1; margin-top:10px; color:#0b5d45;">
                    🔑 የመግቢያ መረጃ (ዶክተሩ ራሱ ብቻ የሚጠቀምበት)
                </label>

                <label>
                    Username *
                </label>

                <input
                    type="text"
                    id="doctorUsername"
                >

                <label>
                    Password *
                </label>

                <input
                    type="text"
                    id="doctorPassword"
                    placeholder="ሲያርሙ ባዶ ከተውት አይቀየርም"
                >


                <br><br>


                <button
                    type="submit"
                    id="doctorSubmitBtn"
                >
                    💾 ዶክተር መዝግብ
                </button>

                <button
                    type="button"
                    id="cancelEditDoctorBtn"
                    style="display:none; background:#94a3b8;"
                    onclick="cancelEditDoctor()"
                >
                    ❌ ማረም ተወው
                </button>


            </form>

        </div>


        <hr>


        <div class="doctor-list-container">

            <h2>
                🩺 የተመዘገቡ ዶክተሮች
            </h2>


            <input
                type="text"
                id="doctorSearch"
                placeholder="በID፣ በስም ወይም በስፔሻሊቲ ፈልግ..."
                oninput="renderDoctorList()"
            >


            <div id="doctorList"></div>

        </div>


        <hr>


        <div class="doctor-list-container">

            <h2>
                🧑‍🤝‍🧑 አሁን ከዶክተሮች ጋር ያሉ ታካሚዎች
            </h2>

            <p style="color:#52606d; font-size:14px;">
                ይህ ዝርዝር ካሸር ወደ ዶክተር የላካቸውን ታካሚዎች ያሳያል፣
                ያ ዶክተር ራሱ ገብቶ የራሱን ወረፋ ማየት ካልፈለገ Admin
                ሆነው ለማረጋገጫ ብቻ የሚያገለግል ነው።
            </p>

            <div id="adminDoctorQueueOverview"></div>

        </div>

    `;


    if (currentEditingDoctorId) {

        const doctor =
            getDoctorById(
                currentEditingDoctorId
            );

        if (doctor) {

            document.getElementById(
                "doctorFirstName"
            ).value =
                doctor.firstName || "";

            document.getElementById(
                "doctorFatherName"
            ).value =
                doctor.fatherName || "";

            document.getElementById(
                "doctorGrandfatherName"
            ).value =
                doctor.grandfatherName || "";

            document.getElementById(
                "doctorGender"
            ).value =
                doctor.gender || "";

            document.getElementById(
                "doctorSpecialization"
            ).value =
                doctor.specialization || "";

            document.getElementById(
                "doctorPhone"
            ).value =
                doctor.phone || "";

            document.getElementById(
                "doctorEmail"
            ).value =
                doctor.email || "";

            document.getElementById(
                "doctorLicense"
            ).value =
                doctor.licenseNumber || "";

            const existingLogin =
                typeof getDoctorLogin ===
                "function"
                    ? getDoctorLogin(doctor.id)
                    : null;

            if (existingLogin) {

                document.getElementById(
                    "doctorUsername"
                ).value =
                    existingLogin.username || "";

            }

            document.getElementById(
                "doctorSubmitBtn"
            ).textContent =
                "🔄 ለውጡን አስቀምጥ";

            document.getElementById(
                "cancelEditDoctorBtn"
            ).style.display =
                "block";

        }

    }


    const form =
        document.getElementById(
            "doctorForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const data = {

                firstName:
                    document.getElementById(
                        "doctorFirstName"
                    ).value.trim(),

                fatherName:
                    document.getElementById(
                        "doctorFatherName"
                    ).value.trim(),

                grandfatherName:
                    document.getElementById(
                        "doctorGrandfatherName"
                    ).value.trim(),

                gender:
                    document.getElementById(
                        "doctorGender"
                    ).value,

                specialization:
                    document.getElementById(
                        "doctorSpecialization"
                    ).value.trim(),

                phone:
                    document.getElementById(
                        "doctorPhone"
                    ).value.trim(),

                email:
                    document.getElementById(
                        "doctorEmail"
                    ).value.trim(),

                licenseNumber:
                    document.getElementById(
                        "doctorLicense"
                    ).value.trim()

            };

            const loginUsername =
                document.getElementById(
                    "doctorUsername"
                ).value.trim();

            const loginPassword =
                document.getElementById(
                    "doctorPassword"
                ).value.trim();


            if (
                !currentEditingDoctorId &&
                (!loginUsername || !loginPassword)
            ) {

                alert(
                    "አዲስ ዶክተር ሲመዘገብ Username እና Password ማስገባት ግዴታ ነው።"
                );

                return;

            }


            const doctor =
                currentEditingDoctorId
                    ? updateDoctor(
                        currentEditingDoctorId,
                        data
                    )
                    : createDoctor(data);


            if (doctor) {

                const fullName =
                    doctor.firstName +
                    " " +
                    doctor.fatherName;

                let loginResult;

                if (currentEditingDoctorId) {

                    loginResult =
                        typeof updateDoctorLogin ===
                        "function"
                            ? await updateDoctorLogin(
                                doctor.id,
                                loginUsername,
                                loginPassword,
                                fullName
                            )
                            : { success: true };

                } else {

                    loginResult =
                        typeof createDoctorLogin ===
                        "function"
                            ? await createDoctorLogin(
                                doctor.id,
                                loginUsername,
                                loginPassword,
                                fullName
                            )
                            : { success: true };

                }

                if (
                    loginResult &&
                    loginResult.success === false
                ) {

                    alert(
                        "⚠️ ዶክተሩ ተመዝግቧል ግን የመግቢያ መረጃ ማስቀመጥ አልተቻለም፦\n" +
                        loginResult.message
                    );

                }


                if (currentEditingDoctorId) {

                    alert(
                        "✅ የዶክተሩ መረጃ ተስተካክሏል።"
                    );

                    currentEditingDoctorId =
                        null;

                } else {

                    alert(

                        "✅ ዶክተሩ በትክክል ተመዝግቧል።\n\n" +

                        "🪪 የዶክተር ID: " +
                        doctor.id +

                        "\n🔑 Username: " +
                        loginUsername

                    );

                }


                displayDoctors();

            }

        }
    );


    renderDoctorList();

    renderAdminDoctorQueueOverview();

}


/* =====================================================
   🧑‍🤝‍🧑 ADMIN OVERVIEW: WHO IS WITH WHICH DOCTOR
===================================================== */

function renderAdminDoctorQueueOverview() {

    const box =
        document.getElementById(
            "adminDoctorQueueOverview"
        );

    if (!box) {
        return;
    }

    const assignedPatients =
        typeof getPatientsByStatus ===
        "function"
            ? getPatientsByStatus("ሀኪም")
            : [];

    if (assignedPatients.length === 0) {

        box.innerHTML = `
            <p>
                አሁን ከየትኛውም ዶክተር ጋር ያለ ታካሚ የለም።
            </p>
        `;

        return;

    }

    box.innerHTML =
        assignedPatients.map(
            function (patient) {

                const doctor =
                    getDoctorById(
                        patient.assignedDoctorId
                    );

                return `

                    <div class="patient-item">

                        <h3>
                            👤
                            ${escapeDoctorText(patient.firstName)}
                            ${escapeDoctorText(patient.fatherName)}
                        </h3>

                        <p>
                            <strong>ታካሚ ID:</strong>
                            ${escapeDoctorText(patient.id)}
                        </p>

                        <p>
                            <strong>🩺 ከዶክተር ጋር:</strong>
                            ${
                                doctor
                                    ? escapeDoctorText(doctor.firstName) + " " + escapeDoctorText(doctor.fatherName) + " (" + escapeDoctorText(doctor.id) + ")"
                                    : escapeDoctorText(patient.assignedDoctorId)
                            }
                        </p>

                    </div>

                `;

            }
        ).join("");

}


/* =====================================================
   📋 DISPLAY DOCTOR LIST (Admin management)
===================================================== */

function renderDoctorList() {

    const list =
        document.getElementById(
            "doctorList"
        );


    if (!list) {
        return;
    }


    const search =
        document.getElementById(
            "doctorSearch"
        );


    const keyword =
        search
            ? search.value
            : "";


    const results =
        searchDoctors(keyword);


    if (results.length === 0) {

        list.innerHTML = `
            <p>
                ምንም ዶክተር አልተገኘም።
            </p>
        `;

        return;

    }


    list.innerHTML =
        results.map(
            function (doctor) {

                const login =
                    typeof getDoctorLogin ===
                    "function"
                        ? getDoctorLogin(doctor.id)
                        : null;

                return `

                    <div class="patient-item">

                        <h3>
                            🩺
                            ${escapeDoctorText(
                                doctor.firstName
                            )}
                            ${escapeDoctorText(
                                doctor.fatherName
                            )}
                        </h3>


                        <p>
                            <strong>
                                🪪 Doctor ID:
                            </strong>

                            ${escapeDoctorText(
                                doctor.id
                            )}
                        </p>


                        <p>
                            <strong>
                                🩺 ስፔሻሊቲ:
                            </strong>

                            ${escapeDoctorText(
                                doctor.specialization
                            )}
                        </p>


                        <p>
                            <strong>
                                📞 ስልክ:
                            </strong>

                            ${
                                escapeDoctorText(
                                    doctor.phone || "-"
                                )
                            }
                        </p>


                        <p>
                            <strong>
                                🔑 Username:
                            </strong>

                            ${
                                escapeDoctorText(
                                    login ? login.username : "-"
                                )
                            }
                        </p>


                        <button
                            onclick="viewDoctor('${doctor.id}')"
                        >
                            👁️ መረጃ ክፈት
                        </button>

                        <button
                            onclick="editDoctor('${doctor.id}')"
                        >
                            ✏️ አርም
                        </button>

                        <button
                            onclick="handleDeleteDoctor('${doctor.id}')"
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
   ✏️ EDIT DOCTOR
===================================================== */

function editDoctor(doctorId) {

    const doctor =
        getDoctorById(doctorId);

    if (!doctor) {

        alert(
            "ዶክተሩ አልተገኘም።"
        );

        return;

    }

    currentEditingDoctorId =
        doctorId;

    displayDoctors();

    const form =
        document.getElementById(
            "doctorForm"
        );

    if (form) {

        form.scrollIntoView({
            behavior: "smooth"
        });

    }

}


/* =====================================================
   ❌ CANCEL EDIT DOCTOR
===================================================== */

function cancelEditDoctor() {

    currentEditingDoctorId =
        null;

    displayDoctors();

}


/* =====================================================
   🗑️ DELETE DOCTOR HANDLER
===================================================== */

function handleDeleteDoctor(doctorId) {

    const confirmDelete =
        confirm(
            "ይህን ዶክተር መረጃ (እና የመግቢያ አካውንቱን) ሙሉ በሙሉ መሰረዝ ይፈልጋሉ? ይህ ተግባር መመለስ አይቻልም።"
        );

    if (!confirmDelete) {

        return;

    }

    deleteDoctor(doctorId);

    if (
        currentEditingDoctorId ===
        doctorId
    ) {

        currentEditingDoctorId =
            null;

    }

    displayDoctors();

}


/* =====================================================
   🛡️ SAFE TEXT
===================================================== */

function escapeDoctorText(value) {

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
   👁️ VIEW DOCTOR
===================================================== */

function viewDoctor(doctorId) {

    const doctor =
        getDoctorById(doctorId);


    if (!doctor) {

        alert(
            "ዶክተሩ አልተገኘም።"
        );

        return;

    }


    alert(

        "🩺 የዶክተር መረጃ\n\n" +

        "Doctor ID: " +
        doctor.id +

        "\n\nስም: " +
        doctor.firstName +
        " " +
        doctor.fatherName +

        "\n\nስፔሻሊቲ: " +
        doctor.specialization +

        "\n\nስልክ: " +
        (
            doctor.phone || "-"
        ) +

        "\n\nEmail: " +
        (
            doctor.email || "-"
        ) +

        "\n\nየሙያ ፈቃድ: " +
        (
            doctor.licenseNumber || "-"
        )

    );

}


/* =====================================================
   📊 DOCTOR COUNT
===================================================== */

function updateDoctorCount() {

    const count =
        document.getElementById(
            "doctorCount"
        );


    if (count) {

        count.textContent =
            doctors.length;

    }

}


/* =====================================================
   🩺 DOCTOR'S OWN QUEUE (ራሱ ሀኪም ሲገባ የሚያየው ገጽ)
===================================================== */

function renderDoctorOwnQueue(doctorId) {

    const container =
        document.getElementById(
            "doctorsContent"
        );

    if (!container) {
        return;
    }

    const doctor =
        getDoctorById(doctorId);

    const myPatients =
        typeof getPatientsByStatus ===
        "function"
            ? getPatientsByStatus("ሀኪም").filter(
                function (patient) {

                    return (
                        patient.assignedDoctorId ===
                        doctorId
                    );

                }
            ).sort(
                function (a, b) {

                    /* 🚨 ኤመርጀንሲ ታካሚ ሁልጊዜ ከላይ ይታያል */

                    const aEmergency =
                        a.isEmergency ? 1 : 0;

                    const bEmergency =
                        b.isEmergency ? 1 : 0;

                    return (
                        bEmergency - aEmergency
                    );

                }
            )
            : [];

    let html = `

        <h2>
            👋 እንኳን ደህና መጡ,
            ${escapeDoctorText(
                doctor ? doctor.firstName : ""
            )}
        </h2>

        <button
            onclick="handleSendDepartmentRequest('ሀኪም ' + '${escapeDoctorText(doctor ? doctor.firstName : '')}')"
            style="background:#2f6fed;"
        >
            📨 ለAdmin መልእክት ላክ
        </button>

        <h3>
            🧑‍🤝‍🧑 የእርስዎ የታካሚ ወረፋ
        </h3>

    `;

    if (myPatients.length === 0) {

        html += `
            <p>
                አሁን የተጠባበቀ ታካሚ የለም።
            </p>
        `;

    }

    html +=
        myPatients.map(
            function (patient) {

                return `

                    <div class="patient-item" ${patient.isEmergency ? 'style="border:2px solid #c0392b;"' : ""}>

                        <h3>
                            ${patient.isEmergency ? "🚨 ኤመርጀንሲ - " : "👤 "}
                            ${escapeDoctorText(patient.firstName)}
                            ${escapeDoctorText(patient.fatherName)}
                        </h3>

                        ${
                            patient.isEmergency && patient.emergencyReason
                            ? `
                                <p style="color:#c0392b;">
                                    <strong>🚨 ምክንያት:</strong>
                                    ${escapeDoctorText(patient.emergencyReason)}
                                </p>
                            `
                            : ""
                        }

                        <p>
                            <strong>ID:</strong>
                            ${escapeDoctorText(patient.id)}
                        </p>

                        <p>
                            <strong>ዕድሜ/ፆታ:</strong>
                            ${escapeDoctorText(patient.age)} /
                            ${escapeDoctorText(patient.gender)}
                        </p>

                        <p>
                            <strong>ቀበሌ:</strong>
                            ${escapeDoctorText(patient.kebele || "-")}
                        </p>

                        <button
                            onclick="renderDoctorPatientCard('${doctorId}','${patient.id}')"
                        >
                            🩺 ክፈት
                        </button>

                        <button
                            onclick="handleCompleteVisit('${doctorId}','${patient.id}')"
                            style="background:#0b5d45;"
                        >
                            ✅ ህክምና ጨርስ
                        </button>

                        <button
                            onclick="handleRemoveFromDoctorQueue('${doctorId}','${patient.id}')"
                            style="background:#c0392b;"
                        >
                            🗑️ ከወረፋ አጥፋ
                        </button>

                    </div>

                `;

            }
        ).join("");

    html += `

        <hr>

        <h3>
            🧪 የደረሱ የላብ ውጤቶች
        </h3>

        <div id="doctorLabResultsBox"></div>

    `;

    container.innerHTML = html;

    renderDoctorReceivedResultsInline(doctorId);

}


/* =====================================================
   🩺 የታካሚ ካርድ (እውነተኛ ገጽ - popup/prompt አይደለም)
===================================================== */

function renderDoctorPatientCard(
    doctorId,
    patientId
) {

    const container =
        document.getElementById(
            "doctorsContent"
        );

    if (!container) {
        return;
    }

    const doctor =
        getDoctorById(doctorId);

    const patient =
        typeof getPatientById === "function"
            ? getPatientById(patientId)
            : null;

    if (!doctor || !patient) {

        alert(
            "መረጃ አልተገኘም።"
        );

        return;

    }

    const history =
        typeof getPatientHistory === "function"
            ? getPatientHistory(patientId)
            : [];

    const historyHtml =
        history.length === 0
            ? "<p>📭 ምንም የቀድሞ ታሪክ የለም (አዲስ ታካሚ)።</p>"
            : history.slice().reverse().map(
                function (item) {

                    return `

                        <div class="patient-item">

                            <p>
                                🕒 ${escapeDoctorText(item.date)}
                                —
                                🩺 ${escapeDoctorText(item.doctorName || item.doctorId || "-")}
                            </p>

                            <p>
                                ${escapeDoctorText(item.note || "-")}
                            </p>

                            ${
                                item.diagnosticResults
                                ? `<p style="white-space:pre-line;">📋 ${escapeDoctorText(item.diagnosticResults)}</p>`
                                : ""
                            }

                        </div>

                    `;

                }
            ).join("");

    container.innerHTML = `

        <button onclick="renderDoctorOwnQueue('${doctorId}')">
            ← ወደ ወረፋ ተመለስ
        </button>

        <h2>
            👤 ${escapeDoctorText(patient.firstName)} ${escapeDoctorText(patient.fatherName)}
        </h2>

        <p>
            <strong>ID:</strong> ${escapeDoctorText(patient.id)}
            &nbsp;|&nbsp;
            <strong>ፆታ/ዕድሜ:</strong> ${escapeDoctorText(patient.gender)} / ${escapeDoctorText(patient.age)}
            &nbsp;|&nbsp;
            <strong>ቀበሌ:</strong> ${escapeDoctorText(patient.kebele || "-")}
        </p>

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin:14px 0;">

            <button onclick="renderLabRadiologyOrderForm('${doctorId}','${patientId}')" style="background:#0b5d45;">
                🧪🩻 ላብ/ራጅ ትዕዛዝ ላክ
            </button>

            <button onclick="renderPrescriptionForm('${doctorId}','${patientId}')" style="background:#2f6fed;">
                💊 ማዘዣ ጻፍ
            </button>

        </div>

        <hr>

        <h3>📚 የቀድሞ ታሪክ</h3>

        ${historyHtml}

    `;

}


/* =====================================================
   🧪🩻 LAB / RADIOLOGY ORDER FORM (እውነተኛ ፎርም)
===================================================== */

function renderLabRadiologyOrderForm(
    doctorId,
    patientId
) {

    const container =
        document.getElementById(
            "doctorsContent"
        );

    if (!container) {
        return;
    }

    const patient =
        getPatientById(patientId);

    if (!patient) {
        return;
    }

    const labCatalog =
        typeof getFullLabCatalog === "function"
            ? getFullLabCatalog()
            : [];

    const labCategoriesHtml =
        labCatalog.map(
            function (group) {

                const testRows =
                    group.tests.map(
                        function (test, index) {

                            const checkboxId =
                                "labTest-" +
                                group.category.replace(/\s+/g, "") +
                                "-" +
                                index;

                            return `

                                <label style="display:flex; align-items:center; gap:8px; font-weight:normal; background:white; border:1px solid #e2e8f0; border-radius:6px; padding:6px 10px;">

                                    <input
                                        type="checkbox"
                                        class="lab-test-checkbox"
                                        value="${escapeDoctorText(test.name)}"
                                        id="${checkboxId}"
                                    >

                                    <span style="flex:1;">${escapeDoctorText(test.name)}</span>

                                    ${
                                        test.range
                                        ? `<span style="color:#52606d; font-size:12px;">${escapeDoctorText(test.range)}</span>`
                                        : ""
                                    }

                                </label>

                            `;

                        }
                    ).join("");

                return `

                    <div style="margin-bottom:14px;">

                        <h4 style="color:#0b5d45; margin-bottom:6px;">${escapeDoctorText(group.category)}</h4>

                        <div style="display:flex; flex-direction:column; gap:6px;">
                            ${testRows}
                        </div>

                    </div>

                `;

            }
        ).join("");

    const radiologyExamsList =
        typeof getFullRadiologyExamList === "function"
            ? getFullRadiologyExamList()
            : (
                typeof radiologyExams !== "undefined"
                    ? radiologyExams
                    : []
            );

    const radiologyCheckboxes =
        radiologyExamsList.map(
            function (exam, index) {

                return `

                    <label style="display:flex; align-items:center; gap:8px; font-weight:normal; background:white; border:1px solid #e2e8f0; border-radius:6px; padding:6px 10px;">

                        <input
                            type="checkbox"
                            class="radiology-exam-checkbox"
                            value="${escapeDoctorText(exam)}"
                            id="radExam-${index}"
                        >

                        <span>${escapeDoctorText(exam)}</span>

                    </label>

                `;

            }
        ).join("");

    container.innerHTML = `

        <button onclick="renderDoctorPatientCard('${doctorId}','${patientId}')">
            ← ተመለስ
        </button>

        <h2>
            🧪🩻 የላብራቶሪ/ራጅ ትዕዛዝ
        </h2>

        <p>
            <strong>ታካሚ:</strong>
            ${escapeDoctorText(patient.firstName)} ${escapeDoctorText(patient.fatherName)}
            (${escapeDoctorText(patient.id)})
        </p>

        <label>
            📝 Clinical Data / Diagnosis
        </label>

        <textarea id="dxNoteInput" class="clinic-form" style="width:100%; min-height:70px;"></textarea>

        <h3>🧪 የላብ ምርመራዎች</h3>

        <div style="max-height:420px; overflow-y:auto; border:1px solid #d9e2ec; border-radius:8px; padding:10px; background:#f8fafc;">
            ${labCategoriesHtml}
        </div>

        <div id="customLabTestsContainer" style="display:flex; flex-direction:column; gap:6px; margin-top:8px;"></div>

        <div style="display:flex; gap:8px; margin-top:10px;">

            <input
                type="text"
                id="customLabTestNameInput"
                placeholder="Add other test..."
                style="flex:1; min-height:42px; padding:8px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:15px;"
            >

            <button
                type="button"
                onclick="handleAddCustomLabTestInline()"
                style="background:#0b5d45; color:white; border:none; border-radius:8px; padding:0 16px; font-size:15px; cursor:pointer; white-space:nowrap;"
            >
                + Add Test
            </button>

        </div>

        <h3 style="margin-top:18px;">🩻 የራጅ/ኤክስሬይ ምርመራዎች</h3>

        <div style="display:flex; flex-direction:column; gap:6px; border:1px solid #d9e2ec; border-radius:8px; padding:10px; background:#f8fafc;">
            ${radiologyCheckboxes}
        </div>

        <div id="customRadiologyContainer" style="display:flex; flex-direction:column; gap:6px; margin-top:8px;"></div>

        <div style="display:flex; gap:8px; margin-top:10px;">

            <input
                type="text"
                id="customRadiologyNameInput"
                placeholder="Add other exam..."
                style="flex:1; min-height:42px; padding:8px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:15px;"
            >

            <button
                type="button"
                onclick="handleAddCustomRadiologyExamInline()"
                style="background:#0b5d45; color:white; border:none; border-radius:8px; padding:0 16px; font-size:15px; cursor:pointer; white-space:nowrap;"
            >
                + Add Exam
            </button>

        </div>

        <button
            onclick="handleSubmitDiagnosticOrder('${doctorId}','${patientId}')"
            style="margin-top:16px; background:#0b5d45; color:white; border:none; border-radius:8px; padding:13px 18px; font-size:16px; cursor:pointer; width:100%;"
        >
            ➡️ ወደ ካሸር ላክ
        </button>

    `;

}


function handleAddCustomRadiologyExamInline() {

    const input =
        document.getElementById(
            "customRadiologyNameInput"
        );

    const container =
        document.getElementById(
            "customRadiologyContainer"
        );

    if (!input || !container) {

        return;

    }

    const name =
        input.value.trim();

    if (!name) {

        alert(
            "የምርመራ ስም ያስገቡ።"
        );

        return;

    }

    const exists =
        Array.from(
            document.querySelectorAll(
                ".radiology-exam-checkbox"
            )
        ).some(
            function (box) {

                return (
                    box.value.toLowerCase() ===
                    name.toLowerCase()
                );

            }
        );

    if (exists) {

        alert(
            "ይህ ምርመራ ቀድሞ በዝርዝሩ ውስጥ አለ፤ ምልክት ያድርጉበት።"
        );

        return;

    }

    /* ለዚህ ትዕዛዝ ብቻ ይያያዛል (ምልክት ተደርጎበት ይታያል) */
    const label =
        document.createElement("label");

    label.style.cssText =
        "display:flex; align-items:center; gap:8px; font-weight:normal; background:#fff8e1; border:1px solid #f0c36d; border-radius:6px; padding:6px 10px;";

    const box =
        document.createElement("input");

    box.type =
        "checkbox";

    box.className =
        "radiology-exam-checkbox";

    box.value =
        name;

    box.checked =
        true;

    const text =
        document.createElement("span");

    text.style.flex =
        "1";

    text.textContent =
        name + " (ተጨማሪ)";

    label.appendChild(box);

    label.appendChild(text);

    container.appendChild(label);

    input.value =
        "";

}


function handleAddCustomLabTestInline() {

    const input =
        document.getElementById(
            "customLabTestNameInput"
        );

    const container =
        document.getElementById(
            "customLabTestsContainer"
        );

    if (!input || !container) {

        return;

    }

    const name =
        input.value.trim();

    if (!name) {

        alert(
            "የምርመራ ስም ያስገቡ።"
        );

        return;

    }

    const exists =
        Array.from(
            document.querySelectorAll(
                ".lab-test-checkbox"
            )
        ).some(
            function (box) {

                return (
                    box.value.toLowerCase() ===
                    name.toLowerCase()
                );

            }
        );

    if (exists) {

        alert(
            "ይህ ምርመራ ቀድሞ በዝርዝሩ ውስጥ አለ፤ ምልክት ያድርጉበት።"
        );

        return;

    }

    /* ለዚህ ትዕዛዝ ብቻ ይያያዛል (ምልክት ተደርጎበት ይታያል) */
    const label =
        document.createElement("label");

    label.style.cssText =
        "display:flex; align-items:center; gap:8px; font-weight:normal; background:#fff8e1; border:1px solid #f0c36d; border-radius:6px; padding:6px 10px;";

    const box =
        document.createElement("input");

    box.type =
        "checkbox";

    box.className =
        "lab-test-checkbox";

    box.value =
        name;

    box.checked =
        true;

    const text =
        document.createElement("span");

    text.style.flex =
        "1";

    text.textContent =
        name + " (ተጨማሪ)";

    label.appendChild(box);

    label.appendChild(text);

    container.appendChild(label);

    input.value =
        "";

}


function handleSubmitDiagnosticOrder(
    doctorId,
    patientId
) {

    const checkedLabBoxes =
        document.querySelectorAll(
            ".lab-test-checkbox:checked"
        );

    const checkedRadioBoxes =
        document.querySelectorAll(
            ".radiology-exam-checkbox:checked"
        );

    const selectedTests =
        Array.from(checkedLabBoxes).map(
            function (box) {

                return box.value;

            }
        );

    const selectedRadiologyExams =
        Array.from(checkedRadioBoxes).map(
            function (box) {

                return box.value;

            }
        );

    if (
        selectedTests.length === 0 &&
        selectedRadiologyExams.length === 0
    ) {

        alert(
            "ቢያንስ አንድ ምርመራ (ላብ ወይም ራጅ) ይምረጡ።"
        );

        return;

    }

    const noteBox =
        document.getElementById(
            "dxNoteInput"
        );

    const note =
        noteBox ? noteBox.value : "";

    const request =
        typeof createDiagnosticRequest === "function"
            ? createDiagnosticRequest({

                patientId: patientId,

                doctorId: doctorId,

                labTests: selectedTests,

                radiologyExams: selectedRadiologyExams,

                note: note

            })
            : null;

    if (request) {

        alert(
            "✅ ትዕዛዙ ወደ ካሸር ተልኳል (ክፍያ እስኪፈጸም ድረስ ወደ ላብ/ራጅ አይደርስም)።\n\nDX ID: " +
            request.id
        );

    }

    renderDoctorOwnQueue(doctorId);

}


/* =====================================================
   💊 PRESCRIPTION FORM (እውነተኛ RX ፎርም)
===================================================== */

let prescriptionDrugRowCount = 0;

function renderPrescriptionForm(
    doctorId,
    patientId
) {

    const container =
        document.getElementById(
            "doctorsContent"
        );

    if (!container) {
        return;
    }

    const doctor =
        getDoctorById(doctorId);

    const patient =
        getPatientById(patientId);

    if (!doctor || !patient) {
        return;
    }

    prescriptionDrugRowCount = 0;

    container.innerHTML = `

        <button onclick="renderDoctorPatientCard('${doctorId}','${patientId}')">
            ← ተመለስ
        </button>

        <h2>
            💊 የመድሃኒት ማዘዣ (RX)
        </h2>

        <div class="clinic-form" style="grid-template-columns: 1fr 1fr;">

            <p><strong>Patient's Name:</strong> ${escapeDoctorText(patient.firstName)} ${escapeDoctorText(patient.fatherName)}</p>
            <p><strong>Card No:</strong> ${escapeDoctorText(patient.id)}</p>
            <p><strong>Sex:</strong> ${escapeDoctorText(patient.gender)}</p>
            <p><strong>Age:</strong> ${escapeDoctorText(patient.age)}</p>

        </div>

        <label>Weight (ክብደት)</label>
        <input type="text" id="rxWeight" placeholder="ለምሳሌ 65 kg">

        <label>Diagnosis</label>
        <textarea id="rxDiagnosis" style="width:100%; min-height:60px;"></textarea>

        <h3 style="margin-top:16px;">RX</h3>

        <div id="rxDrugRows"></div>

        <button
            type="button"
            onclick="addPrescriptionDrugRow()"
            style="background:#0b5d45; margin:10px 0;"
        >
            መድሃኒት ጨምር
        </button>

        <hr>

        <h3>Prescriber's</h3>

        <p><strong>Full Name:</strong> ${escapeDoctorText(doctor.firstName)} ${escapeDoctorText(doctor.fatherName)}</p>

        <label>Qualification</label>
        <input type="text" id="rxQualification" placeholder="ለምሳሌ ${escapeDoctorText(doctor.specialization || "General Practitioner")}" value="${escapeDoctorText(doctor.specialization || "")}">

        <label>Registration No</label>
        <input type="text" id="rxRegistration" placeholder="የሙያ ፈቃድ ቁጥር" value="${escapeDoctorText(doctor.licenseNumber || "")}">

        <label>ተጨማሪ ማስታወሻ</label>
        <textarea id="rxNotes" style="width:100%; min-height:50px;"></textarea>

        <button
            onclick="handleSubmitPrescription('${doctorId}','${patientId}')"
            style="margin-top:16px; background:#2f6fed; color:white; border:none; border-radius:8px; padding:13px 18px; font-size:16px; cursor:pointer; width:100%;"
        >
            ✅ ማዘዣውን ላክ ወደ ፋርማሲ
        </button>

    `;

    addPrescriptionDrugRow();

}


function addPrescriptionDrugRow() {

    const rowsContainer =
        document.getElementById(
            "rxDrugRows"
        );

    if (!rowsContainer) {
        return;
    }

    prescriptionDrugRowCount++;

    const rowId =
        "rxRow" + prescriptionDrugRowCount;

    const rowDiv =
        document.createElement("div");

    rowDiv.id = rowId;

    rowDiv.style.border = "1px solid #d9e2ec";
    rowDiv.style.borderRadius = "8px";
    rowDiv.style.padding = "10px";
    rowDiv.style.marginBottom = "10px";
    rowDiv.style.background = "#f8fafc";

    rowDiv.innerHTML = `

        <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>💊 መድሃኒት ${prescriptionDrugRowCount}</strong>
            <button type="button" onclick="removePrescriptionDrugRow('${rowId}')" style="background:#c0392b; padding:4px 10px;">🗑️</button>
        </div>

        <label>Drug Name *</label>
        <input type="text" class="rx-drug-name" placeholder="ለምሳሌ Amoxicillin">

        <label>Strength</label>
        <input type="text" class="rx-drug-strength" placeholder="ለምሳሌ 500mg">

        <label>Dosage Form</label>
        <input type="text" class="rx-drug-form" placeholder="ለምሳሌ Tablet, Syrup, Injection">

        <label>Dose</label>
        <input type="text" class="rx-drug-dose" placeholder="ለምሳሌ 1 tablet">

        <label>Frequency</label>
        <input type="text" class="rx-drug-frequency" placeholder="ለምሳሌ 3 times/day (TID)">

        <label>Duration</label>
        <input type="text" class="rx-drug-duration" placeholder="ለምሳሌ 5 days">

        <label>Quantity</label>
        <input type="text" class="rx-drug-quantity" placeholder="ለምሳሌ 15 tablets">

        <label>How to use / Other info</label>
        <input type="text" class="rx-drug-instructions" placeholder="ለምሳሌ ከምግብ በኋላ ይወሰድ">

    `;

    rowsContainer.appendChild(rowDiv);

}


function removePrescriptionDrugRow(rowId) {

    const row =
        document.getElementById(rowId);

    if (row) {

        row.remove();

    }

}


function handleSubmitPrescription(
    doctorId,
    patientId
) {

    const doctor =
        getDoctorById(doctorId);

    const patient =
        getPatientById(patientId);

    if (!doctor || !patient) {
        return;
    }

    const rowsContainer =
        document.getElementById(
            "rxDrugRows"
        );

    const rows =
        rowsContainer
            ? Array.from(rowsContainer.children)
            : [];

    const medicines = [];

    for (let i = 0; i < rows.length; i++) {

        const row = rows[i];

        const nameInput =
            row.querySelector(".rx-drug-name");

        const name =
            nameInput ? nameInput.value.trim() : "";

        if (!name) {

            continue;

        }

        medicines.push({

            id: "RXITEM-" + Date.now() + "-" + i,

            name: name,

            strength:
                row.querySelector(".rx-drug-strength").value.trim(),

            form:
                row.querySelector(".rx-drug-form").value.trim(),

            dose:
                row.querySelector(".rx-drug-dose").value.trim(),

            frequency:
                row.querySelector(".rx-drug-frequency").value.trim(),

            duration:
                row.querySelector(".rx-drug-duration").value.trim(),

            quantity:
                row.querySelector(".rx-drug-quantity").value.trim(),

            instructions:
                row.querySelector(".rx-drug-instructions").value.trim()

        });

    }

    if (medicines.length === 0) {

        alert(
            "ቢያንስ አንድ መድሃኒት (ስም ያለው) ያስገቡ።"
        );

        return;

    }

    const weight =
        document.getElementById("rxWeight").value.trim();

    const diagnosis =
        document.getElementById("rxDiagnosis").value.trim();

    const qualification =
        document.getElementById("rxQualification").value.trim();

    const registration =
        document.getElementById("rxRegistration").value.trim();

    const notes =
        document.getElementById("rxNotes").value.trim();

    const prescription =
        typeof createPrescription === "function"
            ? createPrescription({

                patientId: patient.id,

                patientName:
                    patient.firstName + " " + patient.fatherName,

                doctorId: doctor.id,

                doctorName:
                    doctor.firstName + " " + doctor.fatherName,

                medicines: medicines,

                notes: notes,

                diagnosis: diagnosis,

                weight: weight,

                prescriberQualification: qualification,

                prescriberRegistration: registration

            })
            : null;

    if (prescription) {

        alert(

            "✅ ማዘዣው ወደ ፋርማሲ ተልኳል።\n\nRX ID: " +
            prescription.id

        );

    }

    renderDoctorPatientCard(doctorId, patientId);

}


/* =====================================================
   🩺 OPEN MEDICAL CARD (legacy - prompt based, kept for
   the admin ID-lookup path only)
===================================================== */

function openDoctorMedicalCardById(
    doctorId,
    patientId
) {

    const doctor =
        getDoctorById(doctorId);

    const patient =
        typeof getPatientById ===
        "function"
            ? getPatientById(patientId)
            : null;

    if (!doctor || !patient) {

        alert(
            "መረጃ አልተገኘም።"
        );

        return;

    }

    openDoctorMedicalCard(
        doctor,
        patient
    );

    /* ==========================================
       🔄 ወረፋውን አድስ - ወደ ላብ/ራጅ የተላከ ታካሚ ካለ
       ወዲያውኑ ከዝርዝሩ ይጥፋ (ያለ logout/ገጽ ዳግም ክፈት)
    ========================================== */

    if (
        typeof renderDoctorOwnQueue === "function"
    ) {

        renderDoctorOwnQueue(doctorId);

    }

}


/* =====================================================
   ✅ COMPLETE VISIT (ከወረፋ አጥፋ - ወደ ካርድ ብቻ ይመለሳል)
===================================================== */

function handleCompleteVisit(
    doctorId,
    patientId
) {

    const old =
        document.getElementById(
            "completeVisitOverlay"
        );

    if (old) {

        old.remove();

    }

    const overlay =
        document.createElement("div");

    overlay.id =
        "completeVisitOverlay";

    overlay.style.cssText =
        "position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:10000; display:flex; align-items:flex-start; justify-content:center; overflow:auto; padding:14px;";

    const panel =
        document.createElement("div");

    panel.style.cssText =
        "background:#fff; border-radius:12px; padding:16px; width:100%; max-width:560px; box-sizing:border-box;";

    panel.innerHTML = `

        <h3 style="margin-top:0;">
            🦠 ህክምና ጨርስ — በሽታ (Diagnosis) ይምረጡ
        </h3>

        <input
            type="text"
            id="cvSearchInput"
            placeholder="🔎 በሽታ ፈልግ..."
            style="width:100%; box-sizing:border-box; margin-bottom:8px;"
        >

        <div
            id="cvDiseaseList"
            style="max-height:38vh; overflow:auto; border:1px solid #d9e2ec; border-radius:8px; padding:6px; display:flex; flex-direction:column; gap:4px;"
        ></div>

        <div style="display:flex; gap:6px; margin-top:8px;">

            <input
                type="text"
                id="cvCustomInput"
                placeholder="ሌላ በሽታ ስም..."
                style="flex:1;"
            >

            <button type="button" id="cvCustomAdd">
                + ሌላ በሽታ ጨምር
            </button>

        </div>

        <div
            id="cvCustomList"
            style="display:flex; flex-direction:column; gap:4px; margin-top:6px;"
        ></div>

        <label style="display:block; margin-top:10px;">
            📝 የህክምና / ማጠቃለያ ማስታወሻ (አማራጭ)
        </label>

        <textarea
            id="cvNoteInput"
            style="width:100%; box-sizing:border-box; min-height:70px;"
        ></textarea>

        <div style="display:flex; gap:8px; margin-top:12px;">

            <button
                type="button"
                id="cvSubmit"
                style="flex:1; background:#0b5d45; color:#fff; border:none; border-radius:8px; padding:12px;"
            >
                ✅ አጠናቅ
            </button>

            <button
                type="button"
                id="cvCancel"
                style="padding:12px;"
            >
                ሰርዝ
            </button>

        </div>

    `;

    overlay.appendChild(panel);

    document.body.appendChild(overlay);

    const listBox =
        panel.querySelector("#cvDiseaseList");

    const diseases =
        typeof COMMON_DISEASES !== "undefined"
            ? COMMON_DISEASES
            : [];

    diseases.forEach(
        function (name) {

            const label =
                document.createElement("label");

            label.style.cssText =
                "display:flex; align-items:center; gap:8px; font-weight:normal;";

            label.dataset.name =
                name.toLowerCase();

            const box =
                document.createElement("input");

            box.type =
                "checkbox";

            box.className =
                "cv-disease";

            box.value =
                name;

            const text =
                document.createElement("span");

            text.textContent =
                name;

            label.appendChild(box);

            label.appendChild(text);

            listBox.appendChild(label);

        }
    );

    panel
        .querySelector("#cvSearchInput")
        .addEventListener(
            "input",
            function (event) {

                const term =
                    event.target.value
                        .trim()
                        .toLowerCase();

                listBox
                    .querySelectorAll("label")
                    .forEach(
                        function (label) {

                            label.style.display =
                                !term ||
                                label.dataset.name.indexOf(term) !== -1
                                    ? "flex"
                                    : "none";

                        }
                    );

            }
        );

    panel
        .querySelector("#cvCustomAdd")
        .addEventListener(
            "click",
            function () {

                const input =
                    panel.querySelector("#cvCustomInput");

                const name =
                    input.value.trim();

                if (!name) {

                    alert(
                        "የበሽታውን ስም ያስገቡ።"
                    );

                    return;

                }

                const exists =
                    Array.from(
                        panel.querySelectorAll(".cv-disease")
                    ).some(
                        function (box) {

                            return (
                                box.value.toLowerCase() ===
                                name.toLowerCase()
                            );

                        }
                    );

                if (exists) {

                    alert(
                        "ይህ በሽታ ቀድሞ በዝርዝሩ ውስጥ አለ፤ ምልክት ያድርጉበት።"
                    );

                    return;

                }

                const label =
                    document.createElement("label");

                label.style.cssText =
                    "display:flex; align-items:center; gap:8px; font-weight:normal; background:#fff8e1; border:1px solid #f0c36d; border-radius:6px; padding:6px 10px;";

                const box =
                    document.createElement("input");

                box.type =
                    "checkbox";

                box.className =
                    "cv-disease";

                box.value =
                    name;

                box.checked =
                    true;

                const text =
                    document.createElement("span");

                text.textContent =
                    name + " (ተጨማሪ)";

                label.appendChild(box);

                label.appendChild(text);

                panel
                    .querySelector("#cvCustomList")
                    .appendChild(label);

                input.value =
                    "";

            }
        );

    panel
        .querySelector("#cvCancel")
        .addEventListener(
            "click",
            function () {

                overlay.remove();

            }
        );

    panel
        .querySelector("#cvSubmit")
        .addEventListener(
            "click",
            function () {

                const diagnoses =
                    Array.from(
                        panel.querySelectorAll(".cv-disease")
                    )
                    .filter(
                        function (box) {

                            return box.checked;

                        }
                    )
                    .map(
                        function (box) {

                            return box.value;

                        }
                    );

                if (
                    diagnoses.length === 0 &&
                    !confirm(
                        "ምንም በሽታ አልተመረጠም። ያለ በሽታ ምዝገባ ይጠናቀቅ? (በዕለታዊ የበሽታ ሪፖርት አይቆጠርም)"
                    )
                ) {

                    return;

                }

                const note =
                    panel
                        .querySelector("#cvNoteInput")
                        .value
                        .trim();

                overlay.remove();

                finishDoctorVisit(
                    doctorId,
                    patientId,
                    diagnoses,
                    note
                );

            }
        );

}


function finishDoctorVisit(
    doctorId,
    patientId,
    diagnoses,
    note
) {

    const doctor =
        getDoctorById(doctorId);

    const diagnosticSummary =
        typeof getTodaysDiagnosticSummaryText === "function"
            ? getTodaysDiagnosticSummaryText(patientId, doctorId)
            : "";

    /* ሁልጊዜ ይመዘገባል (ጉብኝቱ በዕለታዊ ሪፖርት እንዲቆጠር) */
    if (typeof addPatientHistory === "function") {

        addPatientHistory(
            patientId,
            {
                doctorId:
                    doctorId,
                doctorName:
                    doctor
                        ? doctor.firstName +
                          " " +
                          doctor.fatherName
                        : "",
                note:
                    note,
                diagnoses:
                    diagnoses,
                diagnosis:
                    diagnoses.join(", "),
                diagnosticResults:
                    diagnosticSummary
            }
        );

    }

    completePatientVisit(patientId);

    alert(
        "✅ ህክምናው ተጠናቋል። ታካሚው ወደ ካርድ ክፍል ብቻ ተመልሷል።"
    );

    renderDoctorOwnQueue(doctorId);

}


/* =====================================================
   🗑️ REMOVE FROM DOCTOR QUEUE (→ ቆሻሻ ማጠራቀሚያ)
===================================================== */

function handleRemoveFromDoctorQueue(
    doctorId,
    patientId
) {

    const confirmRemove =
        confirm(
            "ይህን ታካሚ ከወረፋዎ ማጥፋት ይፈልጋሉ? (ወደ ቆሻሻ ማጠራቀሚያ ይገባል፣ Admin መልሶ ማምጣት ይችላል)"
        );

    if (!confirmRemove) {

        return;

    }

    const patient =
        typeof getPatientById ===
        "function"
            ? getPatientById(patientId)
            : null;

    if (
        patient &&
        typeof addToRecycleBin ===
        "function"
    ) {

        addToRecycleBin(
            "DOCTOR_QUEUE",
            {

                patientId:
                    patientId,

                assignedDoctorId:
                    doctorId

            },
            patient.firstName +
            " " +
            patient.fatherName
        );

    }

    completePatientVisit(patientId);

    renderDoctorOwnQueue(doctorId);

}


/* =====================================================
   🧪 VIEW LAB RESULTS RECEIVED BY DOCTOR (INLINE)
===================================================== */

function renderDoctorReceivedResultsInline(doctorId) {

    const box =
        document.getElementById(
            "doctorLabResultsBox"
        );

    if (!box) {
        return;
    }

    const requests =
        typeof getDiagnosticRequestsForDoctor === "function"
            ? getDiagnosticRequestsForDoctor(doctorId)
            : [];

    if (requests.length === 0) {

        box.innerHTML = `
            <p>
                📭 አዲስ የደረሰ ውጤት የለም።
            </p>
        `;

        return;

    }

    box.innerHTML =
        requests.map(
            function (request) {

                const patient =
                    typeof getPatientById === "function"
                        ? getPatientById(request.patientId)
                        : null;

                const patientLabel =
                    escapeDoctorText(
                        patient
                            ? patient.firstName + " " + patient.fatherName
                            : request.patientId
                    );

                const labOrder =
                    request.labOrderId && typeof getLabOrderById === "function"
                        ? getLabOrderById(request.labOrderId)
                        : null;

                const radOrder =
                    request.radiologyOrderId && typeof getRadiologyOrderById === "function"
                        ? getRadiologyOrderById(request.radiologyOrderId)
                        : null;

                const labDone =
                    !request.labOrderId ||
                    (
                        labOrder &&
                        (
                            labOrder.status === "ውጤት ወደ ዶክተር ተልኳል" ||
                            labOrder.status === "ውጤት ታይቷል"
                        )
                    );

                const radDone =
                    !request.radiologyOrderId ||
                    (
                        radOrder &&
                        (
                            radOrder.status === "ውጤት ወደ ዶክተር ተልኳል" ||
                            radOrder.status === "ውጤት ታይቷል"
                        )
                    );

                /* ==========================================
                   📋 የደረሱ ውጤቶች (ካሉ) - ሁልጊዜ ይታያሉ
                ========================================== */

                const labResultLines =
                    labOrder
                        ? Object.keys(labOrder.results || {}).map(
                            function (test) {

                                return (
                                    "🧪 " +
                                    escapeDoctorText(test) +
                                    ": " +
                                    escapeDoctorText(labOrder.results[test])
                                        .replace(/\n/g, "<br>")
                                );

                            }
                        ).join("<br>")
                        : "";

                const radResultLines =
                    radOrder
                        ? Object.keys(radOrder.results || {}).map(
                            function (exam) {

                                return (
                                    "🩻 " +
                                    escapeDoctorText(exam) +
                                    ": " +
                                    escapeDoctorText(radOrder.results[exam])
                                        .replace(/\n/g, "<br>")
                                );

                            }
                        ).join("<br>")
                        : "";

                /* ==========================================
                   ⏳ አንዱ ደርሶ አንዱ ገና ካልደረሰ - የደረሰውን
                   ውጤት እያሳየ፣ ስለሚቀረው ብቻ ያሳውቃል
                ========================================== */

                if (!labDone || !radDone) {

                    const arrivedLines =
                        !labDone
                            ? radResultLines
                            : labResultLines;

                    const pendingLabel =
                        !labDone
                            ? "🧪 የላብ ውጤት"
                            : "🩻 የራጅ ውጤት";

                    return `

                        <div class="patient-item">

                            <h3>⏳ ${escapeDoctorText(request.id)}</h3>

                            <p>
                                <strong>ታካሚ:</strong>
                                ${patientLabel}
                            </p>

                            ${
                                arrivedLines
                                ? `<p>${arrivedLines}</p>`
                                : ""
                            }

                            <p style="color:#c0392b;">
                                ⏳ ${pendingLabel} እየተጠበቀ ነው...
                            </p>

                        </div>

                    `;

                }

                /* ==========================================
                   ✅ ሁለቱም (ወይም የታዘዘው) ደርሷል - ተጣምረው ይታያሉ
                ========================================== */

                return `

                    <div class="patient-item">

                        <h3>✅ ${escapeDoctorText(request.id)}</h3>

                        <p>
                            <strong>ታካሚ:</strong>
                            ${patientLabel}
                        </p>

                        <p>
                            ${labResultLines}
                            ${
                                labResultLines && radResultLines
                                ? "<br>"
                                : ""
                            }
                            ${radResultLines}
                        </p>

                        <button
                            onclick="handleAcknowledgeDiagnosticResult('${request.id}','${doctorId}')"
                        >
                            ✅ እንደታየ ምልክት አድርግ
                        </button>

                    </div>

                `;

            }
        ).join("");

}


function handleAcknowledgeDiagnosticResult(
    requestId,
    doctorId
) {

    if (
        typeof acknowledgeDiagnosticResult === "function"
    ) {

        acknowledgeDiagnosticResult(requestId);

    }

    renderDoctorReceivedResultsInline(doctorId);

}


/* =====================================================
   🧪 DEFAULT LAB TESTS
===================================================== */

function getDefaultLabTests() {

    return [

        "CBC",

        "የደም ስኳር",

        "Malaria",

        "የሽንት ምርመራ",

        "HIV",

        "HBsAg",

        "HCV",

        "የሰገራ ምርመራ",

        "Creatinine",

        "Liver Function Test",

        "Lipid Profile",

        "Blood Group",

        "Pregnancy Test"

    ];

}


/* =====================================================
   💾 CUSTOM LAB TESTS
===================================================== */

function getCustomLabTests() {

    return (
        JSON.parse(
            localStorage.getItem(
                "clinicCustomLabTests"
            )
        ) || []
    );

}


function saveCustomLabTests(tests) {

    localStorage.setItem(
        "clinicCustomLabTests",
        JSON.stringify(tests)
    );

}


/* =====================================================
   🧪 ALL LAB TESTS
===================================================== */

function getAllLabTests() {

    return [

        ...getDefaultLabTests(),

        ...getCustomLabTests()

    ];

}


/* =====================================================
   ADD CUSTOM LAB TEST
===================================================== */

function addCustomLabTest() {

    const name =
        prompt(
            "የአዲሱን የላብ ምርመራ ስም ያስገቡ:"
        );


    if (name === null) {
        return null;
    }


    const cleanName =
        name.trim();


    if (!cleanName) {

        alert(
            "የምርመራ ስም ያስገቡ።"
        );

        return null;

    }


    const allTests =
        getAllLabTests();


    const exists =
        allTests.some(
            function (test) {

                return (
                    test.toLowerCase() ===
                    cleanName.toLowerCase()
                );

            }
        );


    if (exists) {

        alert(
            "ይህ ምርመራ ቀድሞ አለ።"
        );

        return null;

    }


    const custom =
        getCustomLabTests();


    custom.push(
        cleanName
    );


    saveCustomLabTests(
        custom
    );


    alert(
        "✅ አዲሱ ምርመራ ተጨምሯል።"
    );


    return cleanName;

}


/* =====================================================
   🧪 OPEN LAB ORDER
===================================================== */

function openLabOrderForm(
    doctor,
    patient
) {

    let selectedTests = [];


    while (true) {

        const tests =
            getAllLabTests();


        let message =
            "🧪 የላብ ምርመራ ይምረጡ (ካስፈለገ - ምንም ካላስፈለገ ባዶ OK ይጫኑ)\n\n";


        tests.forEach(
            function (test, index) {

                message +=
                    (index + 1) +
                    ". ☐ " +
                    test +
                    "\n";

            }
        );


        message +=
            "\n99. አዲስ ምርመራ ጨምር";


        message +=
            "\n\nለምሳሌ: 1,3,5";


        const answer =
            prompt(message);


        if (answer === null) {
            return;
        }


        if (
            answer.trim() === "99"
        ) {

            addCustomLabTest();

            continue;

        }


        if (
            answer.trim() === ""
        ) {

            selectedTests = [];

            break;

        }


        const numbers =
            answer
                .split(",")
                .map(
                    function (item) {

                        return parseInt(
                            item.trim(),
                            10
                        );

                    }
                )
                .filter(
                    function (number) {

                        return (
                            !isNaN(number) &&
                            number >= 1 &&
                            number <= tests.length
                        );

                    }
                );


        const uniqueNumbers =
            [...new Set(numbers)];


        selectedTests =
            uniqueNumbers.map(
                function (number) {

                    return tests[
                        number - 1
                    ];

                }
            );


        break;

    }


    let selectedRadiologyExams = [];

    const needsRadiology =
        confirm(
            "🩻 ለዚህ ታካሚ የራጅ/ኤክስሬይ ምርመራ ያስፈልጋል?"
        );

    if (needsRadiology) {

        while (true) {

            const exams =
                typeof radiologyExams !== "undefined"
                    ? radiologyExams
                    : [];

            let message =
                "🩻 የራጅ/ኤክስሬይ ምርመራ ይምረጡ\n\n";

            exams.forEach(
                function (exam, index) {

                    message +=
                        (index + 1) +
                        ". ☐ " +
                        exam +
                        "\n";

                }
            );

            message +=
                "\n\nለምሳሌ: 1,2";

            const answer =
                prompt(message);

            if (answer === null) {

                selectedRadiologyExams = [];

                break;

            }

            const numbers =
                answer
                    .split(",")
                    .map(
                        function (item) {

                            return parseInt(item.trim(), 10);

                        }
                    )
                    .filter(
                        function (number) {

                            return (
                                !isNaN(number) &&
                                number >= 1 &&
                                number <= exams.length
                            );

                        }
                    );

            const uniqueNumbers =
                [...new Set(numbers)];

            selectedRadiologyExams =
                uniqueNumbers.map(
                    function (number) {

                        return exams[number - 1];

                    }
                );

            if (selectedRadiologyExams.length === 0) {

                alert(
                    "ቢያንስ አንድ ምርመራ ይምረጡ ወይም Cancel ይጫኑ።"
                );

                continue;

            }

            break;

        }

    }


    if (
        selectedTests.length === 0 &&
        selectedRadiologyExams.length === 0
    ) {

        return;

    }


    const noteInput =
        prompt(
            "📝 ለላብ/ራጅ ተጨማሪ ማስታወሻ (ከሌለ ባዶ ይተውት):"
        );


    const note =
        noteInput === null
            ? ""
            : noteInput;


    if (
        typeof createDiagnosticRequest !==
        "function"
    ) {

        alert(
            "❌ የላብ/ራጅ ማስተባበሪያ ሲስተሙ አልተገናኘም።"
        );

        return;

    }


    const request =
        createDiagnosticRequest({

            patientId:
                patient.id,

            doctorId:
                doctor.id,

            labTests:
                selectedTests,

            radiologyExams:
                selectedRadiologyExams,

            note:
                note.trim()

        });


    if (request) {

        let summary =
            "✅ ትዕዛዙ ወደ ካሸር ተልኳል (ክፍያ እስኪፈጸም ድረስ ወደ ላብ/ራጅ አይደርስም)።\n\n" +
            "DX ID: " + request.id;

        if (selectedTests.length > 0) {

            summary +=
                "\n\n🧪 የላብ ምርመራ:\n" +
                selectedTests.join("\n");

        }

        if (selectedRadiologyExams.length > 0) {

            summary +=
                "\n\n🩻 የራጅ ምርመራ:\n" +
                selectedRadiologyExams.join("\n");

        }

        alert(summary);

    }

}


/* =====================================================
   👤 OPEN PATIENT (ADMIN/legacy - by ID prompt)
===================================================== */

function openDoctorPatient(doctorId) {

    const doctor =
        getDoctorById(
            doctorId
        );


    if (!doctor) {

        alert(
            "ዶክተሩ አልተገኘም።"
        );

        return;

    }


    if (
        typeof getAllPatients !==
        "function"
    ) {

        alert(
            "የታካሚ ሲስተሙ አልተገናኘም።"
        );

        return;

    }


    const patients =
        getAllPatients();


    if (
        !patients ||
        patients.length === 0
    ) {

        alert(
            "እስካሁን ታካሚ አልተመዘገበም።"
        );

        return;

    }


    let message =
        "👤 የታካሚ ID ያስገቡ:\n\n";


    patients.forEach(
        function (patient) {

            message +=

                patient.id +
                " - " +
                patient.firstName +
                " " +
                patient.fatherName +
                "\n";

        }
    );


    const patientId =
        prompt(message);


    if (!patientId) {
        return;
    }


    const patient =
        typeof getPatientById ===
        "function"
            ? getPatientById(
                patientId.trim()
            )
            : null;


    if (!patient) {

        alert(
            "ታካሚው አልተገኘም።"
        );

        return;

    }


    openDoctorMedicalCard(
        doctor,
        patient
    );

}


/* =====================================================
   🩺 DOCTOR MEDICAL CARD
===================================================== */

function openDoctorMedicalCard(
    doctor,
    patient
) {

    let message =

        "🩺 የታካሚ መረጃ\n\n" +

        "ታካሚ ID: " +
        patient.id +

        "\nስም: " +
        patient.firstName +
        " " +
        patient.fatherName +

        "\nዕድሜ: " +
        patient.age +

        "\nፆታ: " +
        patient.gender +

        "\nቀበሌ: " +
        (patient.kebele || "-");


    if (
        typeof getPatientHistory ===
        "function"
    ) {

        const history =
            getPatientHistory(
                patient.id
            );


        if (
            history &&
            history.length > 0
        ) {

            message +=
                "\n\n📚 የቀድሞ History:\n";


            history.forEach(
                function (item) {

                    message +=

                        "\n• " +
                        (
                            item.date ||
                            "-"
                        ) +

                        " | Doctor: " +
                        (
                            item.doctorId ||
                            "-"
                        ) +

                        "\n" +

                        (
                            item.note ||
                            ""
                        );

                }
            );

        }

    }


    alert(message);


    const action =
        confirm(
            "🧪 ለዚህ ታካሚ የላብ ምርመራ ለመላክ OK ይጫኑ።"
        );


    if (action) {

        openLabOrderForm(
            doctor,
            patient
        );

    }


    const prescriptionAction =
        confirm(
            "💊 ለዚህ ታካሚ የመድሃኒት ማዘዣ ወደ ፋርማሲ ለመላክ OK ይጫኑ።"
        );


    if (prescriptionAction) {

        openPrescriptionOrderForm(
            doctor,
            patient
        );

    }

}


/* =====================================================
   💊 OPEN PRESCRIPTION ORDER (sent to pharmacy.js)
===================================================== */

function openPrescriptionOrderForm(
    doctor,
    patient
) {

    if (
        typeof getAllMedicines !==
        "function"
    ) {

        alert(
            "❌ የፋርማሲ ሲስተሙ አልተገናኘም።"
        );

        return;

    }


    let selectedMedicines = [];


    while (true) {

        const medicines =
            getAllMedicines();


        let message =
            "💊 መድሃኒት ይምረጡ\n\n";


        medicines.forEach(
            function (medicine, index) {

                message +=
                    (index + 1) +
                    ". ☐ " +
                    medicine.name +
                    " (" +
                    medicine.form +
                    ")\n";

            }
        );


        message +=
            "\n99. አዲስ መድሃኒት ጨምር";


        message +=
            "\n\nለምሳሌ: 1,3,5";


        const answer =
            prompt(message);


        if (answer === null) {
            return;
        }


        if (
            answer.trim() === "99"
        ) {

            const newName =
                prompt(
                    "የአዲሱን መድሃኒት ስም ያስገቡ:"
                );

            if (newName === null) {
                continue;
            }

            const newForm =
                prompt(
                    "💊 ፎርም (ለምሳሌ Tablet, Syrup, Injection):"
                ) || "";

            addCustomMedicine(
                newName,
                newForm
            );

            continue;

        }


        const numbers =
            answer
                .split(",")
                .map(
                    function (item) {

                        return parseInt(
                            item.trim(),
                            10
                        );

                    }
                )
                .filter(
                    function (number) {

                        return (
                            !isNaN(number) &&
                            number >= 1 &&
                            number <= medicines.length
                        );

                    }
                );


        const uniqueNumbers =
            [...new Set(numbers)];


        selectedMedicines =
            uniqueNumbers.map(
                function (number) {

                    return medicines[
                        number - 1
                    ];

                }
            );


        if (
            selectedMedicines.length === 0
        ) {

            alert(
                "ቢያንስ አንድ መድሃኒት ይምረጡ።"
            );

            continue;

        }


        break;

    }


    const noteInput =
        prompt(
            "📝 ለፋርማሲ ተጨማሪ ማስታወሻ (ለምሳሌ መጠን፣ የቀናት ብዛት - ከሌለ ባዶ ይተውት):"
        );


    const note =
        noteInput === null
            ? ""
            : noteInput;


    if (
        typeof createPrescription !==
        "function"
    ) {

        alert(
            "❌ የፋርማሲ ሲስተሙ አልተገናኘም።"
        );

        return;

    }


    const prescription =
        createPrescription({

            patientId:
                patient.id,

            patientName:
                patient.firstName +
                " " +
                patient.fatherName,

            doctorId:
                doctor.id,

            doctorName:
                doctor.firstName +
                " " +
                doctor.fatherName,

            medicines:
                selectedMedicines,

            notes:
                note.trim()

        });


    if (prescription) {

        alert(

            "✅ የመድሃኒት ማዘዣ ወደ ፋርማሲ ተልኳል።\n\n" +

            "Prescription ID: " +
            prescription.id +

            "\n\nመድሃኒቶች:\n" +

            selectedMedicines
                .map(
                    function (medicine) {

                        return medicine.name;

                    }
                )
                .join("\n")

        );

    }

}


/* =====================================================
   🧪 VIEW LAB RESULTS RECEIVED BY DOCTOR (legacy alert)
===================================================== */

function viewDoctorLabResults(
    doctorId
) {

    const doctor =
        getDoctorById(doctorId);


    if (!doctor) {

        alert(
            "ዶክተሩ አልተገኘም።"
        );

        return;

    }


    if (
        typeof getDoctorReceivedResults !==
        "function"
    ) {

        alert(
            "❌ የላቦራቶሪ ሲስተሙ አልተገናኘም።"
        );

        return;

    }


    const orders =
        getDoctorReceivedResults(
            doctorId
        );


    if (orders.length === 0) {

        alert(
            "📭 አዲስ የደረሰ የላብ ውጤት የለም።"
        );

        return;

    }


    let message =
        "🧪 የደረሱ የላብ ውጤቶች\n";


    orders.forEach(
        function (order) {

            const patient =
                typeof getPatientById ===
                "function"
                    ? getPatientById(order.patientId)
                    : null;


            message +=

                "\n──────────\n" +

                "Lab ID: " +
                order.id +

                "\nታካሚ: " +
                (
                    patient
                        ? patient.firstName +
                          " " +
                          patient.fatherName
                        : order.patientId
                ) +

                "\n\nውጤቶች:\n";


            Object.keys(
                order.results || {}
            ).forEach(
                function (test) {

                    message +=

                        "• " +
                        test +
                        ": " +
                        order.results[test] +
                        "\n";

                }
            );

        }
    );


    alert(message);


    const markSeen =
        confirm(
            "እነዚህ ውጤቶች እንደታዩ ምልክት ላድርግ?"
        );


    if (markSeen) {

        orders.forEach(
            function (order) {

                markLabResultViewed(
                    order.id
                );

            }
        );


        alert(
            "✅ ተመዝግቧል።"
        );

    }

}


/* =====================================================
   🚀 START
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateDoctorCount();

    }
);