

/* ==========================================
   📋 PHEM ሳምንታዊ ሪፖርት (Weekly Report Format)
   ------------------------------------------
   Amhara Public Health Institute [APHI] -
   Public Health Emergency Management (PHEM)
   ወረቀት ላይ ያለውን ፎርም እንደወረደ በዲጂታል መልክ ያዘጋጃል።
   ሰራተኛው ከሶፍት ኮፒ እያየ ቁጥሮቹን ብቻ ይሞላል፣ ማተምም
   ይችላል።
========================================== */

const PHEM_FACILITY_STORAGE = "clinic_phem_facility";

const PHEM_REPORTS_STORAGE = "clinic_phem_reports";


/* ==========================================
   📑 SECTION 1 - Weekly reportable diseases/conditions
========================================== */

const PHEM_SECTION1_LEFT = [

    "የተመለከቱ ጠቅላላ ታካሚዎች ብዛት (Total patients seen)",

    "የወባ ጥርጣሬ ጉዳዮች (Malaria suspected cases)",

    "የተመረመሩ በማይክሮስኮፕ (BF)",

    "የተመረመሩ በ RDT",

    "ወባ (የተረጋገጠ እና ክሊኒካል)",

    "የተረጋገጠ የወባ ዓይነት - P. Falciparum",

    "የተረጋገጠ የወባ ዓይነት - P. Vivax",

    "የተረጋገጠ የወባ ዓይነት - Mixed",

    "የታከመ ወባ በዓይነት - P. Falciparum",

    "የታከመ ወባ በዓይነት - P. Vivax",

    "የታከመ ወባ በዓይነት - Mixed",

    "የወባ ዕድሜ ክልል - ከ5 ዓመት በታች",

    "የወባ ዕድሜ ክልል - 5-14 ዓመት",

    "የወባ ዕድሜ ክልል - 15 ዓመት እና በላይ",

    "ወባ በእርጉዝ ሴቶች ላይ",

    "ደም ያለበት ተቅማጥ (Bloody diarrhea)"

];


const PHEM_SECTION1_RIGHT = [

    "ቅማል/ጭማቂ (Scabies)",

    "የተመላሽ ትኩሳት (Relapsing Fever)",

    "SAM ከ5 ዓመት በታች ህጻናት (አዲስ)",

    "MAM ከ5 ዓመት በታች ህጻናት (አዲስ)",

    "MAM በአጥቢ/ነፍሰጡር እናቶች (አዲስ)",

    "ድርቀት ያለበት ተቅማጥ ከ5 ዓመት በታች ህጻናት",

    "ኤኤጄኤስ (AJS) በ14 ቀን ውስጥ",

    "ከባድ የሳምባ ምች ከ5 ዓመት በታች ህጻናት",

    "የስኳር በሽታ (አዲስ)",

    "አዲስ የተገኘ HIV",

    "ቲቢ (አዲስ)",

    "የደም ግፊት (አዲስ)",

    "የኬሚካል መመረዝ",

    "Visceral Leshmaniasis (VL)",

    "Cutaneous Leshmaniasis (CL)",

    "ጠቅላላ ሞት (All-cause mortality)"

];


/* ==========================================
   📑 SECTION 2 - Immediately notifiable diseases
   ------------------------------------------
   ማስታወሻ: ግልጽ ፎቶ ተልኮ ተረጋግጧል - ከወረቀቱ ጋር
   በትክክል ተመሳስሏል (16 ንጥሎች፣ በተመሳሳይ ቅደም ተከተል)።
========================================== */

const PHEM_SECTION2_LEFT = [

    "AFP/Polio (ልጅነት ልምሻ)",

    "አንትራክስ (Anthrax)",

    "ኮሌራ (Cholera)",

    "Dracunculiasis (Guinea worm)",

    "Chikungunya",

    "AEFI - ክትባት በኋላ የጎንዮሽ ጉዳት",

    "ኩፍኝ (Measles)",

    "Neonatal Tetanus (NNT)",

    "Human influenza (አዲስ ዓይነት)",

    "Human exposure to rabies (የውሻ/እንስሳት ንክሻ)",

    "Human rabies (የውሻ በሽታ)",

    "Dengue Fever",

    "SARS - ከባድ የመተንፈሻ አካል ኢንፌክሽን",

    "Smallpox (ፈንጣጣ)",

    "VHF - Viral Hemorrhagic Fever",

    "Yellow Fever (ቢጫ ወባ)"

];


const PHEM_SECTION2_RIGHT = [

    "COVID-19",

    "Mpox virus",

    "Rift Valley Fever",

    "Brucellosis",

    "የእናት ሞት (Maternal death)",

    "የወሊድ ሞት (Perinatal death)",

    "Obstetric fistula",

    "Pertussis",

    "ሌላ 1 (Specify)",

    "ሌላ 2 (Specify)",

    "ሌላ 3 (Specify)"

];


/* ==========================================
   💾 FACILITY INFO (ስም/ወረዳ/ዞን/ክልል - አንዴ ብቻ ይሞላል)
========================================== */

let phemFacilityCache =
    JSON.parse(
        localStorage.getItem(PHEM_FACILITY_STORAGE)
    ) || [];


function getPhemFacilityInfo() {

    return phemFacilityCache[0] || {

        id: "facility",

        name: "",

        woreda: "",

        zone: "",

        region: ""

    };

}


function savePhemFacilityInfo(info) {

    phemFacilityCache =
        [{

            id: "facility",

            name: info.name || "",

            woreda: info.woreda || "",

            zone: info.zone || "",

            region: info.region || ""

        }];

    localStorage.setItem(
        PHEM_FACILITY_STORAGE,
        JSON.stringify(phemFacilityCache)
    );

    if (
        typeof saveFirestoreCollection === "function"
    ) {

        saveFirestoreCollection("phemFacility");

    }

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "phemFacility",

        PHEM_FACILITY_STORAGE,

        function () {

            return phemFacilityCache;

        },

        function (newArray) {

            phemFacilityCache = newArray;

        },

        function () {}

    );

}


/* ==========================================
   💾 WEEKLY REPORTS
========================================== */

let phemReportsCache =
    JSON.parse(
        localStorage.getItem(PHEM_REPORTS_STORAGE)
    ) || [];


function getPhemReports() {

    return phemReportsCache;

}


function savePhemReports(list) {

    phemReportsCache =
        list;

    localStorage.setItem(
        PHEM_REPORTS_STORAGE,
        JSON.stringify(list)
    );

    if (
        typeof saveFirestoreCollection === "function"
    ) {

        saveFirestoreCollection("phemReports");

    }

}


if (
    typeof registerFirestoreSync === "function"
) {

    registerFirestoreSync(

        "phemReports",

        PHEM_REPORTS_STORAGE,

        function () {

            return phemReportsCache;

        },

        function (newArray) {

            phemReportsCache = newArray;

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


function createEmptyPhemRowData(items) {

    const data = {};

    items.forEach(
        function (label) {

            data[label] = {

                outpatient: 0,

                inpatient: 0,

                deaths: 0

            };

        }
    );

    return data;

}


function getOrCreatePhemReport(weekStart) {

    const list =
        getPhemReports();

    let report =
        list.find(
            function (r) {

                return r.weekStart === weekStart;

            }
        );

    if (report) {

        return report;

    }

    const weekEndDate =
        new Date(
            new Date(weekStart).getTime() +
            6 * 86400000
        );

    report = {

        id:
            "PHEM-" + weekStart,

        weekStart:
            weekStart,

        weekEnd:
            weekEndDate.toISOString().split("T")[0],

        epiWeek:
            "",

        section1:
            createEmptyPhemRowData(
                PHEM_SECTION1_LEFT.concat(PHEM_SECTION1_RIGHT)
            ),

        section2:
            createEmptyPhemRowData(
                PHEM_SECTION2_LEFT.concat(PHEM_SECTION2_RIGHT)
            ),

        eventNotification: {

            rumorsRegistered: 0,

            rumorsVerified3h: 0,

            rumorsInvestigated48h: 0,

            trueEvents: 0

        },

        malariaPrevention: {

            lsmEnvironmental: "",

            lsmLarvaciding: "",

            populationMale: 0,

            populationFemale: 0,

            healthEducationMale: 0,

            healthEducationFemale: 0,

            householdsVisited: 0,

            householdsWithLLINs: 0,

            householdsUsingLLINs: 0,

            rdtTest: 0,

            al3and4: 0,

            al1and2: 0,

            chloroquineTablet: 0,

            chloroquineSyrup: 0,

            primaquineTablet: 0,

            artesunateInj: 0

        },

        recommendations:
            "",

        sentBy:
            "",

        mobile:
            "",

        email:
            "",

        dateSent:
            "",

        createdAt:
            new Date().toISOString()

    };

    list.push(report);

    savePhemReports(list);

    return report;

}


/* ==========================================
   🔄 AUTO-FILL (ካሉት የክሊኒክ ውሂብ በራስ-ሰር ይሞላል)
========================================== */

function phemLocalDateKey(value) {

    if (!value) {

        return "";

    }

    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {

        return value;

    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (isNaN(date.getTime())) {

        return "";

    }

    return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
    );

}


function autoFillPhemReport(weekStart, weekEnd) {

    const patients =
        typeof getAllPatients === "function"
            ? getAllPatients()
            : [];

    function inWeek(value) {

        const key =
            phemLocalDateKey(value);

        return !!(
            key &&
            key >= weekStart &&
            key <= weekEnd
        );

    }

    /* የታዩ ታካሚዎች = በሳምንቱ ውስጥ ህክምና የተጠናቀቀላቸው (ልዩ ታካሚዎች)።
       የህክምና ምዝገባ ከሌለ (የድሮ ዳታ) እንደ ድሮው አዲስ የተመዘገቡትን ይቆጥራል። */
    const visited =
        patients.filter(
            function (patient) {

                return (
                    Array.isArray(patient.history) &&
                    patient.history.some(
                        function (entry) {

                            return (
                                entry.at &&
                                inWeek(entry.at)
                            );

                        }
                    )
                );

            }
        ).length;

    const registered =
        patients.filter(
            function (patient) {

                return inWeek(patient.createdAt);

            }
        ).length;

    const totalSeen =
        visited > 0
            ? visited
            : registered;

    const diagnosticRequests =
        typeof getDiagnosticRequests === "function"
            ? getDiagnosticRequests()
            : [];

    const malariaSuspected =
        diagnosticRequests.filter(
            function (request) {

                return (
                    inWeek(request.createdAt) &&
                    Array.isArray(request.labTests) &&
                    request.labTests.some(
                        function (test) {

                            return test === "Malaria";

                        }
                    )
                );

            }
        ).length;

    return {

        totalSeen: totalSeen,

        malariaSuspected: malariaSuspected

    };

}


/* ==========================================
   🛡️ SAFE TEXT
========================================== */

function escapePhemText(value) {

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
   📅 CURRENT WEEK (Monday-Sunday) HELPER
========================================== */

function getMondayOfCurrentWeek() {

    const today =
        new Date();

    const day =
        today.getDay();

    const diffToMonday =
        day === 0 ? -6 : 1 - day;

    const monday =
        new Date(
            today.getTime() +
            diffToMonday * 86400000
        );

    return monday.toISOString().split("T")[0];

}


/* ==========================================
   📋 MAIN ENTRY POINT - PHEM ገጽ
========================================== */

let phemCurrentWeekStart =
    getMondayOfCurrentWeek();


function displayPhemReport() {

    const container =
        document.getElementById(
            "reportsContent"
        );

    if (!container) {

        return;

    }

    const facility =
        getPhemFacilityInfo();

    container.innerHTML = `

        <button onclick="displayReports()" class="no-print">
            ← ወደ ሪፖርት ተመለስ
        </button>

        <h2>📋 PHEM ሳምንታዊ ሪፖርት</h2>

        <div class="no-print" style="background:#f8fafc; border:1px solid #d9e2ec; border-radius:8px; padding:14px; margin-bottom:16px;">

            <h3>የተቋም መረጃ (አንድ ጊዜ ብቻ ይሙሉ)</h3>

            <div class="clinic-form">

                <label>Health Facility Name</label>
                <input type="text" id="phemFacName" value="${escapePhemText(facility.name)}">

                <label>Woreda</label>
                <input type="text" id="phemFacWoreda" value="${escapePhemText(facility.woreda)}">

                <label>Zone</label>
                <input type="text" id="phemFacZone" value="${escapePhemText(facility.zone)}">

                <label>Region</label>
                <input type="text" id="phemFacRegion" value="${escapePhemText(facility.region)}">

                <button onclick="handleSavePhemFacility()">💾 የተቋም መረጃ አስቀምጥ</button>

            </div>

        </div>

        <div class="no-print" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">

            <button onclick="changePhemWeek(-7)">← ያለፈው ሳምንት</button>
            <button onclick="resetPhemWeekToToday()">🔄 የዚህ ሳምንት</button>
            <button onclick="changePhemWeek(7)">የሚቀጥለው ሳምንት →</button>
            <button onclick="handleAutoFillPhem()" style="background:#0b5d45;">🔄 ከውሂብ በራስ-ሰር ሙላ</button>
            <button onclick="window.print()" style="background:#063b2c;">🖨️ አትም</button>

        </div>

        <div id="phemReportFormBox"></div>

        <hr class="no-print">

        <h3 class="no-print">🗂️ ያለፉ ሳምንታት ሪፖርቶች</h3>

        <div id="phemHistoryBox" class="no-print"></div>

    `;

    renderPhemReportForm();

    renderPhemHistory();

}


function handleSavePhemFacility() {

    savePhemFacilityInfo({

        name: document.getElementById("phemFacName").value.trim(),

        woreda: document.getElementById("phemFacWoreda").value.trim(),

        zone: document.getElementById("phemFacZone").value.trim(),

        region: document.getElementById("phemFacRegion").value.trim()

    });

    alert("✅ ተቀምጧል።");

}


function changePhemWeek(deltaDays) {

    phemCurrentWeekStart =
        new Date(
            new Date(phemCurrentWeekStart).getTime() +
            deltaDays * 86400000
        ).toISOString().split("T")[0];

    renderPhemReportForm();

}


function resetPhemWeekToToday() {

    phemCurrentWeekStart =
        getMondayOfCurrentWeek();

    renderPhemReportForm();

}


function renderPhemRowsTable(items, sectionKey, report) {

    const rows =
        items.map(
            function (label, index) {

                const rowData =
                    report[sectionKey][label] || {
                        outpatient: 0,
                        inpatient: 0,
                        deaths: 0
                    };

                const idBase =
                    sectionKey + "-" + index;

                return `

                    <tr>
                        <td style="text-align:right; padding:6px; border-bottom:1px solid #e2e8f0;">
                            ${escapePhemText(label)}
                        </td>
                        <td style="padding:4px; border-bottom:1px solid #e2e8f0;">
                            <input type="number" min="0" id="phem-${idBase}-outpatient" value="${escapePhemText(rowData.outpatient)}" style="width:100%; min-height:36px;">
                        </td>
                        <td style="padding:4px; border-bottom:1px solid #e2e8f0;">
                            <input type="number" min="0" id="phem-${idBase}-inpatient" value="${escapePhemText(rowData.inpatient)}" style="width:100%; min-height:36px;">
                        </td>
                        <td style="padding:4px; border-bottom:1px solid #e2e8f0;">
                            <input type="number" min="0" id="phem-${idBase}-deaths" value="${escapePhemText(rowData.deaths)}" style="width:100%; min-height:36px;">
                        </td>
                    </tr>

                `;

            }
        ).join("");

    return `

        <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
            <thead>
                <tr style="background:#0b5d45; color:white;">
                    <th style="text-align:right; padding:6px;">Disease/Condition</th>
                    <th style="padding:6px;">Outpatient</th>
                    <th style="padding:6px;">Inpatient</th>
                    <th style="padding:6px;">Deaths</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>

    `;

}


function renderPhemReportForm() {

    const box =
        document.getElementById(
            "phemReportFormBox"
        );

    if (!box) {

        return;

    }

    const report =
        getOrCreatePhemReport(phemCurrentWeekStart);

    const facility =
        getPhemFacilityInfo();

    box.innerHTML = `

        <div class="report-print-header" style="text-align:center; margin-bottom:14px;">

            <h2>Amhara Public Health Institute [APHI]</h2>

            <p>Public Health Emergency Management (PHEM): Weekly Report Format (WRF)</p>

            <p>
                <strong>Health Facility:</strong> ${escapePhemText(facility.name)} |
                <strong>Woreda:</strong> ${escapePhemText(facility.woreda)} |
                <strong>Zone:</strong> ${escapePhemText(facility.zone)} |
                <strong>Region:</strong> ${escapePhemText(facility.region)}
            </p>

            <p>
                <strong>Week:</strong> Monday ${escapePhemText(report.weekStart)} to Sunday ${escapePhemText(report.weekEnd)}
            </p>

        </div>

        <div class="clinic-form">

            <label>Epi-Week Number</label>
            <input type="text" id="phemEpiWeek" value="${escapePhemText(report.epiWeek)}" placeholder="ለምሳሌ 51">

        </div>

        <h3>Weekly reportable diseases/conditions</h3>

        ${renderPhemRowsTable(PHEM_SECTION1_LEFT.concat(PHEM_SECTION1_RIGHT), "section1", report)}

        <h3>Immediately notifiable diseases/conditions</h3>

        ${renderPhemRowsTable(PHEM_SECTION2_LEFT.concat(PHEM_SECTION2_RIGHT), "section2", report)}

        <h3>III. Event notification and verification</h3>

        <div class="clinic-form">

            <label>Number of PHE rumors registered</label>
            <input type="number" min="0" id="phemRumorsRegistered" value="${escapePhemText(report.eventNotification.rumorsRegistered)}">

            <label>Number of PHE rumors verified within 3 hours</label>
            <input type="number" min="0" id="phemRumorsVerified3h" value="${escapePhemText(report.eventNotification.rumorsVerified3h)}">

            <label>Number of PHE rumors investigated within 48 hours</label>
            <input type="number" min="0" id="phemRumorsInvestigated48h" value="${escapePhemText(report.eventNotification.rumorsInvestigated48h)}">

            <label>Number of true events among notified PHE rumors</label>
            <input type="number" min="0" id="phemTrueEvents" value="${escapePhemText(report.eventNotification.trueEvents)}">

        </div>

        <h3>Malaria Prevention Activities and Commodity Stock Status</h3>

        <div class="clinic-form">

            <label>Larval Source Management - Environmental management in M2 (Drained+Filled+Cleared)</label>
            <input type="text" id="phemLsmEnv" value="${escapePhemText(report.malariaPrevention.lsmEnvironmental)}">

            <label>Larvaciding (Chemical spray in M2) (Sprayed+Cleared)</label>
            <input type="text" id="phemLsmLarv" value="${escapePhemText(report.malariaPrevention.lsmLarvaciding)}">

            <label>Population participated - Male</label>
            <input type="number" min="0" id="phemPopMale" value="${escapePhemText(report.malariaPrevention.populationMale)}">

            <label>Population participated - Female</label>
            <input type="number" min="0" id="phemPopFemale" value="${escapePhemText(report.malariaPrevention.populationFemale)}">

            <label>Health Education - Male</label>
            <input type="number" min="0" id="phemHealthEduMale" value="${escapePhemText(report.malariaPrevention.healthEducationMale)}">

            <label>Health Education - Female</label>
            <input type="number" min="0" id="phemHealthEduFemale" value="${escapePhemText(report.malariaPrevention.healthEducationFemale)}">

            <label>Number of visited Households</label>
            <input type="number" min="0" id="phemHouseholdsVisited" value="${escapePhemText(report.malariaPrevention.householdsVisited)}">

            <label>Number of households that have LLINs</label>
            <input type="number" min="0" id="phemHouseholdsWithLLINs" value="${escapePhemText(report.malariaPrevention.householdsWithLLINs)}">

            <label>Number of households that use LLINs</label>
            <input type="number" min="0" id="phemHouseholdsUsingLLINs" value="${escapePhemText(report.malariaPrevention.householdsUsingLLINs)}">

            <label>RDT (Test)</label>
            <input type="number" min="0" id="phemRdtTest" value="${escapePhemText(report.malariaPrevention.rdtTest)}">

            <label>AL (3*6 & 4*6) (Strip)</label>
            <input type="number" min="0" id="phemAl3and4" value="${escapePhemText(report.malariaPrevention.al3and4)}">

            <label>AL (1*6 & 2*6) (Strip)</label>
            <input type="number" min="0" id="phemAl1and2" value="${escapePhemText(report.malariaPrevention.al1and2)}">

            <label>Chloroquine Tablet (Strip)</label>
            <input type="number" min="0" id="phemChloroquineTablet" value="${escapePhemText(report.malariaPrevention.chloroquineTablet)}">

            <label>Chloroquine Syrup (Bottle)</label>
            <input type="number" min="0" id="phemChloroquineSyrup" value="${escapePhemText(report.malariaPrevention.chloroquineSyrup)}">

            <label>Primaquine Tablet (Strip)</label>
            <input type="number" min="0" id="phemPrimaquineTablet" value="${escapePhemText(report.malariaPrevention.primaquineTablet)}">

            <label>Artesunate (Inj)</label>
            <input type="number" min="0" id="phemArtesunateInj" value="${escapePhemText(report.malariaPrevention.artesunateInj)}">

        </div>

        <h3>Trends / Actions taken and Recommendations</h3>

        <textarea id="phemRecommendations" style="width:100%; min-height:80px;">${escapePhemText(report.recommendations)}</textarea>

        <h3>Sent Information</h3>

        <div class="clinic-form">

            <label>Date sent by HF</label>
            <input type="text" id="phemDateSent" value="${escapePhemText(report.dateSent)}" placeholder="DD/MM/YYYY">

            <label>Sent by (ስም)</label>
            <input type="text" id="phemSentBy" value="${escapePhemText(report.sentBy)}">

            <label>Mobile</label>
            <input type="text" id="phemMobile" value="${escapePhemText(report.mobile)}">

            <label>Email</label>
            <input type="text" id="phemEmail" value="${escapePhemText(report.email)}">

        </div>

        <button
            class="no-print"
            onclick="handleSavePhemReport()"
            style="background:#0b5d45; color:white; border:none; border-radius:8px; padding:13px 18px; font-size:16px; cursor:pointer; width:100%; margin-top:16px;"
        >
            💾 ሪፖርት አስቀምጥ
        </button>

    `;

}


function handleAutoFillPhem() {

    const report =
        getOrCreatePhemReport(phemCurrentWeekStart);

    const auto =
        autoFillPhemReport(
            report.weekStart,
            report.weekEnd
        );

    const totalSeenLabel =
        PHEM_SECTION1_LEFT[0];

    const malariaSuspectedLabel =
        PHEM_SECTION1_LEFT[1];

    const totalInput =
        document.getElementById(
            "phem-section1-0-outpatient"
        );

    if (totalInput) {

        totalInput.value =
            auto.totalSeen;

    }

    const malariaInput =
        document.getElementById(
            "phem-section1-1-outpatient"
        );

    if (malariaInput) {

        malariaInput.value =
            auto.malariaSuspected;

    }

    alert(
        "🔄 ተሞልቷል፦\n\n" +
        totalSeenLabel + ": " + auto.totalSeen +
        "\n" +
        malariaSuspectedLabel + ": " + auto.malariaSuspected +
        "\n\nሌሎቹን መስኮች እራስዎ ይሙሉ።"
    );

}


function readPhemRowsFromForm(items, sectionKey) {

    const data = {};

    items.forEach(
        function (label, index) {

            const idBase =
                sectionKey + "-" + index;

            const outpatientInput =
                document.getElementById(
                    "phem-" + idBase + "-outpatient"
                );

            const inpatientInput =
                document.getElementById(
                    "phem-" + idBase + "-inpatient"
                );

            const deathsInput =
                document.getElementById(
                    "phem-" + idBase + "-deaths"
                );

            data[label] = {

                outpatient:
                    Number(
                        outpatientInput ? outpatientInput.value : 0
                    ) || 0,

                inpatient:
                    Number(
                        inpatientInput ? inpatientInput.value : 0
                    ) || 0,

                deaths:
                    Number(
                        deathsInput ? deathsInput.value : 0
                    ) || 0

            };

        }
    );

    return data;

}


function handleSavePhemReport() {

    const list =
        getPhemReports();

    const index =
        list.findIndex(
            function (r) {

                return r.weekStart === phemCurrentWeekStart;

            }
        );

    if (index === -1) {

        return;

    }

    const report =
        list[index];

    report.epiWeek =
        document.getElementById("phemEpiWeek").value.trim();

    report.section1 =
        readPhemRowsFromForm(
            PHEM_SECTION1_LEFT.concat(PHEM_SECTION1_RIGHT),
            "section1"
        );

    report.section2 =
        readPhemRowsFromForm(
            PHEM_SECTION2_LEFT.concat(PHEM_SECTION2_RIGHT),
            "section2"
        );

    report.eventNotification = {

        rumorsRegistered:
            Number(document.getElementById("phemRumorsRegistered").value) || 0,

        rumorsVerified3h:
            Number(document.getElementById("phemRumorsVerified3h").value) || 0,

        rumorsInvestigated48h:
            Number(document.getElementById("phemRumorsInvestigated48h").value) || 0,

        trueEvents:
            Number(document.getElementById("phemTrueEvents").value) || 0

    };

    report.malariaPrevention = {

        lsmEnvironmental:
            document.getElementById("phemLsmEnv").value.trim(),

        lsmLarvaciding:
            document.getElementById("phemLsmLarv").value.trim(),

        populationMale:
            Number(document.getElementById("phemPopMale").value) || 0,

        populationFemale:
            Number(document.getElementById("phemPopFemale").value) || 0,

        healthEducationMale:
            Number(document.getElementById("phemHealthEduMale").value) || 0,

        healthEducationFemale:
            Number(document.getElementById("phemHealthEduFemale").value) || 0,

        householdsVisited:
            Number(document.getElementById("phemHouseholdsVisited").value) || 0,

        householdsWithLLINs:
            Number(document.getElementById("phemHouseholdsWithLLINs").value) || 0,

        householdsUsingLLINs:
            Number(document.getElementById("phemHouseholdsUsingLLINs").value) || 0,

        rdtTest:
            Number(document.getElementById("phemRdtTest").value) || 0,

        al3and4:
            Number(document.getElementById("phemAl3and4").value) || 0,

        al1and2:
            Number(document.getElementById("phemAl1and2").value) || 0,

        chloroquineTablet:
            Number(document.getElementById("phemChloroquineTablet").value) || 0,

        chloroquineSyrup:
            Number(document.getElementById("phemChloroquineSyrup").value) || 0,

        primaquineTablet:
            Number(document.getElementById("phemPrimaquineTablet").value) || 0,

        artesunateInj:
            Number(document.getElementById("phemArtesunateInj").value) || 0

    };

    report.recommendations =
        document.getElementById("phemRecommendations").value.trim();

    report.dateSent =
        document.getElementById("phemDateSent").value.trim();

    report.sentBy =
        document.getElementById("phemSentBy").value.trim();

    report.mobile =
        document.getElementById("phemMobile").value.trim();

    report.email =
        document.getElementById("phemEmail").value.trim();

    savePhemReports(list);

    alert(
        "✅ ሳምንታዊ ሪፖርቱ ተቀምጧል።"
    );

    renderPhemHistory();

}


function renderPhemHistory() {

    const box =
        document.getElementById(
            "phemHistoryBox"
        );

    if (!box) {

        return;

    }

    const reports =
        getPhemReports()
            .slice()
            .sort(
                function (a, b) {

                    return (
                        new Date(b.weekStart) -
                        new Date(a.weekStart)
                    );

                }
            );

    if (reports.length === 0) {

        box.innerHTML = `
            <p>እስካሁን የተቀመጠ ሳምንታዊ ሪፖርት የለም።</p>
        `;

        return;

    }

    box.innerHTML =
        reports.map(
            function (report) {

                return `

                    <div class="patient-item">

                        <p>
                            <strong>ሳምንት:</strong>
                            ${escapePhemText(report.weekStart)} - ${escapePhemText(report.weekEnd)}
                            ${
                                report.epiWeek
                                ? " (Epi-Week " + escapePhemText(report.epiWeek) + ")"
                                : ""
                            }
                        </p>

                        <button onclick="handleOpenPhemWeek('${escapePhemText(report.weekStart)}')">
                            👁️ ክፈት
                        </button>

                    </div>

                `;

            }
        ).join("");

}


function handleOpenPhemWeek(weekStart) {

    phemCurrentWeekStart =
        weekStart;

    renderPhemReportForm();

    window.scrollTo(0, 0);

}