

/* ==========================================
   🗑️ CLINIC RECYCLE BIN (የቆሻሻ ማጠራቀሚያ)
   ------------------------------------------
   ሀኪም ወይም ላብራቶሪ ወይም ፋርማሲ የአንድን ታካሚ ወረፋ/ትዕዛዝ
   ሲሰርዙ፣ ወዲያውኑ ሙሉ በሙሉ አይጠፋም። እዚህ ለጊዜው ይቀመጣል።
   Admin ብቻ መልሶ ማምጣት (Restore) ወይም ለዘላለም ማጥፋት
   (Purge) ይችላል።
========================================== */

const RECYCLE_STORAGE = "clinic_recycle";


let recycleBinCache =
    JSON.parse(
        localStorage.getItem(RECYCLE_STORAGE)
    ) || [];


function getRecycleBin() {

    return recycleBinCache;

}


function saveRecycleBin(items) {

    recycleBinCache =
        items;

    localStorage.setItem(
        RECYCLE_STORAGE,
        JSON.stringify(items)
    );

    if (
        typeof saveFirestoreCollection ===
        "function"
    ) {

        saveFirestoreCollection("recycleBin");

    }

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "recycleBin",

        RECYCLE_STORAGE,

        function () {

            return recycleBinCache;

        },

        function (newArray) {

            recycleBinCache = newArray;

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


/* ==========================================
   ADD TO RECYCLE BIN
   type: "DOCTOR_QUEUE" | "LAB_ORDER" | "PRESCRIPTION"
========================================== */

function addToRecycleBin(
    type,
    payload,
    label
) {

    const bin =
        getRecycleBin();

    const session =
        typeof getCurrentSession ===
        "function"
            ? getCurrentSession()
            : null;

    bin.push({

        id:
            "TRASH-" +
            Date.now() +
            "-" +
            Math.floor(
                Math.random() * 1000
            ),

        type:
            type,

        label:
            label || "",

        payload:
            payload,

        deletedBy:
            session ? session.name : "-",

        deletedAt:
            new Date().toISOString()

    });

    saveRecycleBin(bin);

}


/* ==========================================
   ↩️ RESTORE
========================================== */

function restoreFromRecycleBin(trashId) {

    const bin =
        getRecycleBin();

    const index =
        bin.findIndex(
            function (item) {

                return item.id === trashId;

            }
        );

    if (index === -1) {

        alert(
            "ንጥሉ አልተገኘም።"
        );

        return;

    }

    const item =
        bin[index];


    if (
        item.type ===
        "DOCTOR_QUEUE"
    ) {

        const patient =
            typeof getPatientById ===
            "function"
                ? getPatientById(
                    item.payload.patientId
                )
                : null;

        if (patient) {

            patient.status =
                "ሀኪም";

            patient.assignedDoctorId =
                item.payload.assignedDoctorId;

            if (
                typeof savePatients ===
                "function"
            ) {

                savePatients();

            }

        }

    } else if (
        item.type ===
        "LAB_ORDER"
    ) {

        if (
            typeof laboratoryOrders !==
            "undefined"
        ) {

            laboratoryOrders.push(
                item.payload
            );

            if (
                typeof saveLaboratoryOrders ===
                "function"
            ) {

                saveLaboratoryOrders();

            }

        }

    } else if (
        item.type ===
        "RADIOLOGY_ORDER"
    ) {

        if (
            typeof radiologyOrders !==
            "undefined"
        ) {

            radiologyOrders.push(
                item.payload
            );

            if (
                typeof saveRadiologyOrders ===
                "function"
            ) {

                saveRadiologyOrders();

            }

        }

    } else if (
        item.type ===
        "PRESCRIPTION"
    ) {

        if (
            typeof getPharmacyPrescriptions ===
            "function"
        ) {

            const list =
                getPharmacyPrescriptions();

            list.push(
                item.payload
            );

            savePharmacyPrescriptions(
                list
            );

        }

    } else if (
        item.type ===
        "PAYMENT_RECORD"
    ) {

        if (
            typeof getPayments === "function" &&
            typeof savePayments === "function"
        ) {

            const payments =
                getPayments();

            payments.push(
                item.payload
            );

            savePayments(payments);

        }

    } else if (
        item.type ===
        "EXPENSE_RECORD"
    ) {

        if (
            typeof getExpenses === "function" &&
            typeof saveExpenses === "function"
        ) {

            const expenses =
                getExpenses();

            expenses.push(
                item.payload
            );

            saveExpenses(expenses);

        }

    }


    bin.splice(index, 1);

    saveRecycleBin(bin);

    if (
        typeof deleteFirestoreDoc === "function"
    ) {

        deleteFirestoreDoc("recycleBin", trashId);

    }

    alert(
        "✅ ተመልሷል።"
    );

    displayRecycle();

}


/* ==========================================
   🗑️ PERMANENT DELETE
========================================== */

function purgeFromRecycleBin(trashId) {

    const confirmPurge =
        confirm(
            "ይህን ንጥል ለዘላለም ማጥፋት ይፈልጋሉ? ይህ ተግባር መመለስ አይቻልም።"
        );

    if (!confirmPurge) {

        return;

    }

    const bin =
        getRecycleBin().filter(
            function (item) {

                return item.id !== trashId;

            }
        );

    saveRecycleBin(bin);

    if (
        typeof deleteFirestoreDoc === "function"
    ) {

        deleteFirestoreDoc("recycleBin", trashId);

    }

    displayRecycle();

}


function recycleTypeLabel(type) {

    if (type === "DOCTOR_QUEUE") {

        return "🩺 የሀኪም ወረፋ";

    }

    if (type === "LAB_ORDER") {

        return "🧪 የላብ ትዕዛዝ";

    }

    if (type === "RADIOLOGY_ORDER") {

        return "🩻 የራጅ ትዕዛዝ";

    }

    if (type === "PRESCRIPTION") {

        return "💊 Prescription";

    }

    if (type === "PAYMENT_RECORD") {

        return "🧾 የክፍያ መዝገብ";

    }

    if (type === "EXPENSE_RECORD") {

        return "💸 የወጪ መዝገብ";

    }

    return type;

}


/* ==========================================
   📋 DISPLAY RECYCLE PAGE (Admin only)
========================================== */

function displayRecycle() {

    const container =
        document.getElementById(
            "recycleContent"
        );

    if (!container) {

        return;

    }

    if (
        typeof isAdmin === "function" &&
        !isAdmin()
    ) {

        container.innerHTML = `
            <p>
                ይህን ገጽ ማየት የሚችለው
                አስተዳዳሪ (Admin) ብቻ ነው።
            </p>
        `;

        return;

    }

    const bin =
        getRecycleBin()
            .slice()
            .sort(
                function (a, b) {

                    return (
                        new Date(b.deletedAt) -
                        new Date(a.deletedAt)
                    );

                }
            );

    if (bin.length === 0) {

        container.innerHTML = `
            <p>
                ምንም የተሰረዘ ንጥል የለም።
            </p>
        `;

        return;

    }

    container.innerHTML =
        bin.map(
            function (item) {

                return `

                    <div class="patient-item">

                        <h3>
                            ${recycleTypeLabel(item.type)}
                        </h3>

                        <p>
                            <strong>ዝርዝር:</strong>
                            ${escapeRecycleText(item.label || "-")}
                        </p>

                        <p>
                            <strong>ታካሚ ID:</strong>
                            ${escapeRecycleText(
                                (item.payload && item.payload.patientId) || "-"
                            )}
                        </p>

                        <p>
                            <strong>የተሰረዘው በ:</strong>
                            ${escapeRecycleText(item.deletedBy)}
                        </p>

                        <p>
                            🕒
                            ${formatEthiopianDateTime(item.deletedAt)}
                        </p>

                        <button onclick="restoreFromRecycleBin('${item.id}')">
                            ↩️ መልስ
                        </button>

                        <button
                            onclick="purgeFromRecycleBin('${item.id}')"
                            style="background:#c0392b;"
                        >
                            🗑️ ለዘላለም አጥፋ
                        </button>

                    </div>

                `;

            }
        ).join("");

}


function escapeRecycleText(value) {

    return String(
        value ?? ""
    )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}