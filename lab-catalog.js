
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
            { name: "WBC", range: "" },
            { name: "RBC", range: "" },
            { name: "Casts", range: "" }

        ]

    },

    {

        category: "STOOL EXAM",

        tests: [

            { name: "Consistency", range: "" },
            { name: "OBT", range: "" },
            { name: "WBC", range: "" },
            { name: "RBC", range: "" }

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