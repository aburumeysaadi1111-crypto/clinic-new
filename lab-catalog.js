
/* ==========================================
   🧪 LABORATORY TEST CATALOG
   ------------------------------------------
   ልክ እንደ ክሊኒኩ ወረቀት (Laboratory Request Form)
   በምድብ (category) እና በመደበኛ መጠን (Normal Range)
   የተደራጀ የምርመራ ዝርዝር።
========================================== */

const LAB_TEST_CATALOG = [

    {

        category: "HEMATOLOGY",

        tests: [

            { name: "CBC", range: "" },
            { name: "Diff %", range: "" },
            { name: "Gran %", range: "" },
            { name: "Lymph %", range: "" },
            { name: "Mid %", range: "" },
            { name: "Hgb", range: "" },
            { name: "Hct", range: "" },
            { name: "ESR", range: "" },
            { name: "Blood Group & Rh", range: "" },
            { name: "Blood film", range: "" }

        ]

    },

    {

        category: "CHEMISTRY",

        tests: [

            { name: "FBS", range: "65-115 mg/dL" },
            { name: "RBS", range: "" },
            { name: "Hgb A-1C", range: "4.0-5.6% Norm, ≥6.5% DM" },
            { name: "SGOT", range: "Up to 40 u/L" },
            { name: "SGPT", range: "Up to 40 u/L" },
            { name: "Bilirubin (T)", range: "Up to 1.1 mg/dl" },
            { name: "Bilirubin (D)", range: "0.2 mg/dl" },
            { name: "Urea/Bun", range: "14-40 mg/dl" },
            { name: "Creatinine", range: "0.5-1.2 mg/dL" },
            { name: "Uric acid", range: "2.4-7.0 mg/dL" },
            { name: "Total Cholesterol", range: "Up to 220 mg/dL" },
            { name: "Total protein", range: "65-80 mg/dl" },
            { name: "Albumin", range: "3.5-5.5 mg/dl" },
            { name: "Triglyceride", range: "< 150 mg/dL" },
            { name: "LDL", range: "100-160 mg/dl" },
            { name: "HDL", range: "≥ 40 mg/dl" }

        ]

    },

    {

        category: "URINALYSIS",

        tests: [

            { name: "Color", range: "" },
            { name: "PH", range: "" },
            { name: "SG", range: "" },
            { name: "Protein", range: "" },
            { name: "Sugar", range: "" },
            { name: "Ketone", range: "" },
            { name: "Bilirubin", range: "" },
            { name: "Urobilinogen", range: "" },
            { name: "Blood", range: "" },
            { name: "Leukocyte", range: "" },
            { name: "Nitrite (NIT)", range: "" }

        ]

    },

    {

        category: "MICROSCOPY",

        tests: [

            { name: "Epithelial Cells", range: "" },
            { name: "WBC (Urine)", range: "" },
            { name: "RBC (Urine)", range: "" },
            { name: "Casts", range: "" }

        ]

    },

    {

        category: "STOOL EXAM",

        tests: [

            { name: "Consistency", range: "" },
            { name: "OBT", range: "" },
            { name: "WBC (Stool)", range: "" },
            { name: "RBC (Stool)", range: "" }

        ]

    },

    {

        category: "SEROLOGY",

        tests: [

            { name: "Widal H-Ag", range: "" },
            { name: "Widal O-Ag", range: "" },
            { name: "Weil Felix", range: "" },
            { name: "Rheumatic factor", range: "" },
            { name: "VDRL", range: "" },
            { name: "HBs Ag", range: "" },
            { name: "HCV Ag", range: "" },
            { name: "HIV-1/2", range: "" },
            { name: "H.pylori Ab", range: "" },
            { name: "B-HCG", range: "" }

        ]

    },

    {

        category: "BACTERIOLOGY",

        tests: [

            { name: "KOH", range: "" },
            { name: "Gram Stain", range: "" },
            { name: "Wet film", range: "" },
            { name: "VCT/PITC", range: "" },
            { name: "AFB - 1st", range: "" },
            { name: "AFB - 2nd", range: "" },
            { name: "AFB - 3rd", range: "" },
            { name: "H.pylori stool Ag", range: "" }

        ]

    },

    {

        category: "MALARIA / ሌላ",

        tests: [

            { name: "Malaria", range: "" },
            { name: "Pregnancy Test", range: "" }

        ]

    }

];


/* ==========================================
   💾 CUSTOM (ተጨማሪ) ላብ ምርመራዎች
========================================== */

function getCustomLabTests2() {

    try {

        return (
            JSON.parse(
                localStorage.getItem(
                    "clinicCustomLabTests"
                )
            ) || []
        );

    } catch (error) {

        return [];

    }

}


/* ==========================================
   🧪 ሙሉ የላብ ካታሎግ (ደረጃ + custom)
========================================== */

function getFullLabCatalog() {

    const custom =
        getCustomLabTests2();

    if (custom.length === 0) {

        return LAB_TEST_CATALOG;

    }

    return [

        ...LAB_TEST_CATALOG,

        {

            category: "ተጨማሪ (Custom)",

            tests:
                custom.map(
                    function (name) {

                        return {
                            name: name,
                            range: ""
                        };

                    }
                )

        }

    ];

}


function findLabTestRange(testName) {

    for (const group of LAB_TEST_CATALOG) {

        const match =
            group.tests.find(
                function (test) {

                    return test.name === testName;

                }
            );

        if (match) {

            return match.range;

        }

    }

    return "";

}


/* ==========================================
   🧬 TEST META (ውጤት ሲገባ ቀላል እንዲሆን)
   ------------------------------------------
   options  → ከዝርዝር ይመረጣል (መጻፍ አያስፈልግም)
   low/high → ቁጥር ከመደበኛ ክልል ውጪ ከሆነ ራሱ ምልክት ያደርጋል
   ሌላው ሁሉ (እና ሀኪሙ የጨመራቸው) በነጻ ጽሑፍ ይሞላል።
========================================== */

const LAB_POS_NEG = ["Negative", "Positive"];

const LAB_GRADE = ["Negative", "Trace", "+1", "+2", "+3", "+4"];

const LAB_TEST_META = {

    "Blood Group & Rh": {
        options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    },

    "FBS": { low: 65, high: 115, unit: "mg/dL" },
    "Hgb A-1C": { high: 5.6, unit: "%" },
    "SGOT": { high: 40, unit: "u/L" },
    "SGPT": { high: 40, unit: "u/L" },
    "Bilirubin (T)": { high: 1.1, unit: "mg/dl" },
    "Bilirubin (D)": { high: 0.2, unit: "mg/dl" },
    "Urea/Bun": { low: 14, high: 40, unit: "mg/dl" },
    "Creatinine": { low: 0.5, high: 1.2, unit: "mg/dL" },
    "Uric acid": { low: 2.4, high: 7.0, unit: "mg/dL" },
    "Total Cholesterol": { high: 220, unit: "mg/dL" },
    "Albumin": { low: 3.5, high: 5.5, unit: "" },
    "Triglyceride": { high: 150, strictHigh: true, unit: "mg/dL" },
    "LDL": { low: 100, high: 160, unit: "mg/dl" },
    "HDL": { low: 40, unit: "mg/dl" },

    "Color": {
        options: ["Pale yellow", "Yellow", "Dark yellow", "Amber", "Red", "Brown", "Turbid"]
    },
    "Protein": { options: LAB_GRADE },
    "Sugar": { options: LAB_GRADE },
    "Ketone": { options: LAB_GRADE },
    "Bilirubin": { options: LAB_GRADE },
    "Blood": { options: LAB_GRADE },
    "Leukocyte": { options: LAB_GRADE },
    "Urobilinogen": { options: ["Normal", "+1", "+2", "+3", "+4"] },
    "Nitrite (NIT)": { options: LAB_POS_NEG },

    "Consistency": {
        options: ["Formed", "Semi-formed", "Loose", "Watery", "Hard", "Mucoid", "Bloody"]
    },
    "OBT": { options: LAB_POS_NEG },

    "Widal H-Ag": { options: ["Negative", "1:20", "1:40", "1:80", "1:160", "1:320"] },
    "Widal O-Ag": { options: ["Negative", "1:20", "1:40", "1:80", "1:160", "1:320"] },
    "Weil Felix": { options: LAB_POS_NEG },
    "Rheumatic factor": { options: LAB_POS_NEG },
    "VDRL": { options: LAB_POS_NEG },
    "HBs Ag": { options: LAB_POS_NEG },
    "HCV Ag": { options: LAB_POS_NEG },
    "HIV-1/2": { options: LAB_POS_NEG },
    "H.pylori Ab": { options: LAB_POS_NEG },
    "B-HCG": { options: LAB_POS_NEG },

    "KOH": { options: LAB_POS_NEG },
    "VCT/PITC": { options: LAB_POS_NEG },
    "AFB - 1st": { options: ["Negative", "Scanty", "+1", "+2", "+3"] },
    "AFB - 2nd": { options: ["Negative", "Scanty", "+1", "+2", "+3"] },
    "AFB - 3rd": { options: ["Negative", "Scanty", "+1", "+2", "+3"] },
    "H.pylori stool Ag": { options: LAB_POS_NEG },

    "Malaria": {
        options: ["Negative", "P. falciparum", "P. vivax", "Mixed (Pf + Pv)"]
    },
    "Pregnancy Test": { options: LAB_POS_NEG }

};


function getLabTestMeta(testName) {

    return LAB_TEST_META[testName] || null;

}


function findLabTestCategory(testName) {

    for (const group of LAB_TEST_CATALOG) {

        const match =
            group.tests.some(
                function (test) {

                    return test.name === testName;

                }
            );

        if (match) {

            return group.category;

        }

    }

    return "";

}


/* "high" | "low" | "" (ክልል ውስጥ ወይም ቁጥር ካልሆነ) */
function evaluateLabValue(testName, rawValue) {

    const meta =
        getLabTestMeta(testName);

    if (
        !meta ||
        (meta.low === undefined && meta.high === undefined)
    ) {

        return "";

    }

    const number =
        parseFloat(
            String(rawValue || "")
                .replace(",", ".")
        );

    if (isNaN(number)) {

        return "";

    }

    if (
        meta.low !== undefined &&
        number < meta.low
    ) {

        return "low";

    }

    if (
        meta.high !== undefined &&
        (
            number > meta.high ||
            (meta.strictHigh && number >= meta.high)
        )
    ) {

        return "high";

    }

    return "";

}
