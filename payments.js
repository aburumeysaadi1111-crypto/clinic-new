

// ==========================================
// የካሸር አስተዳደር - CASHIER / PAYMENTS
// ==========================================

const PAYMENT_STORAGE = "clinic_payments";
const EXPENSE_STORAGE = "clinic_expenses";

// ==========================================
// የክፍያ መረጃ ማንበብ
// ==========================================

let paymentsCache =
    JSON.parse(
        localStorage.getItem(PAYMENT_STORAGE)
    ) || [];


function getPayments() {

    return paymentsCache;

}

// ==========================================
// የክፍያ መረጃ ማስቀመጥ
// ==========================================

function savePayments(paymentsList) {

    paymentsCache =
        paymentsList;

    localStorage.setItem(
        PAYMENT_STORAGE,
        JSON.stringify(paymentsList)
    );

    if (
        typeof saveFirestoreCollection ===
        "function"
    ) {

        saveFirestoreCollection("payments");

    }

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "payments",

        PAYMENT_STORAGE,

        function () {

            return paymentsCache;

        },

        function (newArray) {

            paymentsCache = newArray;

        },

        function () {

            if (
                typeof rerenderCurrentPage === "function"
            ) {

                rerenderCurrentPage();

            }

            if (
                typeof updatePaymentCount === "function"
            ) {

                updatePaymentCount();

            }

            if (
                typeof updateNoticeBoard === "function"
            ) {

                updateNoticeBoard();

            }

        }

    );

}

// ==========================================
// Receipt Number መፍጠር
// ==========================================

function createReceiptNumber() {

    const payments = getPayments();

    let number =
        payments.length + 1;

    let receipt =
        "REC-" +
        String(number).padStart(5, "0");

    while (
        payments.some(
            payment =>
                payment.receiptNumber ===
                receipt
        )
    ) {

        number++;

        receipt =
            "REC-" +
            String(number).padStart(5, "0");

    }

    return receipt;

}

// ==========================================
// የክፍያ አገልግሎት ዓይነቶች
// ==========================================

const PAYMENT_SERVICES = [

    {
        id: "CARD",
        name: "ካርድ ማውጫ"
    },

    {
        id: "CONSULTATION",
        name: "የዶክተር ምርመራ"
    },

    {
        id: "LABORATORY",
        name: "ላቦራቶሪ"
    },

    {
        id: "RADIOLOGY",
        name: "ራጅ/ኤክስሬይ"
    },

    {
        id: "PHARMACY",
        name: "ፋርማሲ"
    },

    {
        id: "OTHER",
        name: "ሌላ አገልግሎት"
    }

];

// ==========================================
// ክፍያ መመዝገብ
// ==========================================

function createPayment(paymentData) {

    const payments = getPayments();

    const amount =
        Number(paymentData.amount) || 0;

    const payment = {

        id:
            "PAY-" +
            Date.now(),

        receiptNumber:
            createReceiptNumber(),

        patientId:
            paymentData.patientId || "",

        patientName:
            paymentData.patientName || "",

        doctorId:
            paymentData.doctorId || "",

        doctorName:
            paymentData.doctorName || "",

        serviceType:
            paymentData.serviceType || "",

        serviceName:
            paymentData.serviceName || "",

        amount:
            amount,

        currency:
            paymentData.currency || "ብር",

        paymentMethod:
            paymentData.paymentMethod ||
            "ጥሬ ገንዘብ",

        reference:
            paymentData.reference || "",

        notes:
            paymentData.notes || "",

        date:
            new Date().toISOString(),

        receivedBy:
            paymentData.receivedBy || "",

        status:
            "ተከፍሏል"

    };

    payments.push(payment);

    savePayments(payments);

    return payment;

}

// ==========================================
// በReceipt Number መፈለግ
// ==========================================

function getPaymentByReceipt(
    receiptNumber
) {

    const payments = getPayments();

    return payments.find(
        payment =>
            payment.receiptNumber ===
            receiptNumber
    ) || null;

}

// ==========================================
// በPayment ID መፈለግ
// ==========================================

function getPaymentById(paymentId) {

    const payments = getPayments();

    return payments.find(
        payment =>
            payment.id === paymentId
    ) || null;

}

// ==========================================
// የታካሚ ክፍያ History
// ==========================================

function getPatientPayments(
    patientId
) {

    return getPayments()
        .filter(
            payment =>
                payment.patientId ===
                patientId
        );

}

// ==========================================
// የዶክተር ክፍያ History
// ==========================================

function getDoctorPayments(
    doctorId
) {

    return getPayments()
        .filter(
            payment =>
                payment.doctorId ===
                doctorId
        );

}

// ==========================================
// የቀን ገቢ
// ==========================================

function getDailyIncome(dateString) {

    const payments = getPayments();

    const targetDate =
        dateString ||
        new Date()
            .toISOString()
            .split("T")[0];

    return payments
        .filter(payment => {

            const paymentDate =
                payment.date
                    .split("T")[0];

            return (
                paymentDate ===
                targetDate
            );

        })
        .reduce(
            (total, payment) =>
                total +
                Number(payment.amount || 0),
            0
        );

}

// ==========================================
// የወር ገቢ
// ==========================================

function getMonthlyIncome(
    year,
    month
) {

    const payments = getPayments();

    const currentYear =
        Number(year) ||
        new Date().getFullYear();

    const currentMonth =
        Number(month) ||
        new Date().getMonth() + 1;

    return payments
        .filter(payment => {

            const date =
                new Date(payment.date);

            return (
                date.getFullYear() ===
                    currentYear &&
                date.getMonth() + 1 ===
                    currentMonth
            );

        })
        .reduce(
            (total, payment) =>
                total +
                Number(payment.amount || 0),
            0
        );

}

// ==========================================
// የክፍያ ብዛት
// ==========================================

function getPaymentCount() {

    return getPayments().length;

}

// ==========================================
// Dashboard ላይ የክፍያ ቁጥር
// ==========================================

function updatePaymentCount() {

    const element =
        document.getElementById(
            "paymentCount"
        );

    if (element) {

        element.textContent =
            getPaymentCount();

    }

}

// ==========================================
// የክፍያ ዝርዝር መረጃ
// ==========================================

function getPaymentSummary() {

    const payments =
        getPayments();

    const total =
        payments.reduce(
            (sum, payment) =>
                sum +
                Number(payment.amount || 0),
            0
        );

    return {

        totalPayments:
            payments.length,

        totalIncome:
            total,

        currency:
            "ብር"

    };

}


// ==========================================
// 💸 EXPENSES (ወጪዎች)
// ==========================================

let expensesCache =
    JSON.parse(
        localStorage.getItem(EXPENSE_STORAGE)
    ) || [];


function getExpenses() {

    return expensesCache;

}


function saveExpenses(expensesList) {

    expensesCache =
        expensesList;

    localStorage.setItem(
        EXPENSE_STORAGE,
        JSON.stringify(expensesList)
    );

    if (
        typeof saveFirestoreCollection === "function"
    ) {

        saveFirestoreCollection("expenses");

    }

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "expenses",

        EXPENSE_STORAGE,

        function () {

            return expensesCache;

        },

        function (newArray) {

            expensesCache = newArray;

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


function createExpense(data) {

    const expenses =
        getExpenses();

    const session =
        typeof getCurrentSession === "function"
            ? getCurrentSession()
            : null;

    const expense = {

        id:
            "EXP-" +
            Date.now(),

        amount:
            Number(data.amount) || 0,

        reason:
            data.reason || "",

        notes:
            data.notes || "",

        date:
            new Date().toISOString(),

        recordedBy:
            session ? session.name : ""

    };

    expenses.push(expense);

    saveExpenses(expenses);

    return expense;

}


function getTotalExpenses() {

    return getExpenses().reduce(
        function (total, expense) {

            return total + Number(expense.amount || 0);

        },
        0
    );

}

// ==========================================
// 🛡️ SAFE TEXT
// ==========================================

function escapePaymentText(value) {

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
// 💰 DISPLAY PAYMENTS PAGE (ካሸር)
// ==========================================

function displayPayments() {

    const container =
        document.getElementById(
            "paymentsContent"
        );

    if (!container) {

        return;

    }

    container.innerHTML = `

        <h2>
            🧑‍🤝‍🧑 ከካርድ ክፍል የተላኩ ታካሚዎች
        </h2>

        <div id="cashierPatientQueue"></div>

        <hr>

        <h2>
            💊 የፋርማሲ ክፍያ ወረፋ
        </h2>

        <div id="cashierPharmacyQueue"></div>

        <hr>

        <h2>
            🧪🩻 የላብ/ራጅ ክፍያ ወረፋ
        </h2>

        <div id="cashierDiagnosticQueue"></div>

        <hr>

        <div class="payment-form-container">

            <h2>
                ክፍያ መዝግብ (ለያንዳንዱ አገልግሎት ለብቻ)
            </h2>

            <p style="color:#52606d; font-size:14px;">
                ታካሚው ከአንድ በላይ አገልግሎት የሚከፍል ከሆነ (ለምሳሌ ካርድ + ላቦራቶሪ)፣
                ከታች ያሉትን ሁሉንም ይምረጡና ለያንዳንዱ የራሱን መጠን ያስገቡ - ለኦዲት
                እንዲመች ለያንዳንዱ የተለየ ደረሰኝ ይመዘገባል።
            </p>

            <form
                id="paymentForm"
                class="clinic-form"
            >

                <label>
                    ታካሚ ID *
                </label>

                <input
                    type="text"
                    id="payPatientId"
                    placeholder="ለምሳሌ PAT00001"
                    required
                >

                <label>
                    ዶክተር ID
                </label>

                <input
                    type="text"
                    id="payDoctorId"
                    placeholder="ለምሳሌ DOC00001"
                >

                <label style="grid-column:1/-1;">
                    💰 አገልግሎት(ዎች) እና መጠን *
                </label>

                <div
                    id="payServiceItems"
                    style="grid-column:1/-1; display:flex; flex-direction:column; gap:8px;"
                >

                    ${
                        PAYMENT_SERVICES.map(
                            function (service) {

                                return `

                                    <div style="display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #d9e2ec; border-radius:8px; padding:8px 10px;">

                                        <input
                                            type="checkbox"
                                            class="pay-service-checkbox"
                                            value="${service.id}"
                                            data-name="${escapePaymentText(service.name)}"
                                            id="paySvc-${service.id}"
                                        >

                                        <label
                                            for="paySvc-${service.id}"
                                            style="flex:1; font-weight:normal; align-self:center;"
                                        >
                                            ${escapePaymentText(service.name)}
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="መጠን (ብር)"
                                            class="pay-service-amount"
                                            id="payAmt-${service.id}"
                                            style="width:130px; min-height:38px;"
                                        >

                                    </div>

                                `;

                            }
                        ).join("")
                    }

                </div>

                <label>
                    የክፍያ ዘዴ
                </label>

                <select id="payMethod">

                    <option>
                        ጥሬ ገንዘብ
                    </option>

                    <option>
                        ባንክ
                    </option>

                    <option>
                        ሞባይል ባንኪንግ
                    </option>

                </select>

                <label>
                    ማጣቀሻ ቁጥር
                </label>

                <input
                    type="text"
                    id="payReference"
                >

                <label style="grid-column:1/-1;">
                    ማስታወሻ
                </label>

                <textarea
                    id="payNotes"
                    style="grid-column:1/-1;"
                ></textarea>

                <button type="submit">
                    💾 ክፍያ(ዎች) መዝግብ
                </button>

            </form>

        </div>

        <hr>

        <div class="payment-form-container">

            <h2>
                💸 ወጪ መዝግብ
            </h2>

            <form
                id="expenseForm"
                class="clinic-form"
            >

                <label>
                    የወጪ መጠን (ብር) *
                </label>

                <input
                    type="number"
                    id="expAmount"
                    min="0"
                    required
                >

                <label>
                    ምክንያት (Reason) *
                </label>

                <input
                    type="text"
                    id="expReason"
                    placeholder="ለምሳሌ የጽዳት እቃ ግዢ"
                    required
                >

                <label style="grid-column:1/-1;">
                    ተጨማሪ ማስታወሻ
                </label>

                <textarea
                    id="expNotes"
                    style="grid-column:1/-1;"
                ></textarea>

                <button type="submit">
                    💾 ወጪ መዝግብ
                </button>

            </form>

            <hr>

            <h3>
                🧾 የቅርብ ጊዜ ወጪዎች
            </h3>

            <div id="expenseList"></div>

        </div>

        <hr>

        <div class="payment-list-container">

            <h2>
                🧾 የቅርብ ጊዜ ክፍያዎች
            </h2>

            <div id="paymentsList"></div>

        </div>

    `;

    renderCashierPatientQueue();

    renderCashierPharmacyQueue();

    renderCashierDiagnosticQueue();

    setupPaymentForm();

    setupExpenseForm();

    renderExpenseList();

    renderPaymentsList();

}


// ==========================================
// 🧑‍🤝‍🧑 CASHIER PATIENT QUEUE (ካርድ → ካሸር → ሀኪም)
// ==========================================

function renderCashierPatientQueue() {

    const box =
        document.getElementById(
            "cashierPatientQueue"
        );

    if (!box) {

        return;

    }

    const queue =
        typeof getPatientsByStatus === "function"
            ? getPatientsByStatus("ካሸር")
            : [];

    if (queue.length === 0) {

        box.innerHTML = `
            <p>
                አሁን የተጠባበቀ ታካሚ የለም።
            </p>
        `;

        return;

    }

    const doctorOptions =
        (
            typeof getDoctors === "function"
                ? getDoctors()
                : []
        ).map(
            function (doctor) {

                return `
                    <option value="${doctor.id}">
                        ${escapePaymentText(doctor.id)} -
                        ${escapePaymentText(doctor.firstName)}
                        ${escapePaymentText(doctor.fatherName)}
                        (${escapePaymentText(doctor.specialization)})
                    </option>
                `;

            }
        ).join("");

    box.innerHTML =
        queue.map(
            function (patient) {

                /* 🚨 ኤመርጀንሲ ታካሚ - ቀድሞ ዶክተር ጋር ስለደረሰ
                   ዶክተር መምረጥ አያስፈልገውም፣ ክፍያ ተቀብሎ ብቻ
                   ማሰናበት ነው። */

                if (patient.isEmergency) {

                    const emergencyServiceCheckboxes =
                        PAYMENT_SERVICES.map(
                            function (service) {

                                return `

                                    <div style="display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #d9e2ec; border-radius:8px; padding:8px 10px;">

                                        <input
                                            type="checkbox"
                                            class="cashier-item-checkbox-${patient.id}"
                                            value="${service.id}"
                                            data-name="${escapePaymentText(service.name)}"
                                            id="cashierSvc-${patient.id}-${service.id}"
                                            ${service.id === "CONSULTATION" ? "checked" : ""}
                                        >

                                        <label
                                            for="cashierSvc-${patient.id}-${service.id}"
                                            style="flex:1; font-weight:normal; align-self:center;"
                                        >
                                            ${escapePaymentText(service.name)}
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="መጠን (ብር)"
                                            id="cashierAmt-${patient.id}-${service.id}"
                                            style="width:120px; min-height:38px;"
                                        >

                                    </div>

                                `;

                            }
                        ).join("");

                    return `

                        <div class="patient-item" style="border:2px solid #c0392b;">

                            <h3>
                                🚨 ኤመርጀንሲ -
                                ${escapePaymentText(patient.firstName)}
                                ${escapePaymentText(patient.fatherName)}
                            </h3>

                            <p style="color:#c0392b;">
                                ህክምና ተጠናቅቋል - ክፍያ ተቀብለው ያሰናብቱ
                                ${
                                    patient.emergencyReason
                                    ? " (" + escapePaymentText(patient.emergencyReason) + ")"
                                    : ""
                                }
                            </p>

                            <p>
                                <strong>ID:</strong>
                                ${escapePaymentText(patient.id)}
                            </p>

                            <label>
                                💰 አገልግሎት(ዎች) እና መጠን
                            </label>

                            <div style="display:flex; flex-direction:column; gap:6px;">
                                ${emergencyServiceCheckboxes}
                            </div>

                            <label>
                                የክፍያ ዘዴ
                            </label>

                            <select id="cashierMethod-${patient.id}">
                                <option>ጥሬ ገንዘብ</option>
                                <option>ባንክ</option>
                                <option>ሞባይል ባንኪንግ</option>
                            </select>

                            <button
                                onclick="handleEmergencyBilling('${patient.id}')"
                                style="background:#c0392b;"
                            >
                                ✅ ክፍያ ተቀብዬ አሰናብት
                            </button>

                        </div>

                    `;

                }

                const isNewPatient =
                    !patient.hasPaidCardFee;

                const serviceCheckboxes =
                    PAYMENT_SERVICES.map(
                        function (service) {

                            const checkedByDefault =
                                (
                                    isNewPatient &&
                                    service.id === "CARD"
                                ) ||
                                service.id === "CONSULTATION";

                            return `

                                <div style="display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #d9e2ec; border-radius:8px; padding:8px 10px;">

                                    <input
                                        type="checkbox"
                                        class="cashier-item-checkbox-${patient.id}"
                                        value="${service.id}"
                                        data-name="${escapePaymentText(service.name)}"
                                        id="cashierSvc-${patient.id}-${service.id}"
                                        ${checkedByDefault ? "checked" : ""}
                                    >

                                    <label
                                        for="cashierSvc-${patient.id}-${service.id}"
                                        style="flex:1; font-weight:normal; align-self:center;"
                                    >
                                        ${escapePaymentText(service.name)}
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="መጠን (ብር)"
                                        id="cashierAmt-${patient.id}-${service.id}"
                                        style="width:120px; min-height:38px;"
                                    >

                                </div>

                            `;

                        }
                    ).join("");

                return `

                    <div class="patient-item">

                        <h3>
                            👤
                            ${escapePaymentText(patient.firstName)}
                            ${escapePaymentText(patient.fatherName)}
                        </h3>

                        <p>
                            <strong>ID:</strong>
                            ${escapePaymentText(patient.id)}
                            ${
                                isNewPatient
                                ? ' <span style="color:#c0392b;">(አዲስ ታካሚ - ካርድ ክፍያ ያስፈልጋል)</span>'
                                : ""
                            }
                        </p>

                        <p>
                            <strong>ቀበሌ:</strong>
                            ${escapePaymentText(patient.kebele || "-")}
                        </p>

                        <label>
                            ወደ የትኛው ዶክተር ይላክ? *
                        </label>

                        <select id="cashierDoctorSelect-${patient.id}">
                            <option value="">ዶክተር ይምረጡ</option>
                            ${doctorOptions}
                        </select>

                        <label style="margin-top:6px;">
                            💰 አገልግሎት(ዎች) እና ምክንያት/መጠን
                        </label>

                        <div style="display:flex; flex-direction:column; gap:6px;">
                            ${serviceCheckboxes}
                        </div>

                        <label>
                            የክፍያ ዘዴ
                        </label>

                        <select id="cashierMethod-${patient.id}">
                            <option>ጥሬ ገንዘብ</option>
                            <option>ባንክ</option>
                            <option>ሞባይል ባንኪንግ</option>
                        </select>

                        <button
                            onclick="handleCashierReceive('${patient.id}')"
                            style="background:#0b5d45;"
                        >
                            ✅ ተቀበልኩ → ወደ ሀኪም ላክ
                        </button>

                    </div>

                `;

            }
        ).join("");

}


function handleEmergencyBilling(patientId) {

    const patient =
        typeof getPatientById === "function"
            ? getPatientById(patientId)
            : null;

    if (!patient) {

        alert(
            "መረጃ አልተገኘም።"
        );

        return;

    }

    const checkedBoxes =
        document.querySelectorAll(
            ".cashier-item-checkbox-" + patientId + ":checked"
        );

    const method =
        document.getElementById(
            "cashierMethod-" + patientId
        );

    const paymentMethod =
        method ? method.value : "ጥሬ ገንዘብ";

    const session =
        typeof getCurrentSession === "function"
            ? getCurrentSession()
            : null;

    const receipts = [];

    for (let i = 0; i < checkedBoxes.length; i++) {

        const checkbox =
            checkedBoxes[i];

        const serviceId =
            checkbox.value;

        const serviceName =
            checkbox.dataset.name;

        const amountInput =
            document.getElementById(
                "cashierAmt-" + patientId + "-" + serviceId
            );

        const amount =
            amountInput ? Number(amountInput.value) : 0;

        if (
            isNaN(amount) ||
            amount <= 0
        ) {

            alert(
                "«" +
                serviceName +
                "» ትክክለኛ የክፍያ መጠን ያስገቡ ወይም ምልክቱን ያንሱት።"
            );

            return;

        }

        const payment =
            createPayment({

                patientId: patient.id,

                patientName:
                    patient.firstName + " " + patient.fatherName,

                doctorId: "",

                doctorName: "",

                serviceType: serviceId,

                serviceName: serviceName,

                amount: amount,

                paymentMethod: paymentMethod,

                receivedBy:
                    session ? session.name : ""

            });

        receipts.push(
            payment.receiptNumber +
            " (" +
            serviceName +
            ": " +
            amount +
            " ብር)"
        );

        if (serviceId === "CARD") {

            patient.hasPaidCardFee = true;

        }

    }

    patient.hasPaidCardFee = true;

    patient.status = "ካርድ";

    savePatients();

    alert(

        "✅ ክፍያ ተቀብለው ታካሚው ተሰናብቷል።" +

        (
            receipts.length > 0
                ? "\n\n" + receipts.join("\n")
                : ""
        )

    );

    displayPayments();

    updatePaymentCount();

}


function handleCashierReceive(patientId) {

    const doctorSelect =
        document.getElementById(
            "cashierDoctorSelect-" + patientId
        );

    const doctorId =
        doctorSelect ? doctorSelect.value : "";

    if (!doctorId) {

        alert(
            "እባክዎ ወደ የትኛው ዶክተር እንደሚላክ ይምረጡ።"
        );

        return;

    }

    const patient =
        typeof getPatientById === "function"
            ? getPatientById(patientId)
            : null;

    const doctor =
        typeof getDoctorById === "function"
            ? getDoctorById(doctorId)
            : null;

    if (!patient || !doctor) {

        alert(
            "መረጃ አልተገኘም።"
        );

        return;

    }

    const checkedBoxes =
        document.querySelectorAll(
            ".cashier-item-checkbox-" + patientId + ":checked"
        );

    const method =
        document.getElementById(
            "cashierMethod-" + patientId
        );

    const paymentMethod =
        method ? method.value : "ጥሬ ገንዘብ";

    const session =
        typeof getCurrentSession === "function"
            ? getCurrentSession()
            : null;

    const receipts = [];

    for (let i = 0; i < checkedBoxes.length; i++) {

        const checkbox =
            checkedBoxes[i];

        const serviceId =
            checkbox.value;

        const serviceName =
            checkbox.dataset.name;

        const amountInput =
            document.getElementById(
                "cashierAmt-" + patientId + "-" + serviceId
            );

        const amount =
            amountInput ? Number(amountInput.value) : 0;

        if (
            isNaN(amount) ||
            amount <= 0
        ) {

            alert(
                "«" +
                serviceName +
                "» ትክክለኛ የክፍያ መጠን ያስገቡ ወይም ምልክቱን ያንሱት።"
            );

            return;

        }

        const payment =
            createPayment({

                patientId: patient.id,

                patientName:
                    patient.firstName + " " + patient.fatherName,

                doctorId: doctor.id,

                doctorName:
                    doctor.firstName + " " + doctor.fatherName,

                serviceType: serviceId,

                serviceName: serviceName,

                amount: amount,

                paymentMethod: paymentMethod,

                receivedBy:
                    session ? session.name : ""

            });

        receipts.push(
            payment.receiptNumber +
            " (" +
            serviceName +
            ": " +
            amount +
            " ብር)"
        );

        if (serviceId === "CARD") {

            patient.hasPaidCardFee = true;

        }

    }

    patient.status = "ሀኪም";

    patient.assignedDoctorId = doctor.id;

    savePatients();

    alert(

        "✅ ታካሚው ወደ ዶክተር " +
        doctor.firstName +
        " ተልኳል።" +

        (
            receipts.length > 0
                ? "\n\n" + receipts.join("\n")
                : ""
        )

    );

    displayPayments();

    updatePaymentCount();

}


// ==========================================
// 💊 CASHIER PHARMACY QUEUE
// ==========================================

function renderCashierPharmacyQueue() {

    const box =
        document.getElementById(
            "cashierPharmacyQueue"
        );

    if (!box) {

        return;

    }

    const queue =
        typeof getPharmacyPrescriptions === "function"
            ? getPharmacyPrescriptions().filter(
                function (rx) {

                    return rx.status === "ወደ ካሸር ተልኳል";

                }
            )
            : [];

    if (queue.length === 0) {

        box.innerHTML = `
            <p>
                አሁን የተጠባበቀ የፋርማሲ ክፍያ የለም።
            </p>
        `;

        return;

    }

    box.innerHTML =
        queue.map(
            function (rx) {

                const medicineNames =
                    (rx.medicines || [])
                        .map(m => m.name)
                        .join(", ");

                return `

                    <div class="patient-item">

                        <h3>💊 ${escapePaymentText(rx.id)}</h3>

                        <p>
                            <strong>ታካሚ:</strong>
                            ${escapePaymentText(rx.patientName || rx.patientId)}
                        </p>

                        <p>
                            <strong>መድሃኒቶች:</strong>
                            ${escapePaymentText(medicineNames)}
                        </p>

                        <label>
                            የክፍያ መጠን (ብር)
                        </label>

                        <input
                            type="number"
                            id="cashierRxAmount-${rx.id}"
                            min="0"
                        >

                        <button
                            onclick="handleCashierReceivePharmacy('${rx.id}')"
                            style="background:#0b5d45;"
                        >
                            ✅ ክፍያ ተቀበልኩ
                        </button>

                    </div>

                `;

            }
        ).join("");

}


function handleCashierReceivePharmacy(prescriptionId) {

    const amountInput =
        document.getElementById(
            "cashierRxAmount-" + prescriptionId
        );

    const amount =
        amountInput ? Number(amountInput.value) : 0;

    if (
        isNaN(amount) ||
        amount <= 0
    ) {

        alert(
            "ትክክለኛ የክፍያ መጠን ያስገቡ።"
        );

        return;

    }

    if (
        typeof payPrescriptionAtPharmacy === "function"
    ) {

        payPrescriptionAtPharmacy(
            prescriptionId,
            amount
        );

    }

    alert(
        "✅ ክፍያው ተመዝግቧል። ፋርማሲው መድሃኒቱን መስጠት ይችላል።"
    );

    displayPayments();

    updatePaymentCount();

}


// ==========================================
// 🧪🩻 CASHIER LAB/RADIOLOGY PAYMENT QUEUE
// ==========================================

function renderCashierDiagnosticQueue() {

    const box =
        document.getElementById(
            "cashierDiagnosticQueue"
        );

    if (!box) {

        return;

    }

    const queue =
        typeof getPendingDiagnosticRequests === "function"
            ? getPendingDiagnosticRequests()
            : [];

    if (queue.length === 0) {

        box.innerHTML = `
            <p>
                አሁን ከዶክተር የተላከ የላብ/ራጅ ክፍያ የለም።
            </p>
        `;

        return;

    }

    box.innerHTML =
        queue.map(
            function (request) {

                const patient =
                    typeof getPatientById === "function"
                        ? getPatientById(request.patientId)
                        : null;

                return `

                    <div class="patient-item">

                        <h3>🧾 ${escapePaymentText(request.id)}</h3>

                        <p>
                            <strong>ታካሚ:</strong>
                            ${
                                escapePaymentText(
                                    patient
                                        ? patient.firstName + " " + patient.fatherName
                                        : request.patientId
                                )
                            }
                        </p>

                        ${
                            request.labTests.length > 0
                            ? `<p><strong>🧪 የላብ ምርመራ:</strong> ${escapePaymentText(request.labTests.join(", "))}</p>
                               <label>የላብ ክፍያ (ብር)</label>
                               <input type="number" min="0" id="dxLabAmount-${request.id}" placeholder="0">`
                            : ""
                        }

                        ${
                            request.radiologyExams.length > 0
                            ? `<p><strong>🩻 የራጅ ምርመራ:</strong> ${escapePaymentText(request.radiologyExams.join(", "))}</p>
                               <label>የራጅ ክፍያ (ብር)</label>
                               <input type="number" min="0" id="dxRadAmount-${request.id}" placeholder="0">`
                            : ""
                        }

                        <button
                            onclick="handleCashierReceiveDiagnostic('${request.id}')"
                            style="background:#0b5d45;"
                        >
                            ✅ ክፍያ ተቀብዬ ላክ
                        </button>

                        <button
                            onclick="handleCancelDiagnosticRequest('${request.id}')"
                            style="background:#c0392b;"
                        >
                            🗑️ ሰርዝ
                        </button>

                    </div>

                `;

            }
        ).join("");

}


function handleCashierReceiveDiagnostic(requestId) {

    const request =
        typeof getDiagnosticRequestById === "function"
            ? getDiagnosticRequestById(requestId)
            : null;

    if (!request) {

        alert(
            "ትዕዛዙ አልተገኘም።"
        );

        return;

    }

    const labAmountInput =
        document.getElementById(
            "dxLabAmount-" + requestId
        );

    const radAmountInput =
        document.getElementById(
            "dxRadAmount-" + requestId
        );

    const labAmount =
        labAmountInput ? labAmountInput.value : 0;

    const radAmount =
        radAmountInput ? radAmountInput.value : 0;

    dispatchDiagnosticRequest(
        requestId,
        labAmount,
        radAmount
    );

    alert(
        "✅ ክፍያው ተመዝግቦ ትዕዛዙ ወደ ላብ/ራጅ ተልኳል።"
    );

    displayPayments();

    updatePaymentCount();

}


function handleCancelDiagnosticRequest(requestId) {

    const confirmCancel =
        confirm(
            "ይህን ትዕዛዝ መሰረዝ ይፈልጋሉ?"
        );

    if (!confirmCancel) {

        return;

    }

    cancelDiagnosticRequest(requestId);

    displayPayments();

}


// ==========================================
// 📝 SETUP PAYMENT FORM (ነጻ ክፍያ)
// ==========================================

function setupPaymentForm() {

    const form =
        document.getElementById(
            "paymentForm"
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
                    "payPatientId"
                ).value.trim();

            const doctorId =
                document.getElementById(
                    "payDoctorId"
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

            const checkedServices =
                Array.from(
                    document.querySelectorAll(
                        ".pay-service-checkbox:checked"
                    )
                );

            if (checkedServices.length === 0) {

                alert(
                    "ቢያንስ አንድ አገልግሎት ይምረጡ።"
                );

                return;

            }

            const items = [];

            for (
                let i = 0;
                i < checkedServices.length;
                i++
            ) {

                const checkbox =
                    checkedServices[i];

                const serviceId =
                    checkbox.value;

                const serviceName =
                    checkbox.dataset.name;

                const amountInput =
                    document.getElementById(
                        "payAmt-" + serviceId
                    );

                const amount =
                    amountInput
                        ? Number(amountInput.value)
                        : 0;

                if (
                    isNaN(amount) ||
                    amount <= 0
                ) {

                    alert(
                        "«" +
                        serviceName +
                        "» ትክክለኛ የክፍያ መጠን ያስገቡ።"
                    );

                    return;

                }

                items.push({

                    serviceId:
                        serviceId,

                    serviceName:
                        serviceName,

                    amount:
                        amount

                });

            }

            const method =
                document.getElementById(
                    "payMethod"
                ).value;

            const reference =
                document.getElementById(
                    "payReference"
                ).value.trim();

            const notes =
                document.getElementById(
                    "payNotes"
                ).value.trim();

            const session =
                typeof getCurrentSession ===
                "function"
                    ? getCurrentSession()
                    : null;

            const receipts = [];

            items.forEach(
                function (item) {

                    const payment =
                        createPayment({

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

                            serviceType:
                                item.serviceId,

                            serviceName:
                                item.serviceName,

                            amount:
                                item.amount,

                            paymentMethod:
                                method,

                            reference:
                                reference,

                            notes:
                                notes,

                            receivedBy:
                                session
                                    ? session.name
                                    : ""

                        });

                    receipts.push(
                        payment.receiptNumber +
                        " (" +
                        item.serviceName +
                        ": " +
                        item.amount +
                        " ብር)"
                    );

                }
            );

            alert(

                "✅ " +
                items.length +
                " ክፍያ(ዎች) ተመዝግበዋል።\n\n" +

                receipts.join("\n")

            );

            form.reset();

            displayPayments();

            updatePaymentCount();

        }
    );

}


// ==========================================
// 💸 SETUP EXPENSE FORM
// ==========================================

function setupExpenseForm() {

    const form =
        document.getElementById("expenseForm");

    if (!form) {

        return;

    }

    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const amount =
                document.getElementById("expAmount").value;

            const reason =
                document.getElementById("expReason").value.trim();

            const notes =
                document.getElementById("expNotes").value.trim();

            if (
                !reason
            ) {

                alert(
                    "የወጪውን ምክንያት ያስገቡ።"
                );

                return;

            }

            createExpense({

                amount: amount,

                reason: reason,

                notes: notes

            });

            alert(
                "✅ ወጪው ተመዝግቧል።"
            );

            form.reset();

            renderExpenseList();

        }
    );

}


function renderExpenseList() {

    const list =
        document.getElementById("expenseList");

    if (!list) {

        return;

    }

    const expenses =
        getExpenses()
            .slice()
            .sort(
                function (a, b) {

                    return new Date(b.date) - new Date(a.date);

                }
            )
            .slice(0, 15);

    if (expenses.length === 0) {

        list.innerHTML = `
            <p>እስካሁን ወጪ አልተመዘገበም።</p>
        `;

        return;

    }

    list.innerHTML =
        expenses.map(
            function (expense) {

                return `

                    <div class="patient-item">

                        <h3>💸 ${escapePaymentText(expense.amount)} ብር</h3>

                        <p>
                            <strong>ምክንያት:</strong>
                            ${escapePaymentText(expense.reason)}
                        </p>

                        <p>
                            ${escapePaymentText(expense.notes || "")}
                        </p>

                        <p>
                            🕒
                            ${formatEthiopianDateTime(expense.date)}
                            —
                            ${escapePaymentText(expense.recordedBy)}
                        </p>

                    </div>

                `;

            }
        ).join("");

}

// ==========================================
// 📋 RENDER PAYMENTS LIST
// ==========================================

function renderPaymentsList() {

    const list =
        document.getElementById(
            "paymentsList"
        );

    if (!list) {

        return;

    }

    const payments =
        getPayments()
            .slice()
            .sort(
                function (a, b) {

                    return (
                        new Date(b.date) -
                        new Date(a.date)
                    );

                }
            )
            .slice(0, 15);

    if (payments.length === 0) {

        list.innerHTML = `
            <p>
                እስካሁን ክፍያ አልተመዘገበም።
            </p>
        `;

        return;

    }

    list.innerHTML =
        payments.map(
            function (payment) {

                return `

                    <div class="patient-item">

                        <h3>
                            🧾
                            ${escapePaymentText(payment.receiptNumber)}
                        </h3>

                        <p>
                            <strong>
                                ታካሚ:
                            </strong>
                            ${escapePaymentText(payment.patientName || payment.patientId)}
                        </p>

                        <p>
                            <strong>
                                አገልግሎት:
                            </strong>
                            ${escapePaymentText(payment.serviceName || "-")}
                        </p>

                        <p>
                            <strong>
                                መጠን:
                            </strong>
                            ${escapePaymentText(payment.amount)} ${escapePaymentText(payment.currency)}
                        </p>

                        <p>
                            <strong>
                                የክፍያ ዘዴ:
                            </strong>
                            ${escapePaymentText(payment.paymentMethod)}
                        </p>

                        <p>
                            🕒
                            ${
                                formatEthiopianDateTime(
                                    payment.date
                                )
                            }
                        </p>

                    </div>

                `;

            }
        ).join("");

}

// ==========================================
// ገጹ ሲከፈት
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updatePaymentCount();

    }
);