

// ==========================================
// የክሊኒክ ሪፖርት - REPORTS
// ==========================================

const REPORT_STORAGE = "clinic_reports";

// ==========================================
// የሪፖርት መረጃ ማንበብ
// ==========================================

function getReports() {

    try {

        return JSON.parse(
            localStorage.getItem(REPORT_STORAGE)
        ) || [];

    } catch (error) {

        return [];

    }

}

// ==========================================
// ሪፖርት ማስቀመጥ
// ==========================================

function saveReports(reports) {

    localStorage.setItem(
        REPORT_STORAGE,
        JSON.stringify(reports)
    );

}

// ==========================================
// የታካሚ ሪፖርት
// ==========================================

function getPatientReport() {

    const patients =
        typeof getAllPatients === "function"
            ? getAllPatients()
            : [];

    return {

        total:
            patients.length,

        active:
            patients.length

    };

}

// ==========================================
// የዶክተር ሪፖርት
// ==========================================

function getDoctorReport() {

    const doctors =
        typeof getDoctors === "function"
            ? getDoctors()
            : [];

    const active =
        doctors.filter(
            doctor =>
                doctor.active === true
        );

    return {

        total:
            doctors.length,

        active:
            active.length,

        inactive:
            doctors.length -
            active.length

    };

}

// ==========================================
// የLab ሪፖርት
// ==========================================

function getLaboratoryReport() {

    const orders =
        typeof getLaboratoryOrders === "function"
            ? getLaboratoryOrders()
            : [];

    const completed =
        orders.filter(
            order =>
                order.status ===
                "ውጤት ተጠናቋል" ||
                order.status ===
                "ውጤት ወደ ዶክተር ተልኳል"
        );

    const pending =
        orders.filter(
            order =>
                order.status !==
                "ውጤት ተጠናቋል" &&
                order.status !==
                "ውጤት ወደ ዶክተር ተልኳል"
        );

    return {

        total:
            orders.length,

        completed:
            completed.length,

        pending:
            pending.length

    };

}

// ==========================================
// የPharmacy ሪፖርት
// ==========================================

function getPharmacyReport() {

    const prescriptions =
        typeof getPharmacyPrescriptions === "function"
            ? getPharmacyPrescriptions()
            : [];

    const dispensed =
        prescriptions.filter(
            prescription =>
                prescription.status ===
                "ተሰጥቷል"
        );

    const pending =
        prescriptions.filter(
            prescription =>
                prescription.status !==
                "ተሰጥቷል"
        );

    return {

        total:
            prescriptions.length,

        dispensed:
            dispensed.length,

        pending:
            pending.length

    };

}

// ==========================================
// የክፍያ ሪፖርት
// ==========================================

function getPaymentReport() {

    const payments =
        typeof getPayments === "function"
            ? getPayments()
            : [];

    const totalIncome =
        payments.reduce(
            (total, payment) =>
                total +
                Number(
                    payment.amount || 0
                ),
            0
        );

    const totalExpenses =
        typeof getTotalExpenses === "function"
            ? getTotalExpenses()
            : 0;

    return {

        totalPayments:
            payments.length,

        totalIncome:
            totalIncome,

        totalExpenses:
            totalExpenses,

        netIncome:
            totalIncome - totalExpenses,

        currency:
            "ብር"

    };

}

// ==========================================
// የዛሬ ሪፖርት
// ==========================================

function getTodayReport() {

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    const patients =
        typeof getAllPatients === "function"
            ? getAllPatients()
            : [];

    const payments =
        typeof getPayments === "function"
            ? getPayments()
            : [];

    const expenses =
        typeof getExpenses === "function"
            ? getExpenses()
            : [];

    const labs =
        typeof getLaboratoryOrders === "function"
            ? getLaboratoryOrders()
            : [];

    const prescriptions =
        typeof getPharmacyPrescriptions === "function"
            ? getPharmacyPrescriptions()
            : [];

    const todayPatients =
        patients.filter(
            patient =>
                patient.createdAt &&
                patient.createdAt
                    .split("T")[0] === today
        );

    const todayPayments =
        payments.filter(
            payment =>
                payment.date &&
                payment.date
                    .split("T")[0] === today
        );

    const todayExpenses =
        expenses.filter(
            expense =>
                expense.date &&
                expense.date
                    .split("T")[0] === today
        );

    const todayLabs =
        labs.filter(
            order =>
                order.createdAt &&
                order.createdAt
                    .split("T")[0] === today
        );

    const todayPrescriptions =
        prescriptions.filter(
            prescription =>
                prescription.date &&
                prescription.date
                    .split("T")[0] === today
        );

    const income =
        todayPayments.reduce(
            (total, payment) =>
                total +
                Number(
                    payment.amount || 0
                ),
            0
        );

    const expenseTotal =
        todayExpenses.reduce(
            (total, expense) =>
                total +
                Number(expense.amount || 0),
            0
        );

    return {

        date:
            today,

        patients:
            todayPatients.length,

        laboratory:
            todayLabs.length,

        pharmacy:
            todayPrescriptions.length,

        payments:
            todayPayments.length,

        income:
            income,

        expenses:
            expenseTotal,

        netIncome:
            income - expenseTotal,

        currency:
            "ብር"

    };

}

// ==========================================
// የወር ሪፖርት
// ==========================================

function getMonthlyReport(
    year,
    month
) {

    const currentDate =
        new Date();

    const selectedYear =
        Number(year) ||
        currentDate.getFullYear();

    const selectedMonth =
        Number(month) ||
        currentDate.getMonth() + 1;

    const patients =
        typeof getAllPatients === "function"
            ? getAllPatients()
            : [];

    const payments =
        typeof getPayments === "function"
            ? getPayments()
            : [];

    const labs =
        typeof getLaboratoryOrders === "function"
            ? getLaboratoryOrders()
            : [];

    const prescriptions =
        typeof getPharmacyPrescriptions === "function"
            ? getPharmacyPrescriptions()
            : [];

    function isSameMonth(dateValue) {

        if (!dateValue) {
            return false;
        }

        const date =
            new Date(dateValue);

        return (
            date.getFullYear() ===
                selectedYear &&
            date.getMonth() + 1 ===
                selectedMonth
        );

    }

    const monthlyPatients =
        patients.filter(
            patient =>
                isSameMonth(
                    patient.createdAt
                )
        );

    const monthlyPayments =
        payments.filter(
            payment =>
                isSameMonth(
                    payment.date
                )
        );

    const monthlyLabs =
        labs.filter(
            order =>
                isSameMonth(
                    order.createdAt
                )
        );

    const monthlyPrescriptions =
        prescriptions.filter(
            prescription =>
                isSameMonth(
                    prescription.date
                )
        );

    const income =
        monthlyPayments.reduce(
            (total, payment) =>
                total +
                Number(
                    payment.amount || 0
                ),
            0
        );

    return {

        year:
            selectedYear,

        month:
            selectedMonth,

        patients:
            monthlyPatients.length,

        payments:
            monthlyPayments.length,

        income:
            income,

        laboratory:
            monthlyLabs.length,

        pharmacy:
            monthlyPrescriptions.length,

        currency:
            "ብር"

    };

}

// ==========================================
// የዶክተር Visit ሪፖርት
// ==========================================

function getDoctorVisitReport(
    doctorId
) {

    const patients =
        typeof getAllPatients === "function"
            ? getAllPatients()
            : [];

    let visits = [];

    patients.forEach(
        patient => {

            const history =
                patient.history || [];

            history.forEach(
                item => {

                    if (
                        item.doctorId ===
                        doctorId
                    ) {

                        visits.push({

                            ...item,

                            patientId:
                                patient.id,

                            patientName:
                                patient.firstName +
                                " " +
                                patient.fatherName

                        });

                    }

                }
            );

        }
    );

    return visits;

}

// ==========================================
// ሁሉንም ሪፖርት በአንድ ጊዜ
// ==========================================

function getFullClinicReport() {

    return {

        generatedAt:
            new Date().toISOString(),

        patients:
            getPatientReport(),

        doctors:
            getDoctorReport(),

        laboratory:
            getLaboratoryReport(),

        pharmacy:
            getPharmacyReport(),

        payments:
            getPaymentReport(),

        today:
            getTodayReport()

    };

}

// ==========================================
// የሪፖርት ማጠቃለያ
// ==========================================

function getReportSummary() {

    const report =
        getFullClinicReport();

    return {

        "ጠቅላላ ታካሚ":
            report.patients.total,

        "ጠቅላላ ዶክተር":
            report.doctors.total,

        "ጠቅላላ Lab Order":
            report.laboratory.total,

        "ጠቅላላ Prescription":
            report.pharmacy.total,

        "ጠቅላላ ክፍያ":
            report.payments.totalPayments,

        "ጠቅላላ ገቢ":
            report.payments.totalIncome +
            " ብር",

        "ጠቅላላ ወጪ":
            report.payments.totalExpenses +
            " ብር",

        "ተጣራ ገቢ":
            report.payments.netIncome +
            " ብር"

    };

}

// ==========================================
// Dashboard ላይ የሪፖርት መረጃ
// ==========================================

function updateReportDashboard() {

    const report =
        getFullClinicReport();

    const patientElement =
        document.getElementById(
            "patientCount"
        );

    const doctorElement =
        document.getElementById(
            "doctorCount"
        );

    const labElement =
        document.getElementById(
            "labCount"
        );

    const pharmacyElement =
        document.getElementById(
            "pharmacyCount"
        );

    const paymentElement =
        document.getElementById(
            "paymentCount"
        );

    if (patientElement) {

        patientElement.textContent =
            report.patients.total;

    }

    if (doctorElement) {

        doctorElement.textContent =
            report.doctors.total;

    }

    if (labElement) {

        labElement.textContent =
            report.laboratory.total;

    }

    if (pharmacyElement) {

        pharmacyElement.textContent =
            report.pharmacy.total;

    }

    if (paymentElement) {

        paymentElement.textContent =
            report.payments.totalPayments;

    }

}

// ==========================================
// 📊 DISPLAY REPORTS PAGE
// ==========================================

// ==========================================
// 📅 ሙሉ የዕለት ሪፖርት (ለተመረጠ ቀን)
// ==========================================

function isoDatePart(value) {

    if (!value) {

        return "";

    }

    return String(value).split("T")[0];

}


function getDailyReport(dateObj) {

    const targetDate =
        dateObj instanceof Date
            ? dateObj
            : new Date();

    const targetIsoDate =
        targetDate.toISOString().split("T")[0];

    const patients =
        typeof getAllPatients === "function"
            ? getAllPatients()
            : [];

    const payments =
        typeof getPayments === "function"
            ? getPayments()
            : [];

    const expenses =
        typeof getExpenses === "function"
            ? getExpenses()
            : [];

    const labOrders =
        typeof getLaboratoryOrders === "function"
            ? getLaboratoryOrders()
            : [];

    const radiologyOrdersList =
        typeof getRadiologyOrders === "function"
            ? getRadiologyOrders()
            : [];

    const prescriptions =
        typeof getPharmacyPrescriptions === "function"
            ? getPharmacyPrescriptions()
            : [];

    const todaysPatients =
        patients.filter(
            function (patient) {

                return (
                    isoDatePart(patient.createdAt) ===
                    targetIsoDate
                );

            }
        );

    const todaysPayments =
        payments.filter(
            function (payment) {

                return (
                    isoDatePart(payment.date) ===
                    targetIsoDate
                );

            }
        );

    const todaysExpenses =
        expenses.filter(
            function (expense) {

                return (
                    isoDatePart(expense.date) ===
                    targetIsoDate
                );

            }
        );

    const todaysLabCompleted =
        labOrders.filter(
            function (order) {

                return (
                    order.completedAt &&
                    isoDatePart(order.completedAt) ===
                        targetIsoDate
                );

            }
        );

    const todaysRadiologyCompleted =
        radiologyOrdersList.filter(
            function (order) {

                return (
                    order.completedAt &&
                    isoDatePart(order.completedAt) ===
                        targetIsoDate
                );

            }
        );

    const todaysDispensed =
        prescriptions.filter(
            function (rx) {

                return (
                    rx.dispensedDate &&
                    isoDatePart(rx.dispensedDate) ===
                        targetIsoDate
                );

            }
        );

    /* ==========================================
       💰 ገቢ በአገልግሎት ዓይነት (ለያንዳንዱ ምክንያት ንኡስ ድምር)
    ========================================== */

    const incomeByService = {};

    todaysPayments.forEach(
        function (payment) {

            const key =
                payment.serviceName ||
                payment.serviceType ||
                "ያልታወቀ";

            if (!incomeByService[key]) {

                incomeByService[key] = 0;

            }

            incomeByService[key] +=
                Number(payment.amount || 0);

        }
    );

    const totalIncome =
        todaysPayments.reduce(
            function (sum, payment) {

                return (
                    sum + Number(payment.amount || 0)
                );

            },
            0
        );

    const totalExpenses =
        todaysExpenses.reduce(
            function (sum, expense) {

                return (
                    sum + Number(expense.amount || 0)
                );

            },
            0
        );

    return {

        dateObj:
            targetDate,

        dateLabel:
            formatEthiopianDate(targetDate),

        newPatients:
            todaysPatients.length,

        payments:
            todaysPayments,

        incomeByService:
            incomeByService,

        totalIncome:
            totalIncome,

        expenses:
            todaysExpenses,

        totalExpenses:
            totalExpenses,

        netIncome:
            totalIncome - totalExpenses,

        labCompleted:
            todaysLabCompleted.length,

        radiologyCompleted:
            todaysRadiologyCompleted.length,

        prescriptionsDispensed:
            todaysDispensed.length,

        currency:
            "ብር"

    };

}


let selectedReportDate =
    new Date();


function changeReportDate(deltaDays) {

    selectedReportDate =
        new Date(
            selectedReportDate.getTime() +
            deltaDays * 86400000
        );

    renderDailyReportSection();

}


function resetReportDateToToday() {

    selectedReportDate =
        new Date();

    renderDailyReportSection();

}


function renderDailyReportSection() {

    const box =
        document.getElementById(
            "dailyReportBox"
        );

    if (!box) {

        return;

    }

    const daily =
        getDailyReport(selectedReportDate);

    const serviceRows =
        Object.keys(daily.incomeByService)
            .map(
                function (key) {

                    return `
                        <tr>
                            <td>${escapeReportText(key)}</td>
                            <td style="text-align:left;">${daily.incomeByService[key]} ${escapeReportText(daily.currency)}</td>
                        </tr>
                    `;

                }
            ).join("");

    const expenseRows =
        daily.expenses.map(
            function (expense) {

                return `
                    <tr>
                        <td>${escapeReportText(expense.reason)}</td>
                        <td style="text-align:left;">${escapeReportText(expense.amount)} ${escapeReportText(daily.currency)}</td>
                    </tr>
                `;

            }
        ).join("");

    box.innerHTML = `

        <div class="report-print-header">

            <h2>
                የክሊኒክ ዕለታዊ ሪፖርት
            </h2>

            <h3>
                📅 ${escapeReportText(daily.dateLabel)}
            </h3>

        </div>

        <div class="no-print" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">

            <button onclick="changeReportDate(-1)">← የቀደመው ቀን</button>
            <button onclick="resetReportDateToToday()">🔄 ዛሬ</button>
            <button onclick="changeReportDate(1)">የሚቀጥለው ቀን →</button>
            <button onclick="window.print()" style="background:#063b2c;">🖨️ ሪፖርት አትም</button>

        </div>

        <div class="cards">

            <div class="card">
                <h3>👤 አዲስ ታካሚ</h3>
                <strong>${daily.newPatients}</strong>
            </div>

            <div class="card">
                <h3>🧪 የተጠናቀቀ ላብ</h3>
                <strong>${daily.labCompleted}</strong>
            </div>

            <div class="card">
                <h3>🩻 የተጠናቀቀ ራጅ</h3>
                <strong>${daily.radiologyCompleted}</strong>
            </div>

            <div class="card">
                <h3>💊 የተሰጠ መድሃኒት</h3>
                <strong>${daily.prescriptionsDispensed}</strong>
            </div>

        </div>

        <h3>
            💰 ገቢ በአገልግሎት ዓይነት
        </h3>

        ${
            serviceRows
            ? `
                <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
                    <thead>
                        <tr style="border-bottom:2px solid #0b5d45;">
                            <th style="text-align:right; padding:6px;">አገልግሎት</th>
                            <th style="text-align:left; padding:6px;">መጠን</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${serviceRows}
                    </tbody>
                </table>
            `
            : "<p>ዛሬ ምንም ክፍያ አልተመዘገበም።</p>"
        }

        <p><strong>ጠቅላላ ገቢ: ${daily.totalIncome} ${escapeReportText(daily.currency)}</strong></p>

        <hr>

        <h3>
            💸 ወጪ በምክንያት
        </h3>

        ${
            expenseRows
            ? `
                <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
                    <thead>
                        <tr style="border-bottom:2px solid #c0392b;">
                            <th style="text-align:right; padding:6px;">ምክንያት</th>
                            <th style="text-align:left; padding:6px;">መጠን</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expenseRows}
                    </tbody>
                </table>
            `
            : "<p>ዛሬ ምንም ወጪ አልተመዘገበም።</p>"
        }

        <p><strong>ጠቅላላ ወጪ: ${daily.totalExpenses} ${escapeReportText(daily.currency)}</strong></p>

        <hr>

        <h2>
            📈 ተጣራ ገቢ (ገቢ - ወጪ): ${daily.netIncome} ${escapeReportText(daily.currency)}
        </h2>

    `;

}


function displayReports() {

    const container =
        document.getElementById(
            "reportsContent"
        );

    if (!container) {

        return;

    }

    const report =
        getFullClinicReport();

    container.innerHTML = `

        <div class="no-print" style="margin-bottom:14px;">

            <button onclick="displayPhemReport()" style="background:#2f6fed;">
                📋 PHEM ሳምንታዊ ሪፖርት (ለወረዳ ጤና ጣቢያ)
            </button>

        </div>

        <div id="dailyReportBox"></div>

        <hr>

        <h2>
            📊 ከጅምሩ ጀምሮ እስከ አሁን ጠቅላላ ድምር
        </h2>

        <p style="color:#52606d; font-size:14px; margin-bottom:14px;">
            (ይህ ክሊኒኩ ከተከፈተ ጀምሮ እስከ ዛሬ ያለው ጠቅላላ ድምር ነው - የተለየ ቀን ለማየት ከላይ ያለውን ዕለታዊ ሪፖርት ይጠቀሙ)
        </p>

        <div class="cards">

            <div class="card">
                <h3>👤 ጠቅላላ የተመዘገበ ታካሚ</h3>
                <strong>${report.patients.total}</strong>
            </div>

            <div class="card">
                <h3>🩺 ጠቅላላ የተመዘገበ ዶክተር</h3>
                <strong>${report.doctors.total}</strong>
            </div>

            <div class="card">
                <h3>🧪 ጠቅላላ የላብ ትዕዛዝ ብዛት</h3>
                <strong>${report.laboratory.total}</strong>
            </div>

            <div class="card">
                <h3>💊 ጠቅላላ የመድሃኒት ማዘዣ ብዛት</h3>
                <strong>${report.pharmacy.total}</strong>
            </div>

            <div class="card">
                <h3>🧾 ጠቅላላ የተመዘገበ ክፍያ (ብዛት)</h3>
                <strong>${report.payments.totalPayments}</strong>
            </div>

            <div class="card">
                <h3>💵 ጠቅላላ ገቢ (ከጅምሩ)</h3>
                <strong>${report.payments.totalIncome} ${escapeReportText(report.payments.currency)}</strong>
            </div>

            <div class="card">
                <h3>💸 ጠቅላላ ወጪ (ከጅምሩ)</h3>
                <strong>${report.payments.totalExpenses} ${escapeReportText(report.payments.currency)}</strong>
            </div>

            <div class="card">
                <h3>📈 ጠቅላላ ተጣራ ገቢ (ገቢ - ወጪ)</h3>
                <strong>${report.payments.netIncome} ${escapeReportText(report.payments.currency)}</strong>
            </div>

        </div>

        <hr>

        <h2>
            🧪 ላቦራቶሪ ዝርዝር
        </h2>

        <p>
            ተጠናቋል: <strong>${report.laboratory.completed}</strong>
            &nbsp;|&nbsp;
            በመጠባበቅ ላይ: <strong>${report.laboratory.pending}</strong>
        </p>

        <h2>
            💊 ፋርማሲ ዝርዝር
        </h2>

        <p>
            ተሰጥቷል: <strong>${report.pharmacy.dispensed}</strong>
            &nbsp;|&nbsp;
            በመጠባበቅ ላይ: <strong>${report.pharmacy.pending}</strong>
        </p>

        <h2>
            🩺 ዶክተር ዝርዝር
        </h2>

        <p>
            ንቁ: <strong>${report.doctors.active}</strong>
            &nbsp;|&nbsp;
            ንቁ ያልሆነ: <strong>${report.doctors.inactive}</strong>
        </p>

        <h2>
            💸 የቅርብ ጊዜ ወጪዎች
        </h2>

        <div id="reportExpenseList"></div>

    `;

    renderReportExpenseList();

    renderDailyReportSection();

}


function renderReportExpenseList() {

    const box =
        document.getElementById("reportExpenseList");

    if (!box) {

        return;

    }

    const expenses =
        (
            typeof getExpenses === "function"
                ? getExpenses()
                : []
        )
        .slice()
        .sort(
            function (a, b) {

                return new Date(b.date) - new Date(a.date);

            }
        )
        .slice(0, 10);

    if (expenses.length === 0) {

        box.innerHTML = `<p>ምንም ወጪ አልተመዘገበም።</p>`;

        return;

    }

    box.innerHTML =
        expenses.map(
            function (expense) {

                return `
                    <div class="patient-item">
                        <h3>💸 ${escapeReportText(expense.amount)} ብር</h3>
                        <p><strong>ምክንያት:</strong> ${escapeReportText(expense.reason)}</p>
                        <p>🕒 ${formatEthiopianDateTime(expense.date)} — ${escapeReportText(expense.recordedBy)}</p>
                    </div>
                `;

            }
        ).join("");

}

// ==========================================
// 🛡️ SAFE TEXT
// ==========================================

function escapeReportText(value) {

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
// ገጹ ሲከፈት
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateReportDashboard();

    }
);