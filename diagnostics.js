
/* ==========================================
   🧾 DIAGNOSTIC REQUESTS (ሀኪም → ካሸር → ላብ/ራጅ)
   ------------------------------------------
   ሀኪም የላብ ወይም የራጅ ምርመራ ሲያዝ በቀጥታ ወደ ላብ/ራጅ
   አይላክም። መጀመሪያ ካሸር ጋር ይቆማል፣ ካሸር ክፍያውን
   ከተቀበለ በኋላ ብቻ ወደ ላብራቶሪ እና/ወይም ራጅ ይላካል።
========================================== */

const DIAGNOSTIC_STORAGE = "clinic_diagnostic_requests";


let diagnosticRequestsCache =
    JSON.parse(
        localStorage.getItem(DIAGNOSTIC_STORAGE)
    ) || [];


function getDiagnosticRequests() {

    return diagnosticRequestsCache;

}


function saveDiagnosticRequests(list) {

    diagnosticRequestsCache =
        list;

    localStorage.setItem(
        DIAGNOSTIC_STORAGE,
        JSON.stringify(list)
    );

    if (
        typeof saveFirestoreCollection === "function"
    ) {

        saveFirestoreCollection("diagnosticRequests");

    }

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "diagnosticRequests",

        DIAGNOSTIC_STORAGE,

        function () {

            return diagnosticRequestsCache;

        },

        function (newArray) {

            diagnosticRequestsCache = newArray;

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


function createDiagnosticRequestId() {

    const list =
        getDiagnosticRequests();

    let number =
        list.length + 1;

    let id =
        "DX-" + String(number).padStart(5, "0");

    while (
        list.some(
            function (item) {

                return item.id === id;

            }
        )
    ) {

        number++;

        id =
            "DX-" + String(number).padStart(5, "0");

    }

    return id;

}


/* ==========================================
   ➕ ሀኪም አዲስ ትዕዛዝ ይፈጥራል (ገና ላብ/ራጅ አልደረሰም)
========================================== */

function createDiagnosticRequest(data) {

    const list =
        getDiagnosticRequests();

    const request = {

        id:
            createDiagnosticRequestId(),

        patientId:
            data.patientId || "",

        doctorId:
            data.doctorId || "",

        labTests:
            data.labTests || [],

        radiologyExams:
            data.radiologyExams || [],

        note:
            data.note || "",

        status:
            "ካሸር ክፍያ በመጠባበቅ ላይ",

        createdAt:
            new Date().toISOString()

    };

    list.push(request);

    saveDiagnosticRequests(list);

    /* ==========================================
       ትዕዛዙ ሲላክ ወዲያውኑ ታካሚው ከሀኪሙ ወረፋ ይጠፋል
       (ውጤት እስኪመጣ ድረስ)
    ========================================== */

    if (
        typeof getPatientById === "function"
    ) {

        const patient =
            getPatientById(
                data.patientId
            );

        if (patient) {

            patient.status =
                "ምርመራ በመጠባበቅ ላይ";

            if (
                typeof savePatients === "function"
            ) {

                savePatients();

            }

        }

    }

    return request;

}


/* ==========================================
   📋 ካሸር ወረፋ ውስጥ ያሉ ትዕዛዞች
========================================== */

function getPendingDiagnosticRequests() {

    return getDiagnosticRequests().filter(
        function (item) {

            return (
                item.status ===
                "ካሸር ክፍያ በመጠባበቅ ላይ"
            );

        }
    );

}


function getDiagnosticRequestById(id) {

    return getDiagnosticRequests().find(
        function (item) {

            return item.id === id;

        }
    ) || null;

}


/* ==========================================
   ✅ ካሸር ክፍያ ተቀብሎ ወደ ላብ/ራጅ ይልካል
========================================== */

function dispatchDiagnosticRequest(
    requestId,
    labAmount,
    radiologyAmount
) {

    const list =
        getDiagnosticRequests();

    const index =
        list.findIndex(
            function (item) {

                return item.id === requestId;

            }
        );

    if (index === -1) {

        return false;

    }

    const request =
        list[index];

    const patient =
        typeof getPatientById === "function"
            ? getPatientById(request.patientId)
            : null;

    const session =
        typeof getCurrentSession === "function"
            ? getCurrentSession()
            : null;

    if (
        request.labTests.length > 0 &&
        typeof createLabOrder === "function"
    ) {

        const labOrder =
            createLabOrder(

                request.patientId,

                request.doctorId,

                request.labTests,

                request.note

            );

        if (labOrder) {

            list[index].labOrderId =
                labOrder.id;

        }

        if (
            Number(labAmount) > 0 &&
            typeof createPayment === "function"
        ) {

            createPayment({

                patientId:
                    request.patientId,

                patientName:
                    patient
                        ? patient.firstName + " " + patient.fatherName
                        : "",

                doctorId:
                    request.doctorId,

                serviceType:
                    "LABORATORY",

                serviceName:
                    "ላቦራቶሪ (" +
                    request.labTests.join(", ") +
                    ")",

                amount:
                    labAmount,

                receivedBy:
                    session ? session.name : ""

            });

        }

    }

    if (
        request.radiologyExams.length > 0 &&
        typeof createRadiologyOrder === "function"
    ) {

        const radiologyOrder =
            createRadiologyOrder(

                request.patientId,

                request.doctorId,

                request.radiologyExams,

                request.note

            );

        if (radiologyOrder) {

            list[index].radiologyOrderId =
                radiologyOrder.id;

        }

        if (
            Number(radiologyAmount) > 0 &&
            typeof createPayment === "function"
        ) {

            createPayment({

                patientId:
                    request.patientId,

                patientName:
                    patient
                        ? patient.firstName + " " + patient.fatherName
                        : "",

                doctorId:
                    request.doctorId,

                serviceType:
                    "RADIOLOGY",

                serviceName:
                    "ራጅ/ኤክስሬይ (" +
                    request.radiologyExams.join(", ") +
                    ")",

                amount:
                    radiologyAmount,

                receivedBy:
                    session ? session.name : ""

            });

        }

    }

    list[index].status =
        "ተልኳል";

    saveDiagnosticRequests(list);

    /* ==========================================
       ታካሚው ላብ/ራጅ ውጤት እስኪመጣ ድረስ ከሀኪሙ ወረፋ
       ይጠፋል (ልክ እንደሌሎቹ ታካሚዎች ብቻ ይታያሉ)
    ========================================== */

    if (patient) {

        patient.status =
            "ምርመራ በመጠባበቅ ላይ";

        if (
            typeof savePatients === "function"
        ) {

            savePatients();

        }

    }

    return true;

}


/* ==========================================
   🗑️ CANCEL DIAGNOSTIC REQUEST
========================================== */

function cancelDiagnosticRequest(requestId) {

    const list =
        getDiagnosticRequests();

    const index =
        list.findIndex(
            function (item) {

                return item.id === requestId;

            }
        );

    if (index === -1) {

        return false;

    }

    list.splice(index, 1);

    saveDiagnosticRequests(list);

    if (
        typeof deleteFirestoreDoc === "function"
    ) {

        deleteFirestoreDoc("diagnosticRequests", requestId);

    }

    return true;

}


/* ==========================================
   ✅ ላብ ወይም ራጅ ውጤት ሲመዘገብ ይህ ይጠራል
   ------------------------------------------
   ሁለቱም (ላብ እና ራጅ) ከታዘዙ ሁለቱም ውጤት እስኪመጣ
   ድረስ ይጠብቃል። አንዱ ብቻ ከታዘዘ ወዲያውኑ ይጠናቀቃል።
   ሲጠናቀቅ ታካሚው ወደ ሀኪሙ ወረፋ ይመለሳል።
========================================== */

function checkDiagnosticCompletion(
    patientId,
    doctorId
) {

    const list =
        getDiagnosticRequests();

    let changed =
        false;

    list.forEach(
        function (request) {

            if (
                request.patientId !== patientId ||
                request.doctorId !== doctorId ||
                request.status !== "ተልኳል"
            ) {

                return;

            }

            let labDone = true;

            let radDone = true;

            if (request.labOrderId) {

                const labOrder =
                    typeof getLabOrderById === "function"
                        ? getLabOrderById(request.labOrderId)
                        : null;

                labDone =
                    !!(
                        labOrder &&
                        (
                            labOrder.status === "ውጤት ወደ ዶክተር ተልኳል" ||
                            labOrder.status === "ውጤት ታይቷል"
                        )
                    );

            }

            if (request.radiologyOrderId) {

                const radOrder =
                    typeof getRadiologyOrderById === "function"
                        ? getRadiologyOrderById(request.radiologyOrderId)
                        : null;

                radDone =
                    !!(
                        radOrder &&
                        (
                            radOrder.status === "ውጤት ወደ ዶክተር ተልኳል" ||
                            radOrder.status === "ውጤት ታይቷል"
                        )
                    );

            }

            if (labDone && radDone) {

                request.status =
                    "ውጤት ተጠናቀቀ";

                changed = true;

            }

        }
    );

    if (changed) {

        saveDiagnosticRequests(list);

        const patient =
            typeof getPatientById === "function"
                ? getPatientById(patientId)
                : null;

        if (
            patient &&
            patient.status === "ምርመራ በመጠባበቅ ላይ"
        ) {

            patient.status =
                "ሀኪም";

            if (
                typeof savePatients === "function"
            ) {

                savePatients();

            }

        }

    }

}


/* ==========================================
   📋 ለሀኪም ገጽ - በመጠባበቅ ላይ ያሉ / የተጠናቀቁ ትዕዛዞች
========================================== */

function getDiagnosticRequestsForDoctor(doctorId) {

    return getDiagnosticRequests().filter(
        function (request) {

            return (
                request.doctorId === doctorId &&
                (
                    request.status === "ተልኳል" ||
                    request.status === "ውጤት ተጠናቀቀ"
                )
            );

        }
    );

}


function acknowledgeDiagnosticResult(requestId) {

    const list =
        getDiagnosticRequests();

    const index =
        list.findIndex(
            function (item) {

                return item.id === requestId;

            }
        );

    if (index === -1) {

        return false;

    }

    const request =
        list[index];

    if (
        request.labOrderId &&
        typeof markLabResultViewed === "function"
    ) {

        markLabResultViewed(
            request.labOrderId
        );

    }

    if (
        request.radiologyOrderId &&
        typeof markRadiologyResultViewed === "function"
    ) {

        markRadiologyResultViewed(
            request.radiologyOrderId
        );

    }

    list[index].status =
        "ታይቷል";

    saveDiagnosticRequests(list);

    return true;

}


/* ==========================================
   📋 ለዛሬው ጉብኝት የላብ/ራጅ ውጤት ማጠቃለያ
   (ታካሚው ሲሰናበት ከHistory ጋር ተካትቶ እንዲመዘገብ)
========================================== */

function getTodaysDiagnosticSummaryText(
    patientId,
    doctorId
) {

    const requests =
        getDiagnosticRequests().filter(
            function (request) {

                return (
                    request.patientId === patientId &&
                    request.doctorId === doctorId &&
                    (
                        request.status === "ውጤት ተጠናቀቀ" ||
                        request.status === "ታይቷል"
                    )
                );

            }
        );

    if (requests.length === 0) {

        return "";

    }

    const lines = [];

    requests.forEach(
        function (request) {

            if (
                request.labOrderId &&
                typeof getLabOrderById === "function"
            ) {

                const labOrder =
                    getLabOrderById(
                        request.labOrderId
                    );

                if (labOrder && labOrder.results) {

                    Object.keys(labOrder.results).forEach(
                        function (test) {

                            lines.push(
                                "🧪 " +
                                test +
                                ": " +
                                labOrder.results[test]
                            );

                        }
                    );

                }

            }

            if (
                request.radiologyOrderId &&
                typeof getRadiologyOrderById === "function"
            ) {

                const radOrder =
                    getRadiologyOrderById(
                        request.radiologyOrderId
                    );

                if (radOrder && radOrder.results) {

                    Object.keys(radOrder.results).forEach(
                        function (exam) {

                            lines.push(
                                "🩻 " +
                                exam +
                                ": " +
                                radOrder.results[exam]
                            );

                        }
                    );

                }

            }

        }
    );

    return lines.join("\n");

}


/* ==========================================
   🛡️ SAFE TEXT
========================================== */

function escapeDiagnosticText(value) {

    return String(
        value ?? ""
    )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}