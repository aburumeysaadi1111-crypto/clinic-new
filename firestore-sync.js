
/* ==========================================
   🔄 FIRESTORE REAL-TIME SYNC ENGINE
   ------------------------------------------
   ይህ ፋይል ውሂቡ በብዙ ስልኮች/ኮምፒውተሮች መካከል በቀጥታ
   (real-time) እንዲጋራ ያደርጋል። እያንዳንዱ ለውጥ
   (ታካሚ ተመዘገበ፣ ክፍያ ተከፈለ፣ የላብ ውጤት ገባ...) ወደ
   Firebase ተልኮ በሌላ ስልክ ላይ ወዲያውኑ ይታያል።

   ማስታወሻ: localStorage አሁንም እንደ "ፈጣን cache"
   (ኢንተርኔት ቢቋረጥ እንኳ ገጹ ባዶ እንዳይሆን) ጥቅም ላይ
   ይውላል፣ ግን Firestore ነው እውነተኛው/ዋናው ምንጭ።
========================================== */

/* ==========================================
   📋 የSync ስብስቦች ዝርዝር
   ------------------------------------------
   collectionName -> {
       storageKey: localStorage key (ለfallback cache)
       getArray: የአሁኑን in-memory array የሚመልስ function
       setArray: አዲስ array ተቀብሎ የሚያስቀምጥ function
       onChange: (optional) array ከተቀየረ በኋላ የሚጠራ function
   }
========================================== */

const FIRESTORE_SYNC_REGISTRY = {};


function registerFirestoreSync(
    collectionName,
    storageKey,
    getArrayFn,
    setArrayFn,
    onChangeFn
) {

    FIRESTORE_SYNC_REGISTRY[collectionName] = {

        storageKey: storageKey,

        getArray: getArrayFn,

        setArray: setArrayFn,

        onChange: onChangeFn || function () {},

        unsubscribe: null

    };

}


/* ==========================================
   🆔 የክሊኒኩ Firestore Path
========================================== */

function getClinicDataCollectionRef(collectionName) {

    if (!firestoreDb) {

        return null;

    }

    const clinicId =
        getClinicBackupId();

    return firestoreDb
        .collection("clinicData")
        .doc(clinicId)
        .collection(collectionName);

}


/* ==========================================
   🧮 ረዳት ተግባራት (ለውጥ ብቻ ለመላክ)
   ------------------------------------------
   ⚠️ ድሮ፦ እያንዳንዱ ማስቀመጥ ሙሉውን ዝርዝር (ለምሳሌ 2000 ታካሚ)
   ይልክ ነበር፤ ይህ የ Firestore ነጻ ገደብ (በቀን 20,000 መጻፍ)
   በፍጥነት ያልቃል፣ እና አንድ batch ከ500 በላይ መጻፍ ስለማይችል
   ከ500 ታካሚ በኋላ ማመሳሰሉ ይቆም ነበር። አሁን፦
     1) የተቀየሩት ሰነዶች ብቻ ይላካሉ፣
     2) በ400 ቁርጥራጭ ይከፈላሉ፣
     3) መግቢያው (auth) እስኪጠናቀቅ ይጠበቃል።
========================================== */

const FIRESTORE_BATCH_SIZE = 400;

const FIRESTORE_LAST_SYNCED = {};

const FIRESTORE_SYNC_QUEUE = {};

function getLastSynced(collectionName) {

    if (!FIRESTORE_LAST_SYNCED[collectionName]) {

        FIRESTORE_LAST_SYNCED[collectionName] =
            new Map();

    }

    return FIRESTORE_LAST_SYNCED[collectionName];

}

function stableStringify(value) {

    if (value === null || typeof value !== "object") {

        return JSON.stringify(value);

    }

    if (Array.isArray(value)) {

        return "[" + value.map(stableStringify).join(",") + "]";

    }

    return (
        "{" +
        Object.keys(value).sort().map(
            function (k) {

                return JSON.stringify(k) + ":" + stableStringify(value[k]);

            }
        ).join(",") +
        "}"
    );

}

function cleanForFirestore(item) {

    /* undefined እሴቶችን ያስወግዳል (Firestore አይቀበላቸውም) */
    return JSON.parse(JSON.stringify(item));

}

function rebuildLastSynced(collectionName, serverItems) {

    const last =
        getLastSynced(collectionName);

    last.clear();

    serverItems.forEach(
        function (item) {

            last.set(
                String(item.id),
                stableStringify(item)
            );

        }
    );

}

/* አካባቢያዊ ዝርዝሩን ከአገልጋዩ ጋር ያዋህዳል፦ ገና ያልተላከ የራስ ለውጥ ይጠበቃል */
function mergeSnapshotWithLocal(collectionName, serverItems, localArray) {

    const last =
        getLastSynced(collectionName);

    const merged =
        new Map();

    serverItems.forEach(
        function (item) {

            merged.set(String(item.id), item);

        }
    );

    let hasUnsynced = false;

    (Array.isArray(localArray) ? localArray : []).forEach(
        function (item) {

            if (!item || typeof item !== "object") {

                return;

            }

            const id =
                String(item.id);

            const lastKey =
                last.get(id);

            const localKey =
                stableStringify(cleanForFirestore(item));

            if (lastKey === undefined || lastKey !== localKey) {

                merged.set(id, item);

                hasUnsynced = true;

            }

        }
    );

    return {
        items: Array.from(merged.values()),
        hasUnsynced: hasUnsynced
    };

}


/* ==========================================
   📤 UPSERT (LOCAL ARRAY → FIRESTORE)
   ------------------------------------------
   ⚠️ ደህንነት: ይህ ፋንክሽን የተቀየሩትን ብቻ ይጽፋል
   (ይጨምራል/ያዘምናል) - በ"ይህ ID የለም ስለዚህ
   አጥፋው" ግምት ላይ ተመስርቶ ምንም አያጠፋም። ሁለት መሳሪያዎች
   በአንድ ጊዜ የተለያዩ አዲስ ነገሮች ቢጨምሩ አንዱ የሌላውን
   ስራ እንዳያጠፋ ለመከላከል ነው። እውነተኛ መሰረዝ
   deleteFirestoreDoc() በቀጥታ ይጠራል።
========================================== */

function syncArrayToFirestore(
    collectionName,
    array
) {

    const previous =
        FIRESTORE_SYNC_QUEUE[collectionName] ||
        Promise.resolve();

    const next =
        previous.then(
            function () {

                return runArraySync(
                    collectionName,
                    array
                );

            }
        ).catch(
            function (error) {

                console.error(
                    "Firestore sync error (" +
                    collectionName +
                    "):",
                    error
                );

            }
        );

    FIRESTORE_SYNC_QUEUE[collectionName] =
        next;

    return next;

}

async function runArraySync(
    collectionName,
    array
) {

    if (
        typeof isFirebaseConfigured !== "function" ||
        !isFirebaseConfigured()
    ) {

        return;

    }

    if (
        typeof initFirebaseBackup !== "function" ||
        !initFirebaseBackup()
    ) {

        return;

    }

    if (!(await waitForFirebaseAuth())) {

        return;

    }

    const collRef =
        getClinicDataCollectionRef(collectionName);

    if (!collRef) {

        return;

    }

    const last =
        getLastSynced(collectionName);

    const changed = [];

    (Array.isArray(array) ? array : []).forEach(
        function (item) {

            if (!item || typeof item !== "object") {

                return;

            }

            const clean =
                cleanForFirestore(item);

            const key =
                stableStringify(clean);

            const id =
                String(item.id);

            if (last.get(id) !== key) {

                changed.push({ id: id, clean: clean, key: key });

            }

        }
    );

    for (let i = 0; i < changed.length; i += FIRESTORE_BATCH_SIZE) {

        const slice =
            changed.slice(i, i + FIRESTORE_BATCH_SIZE);

        const batch =
            firestoreDb.batch();

        slice.forEach(
            function (c) {

                batch.set(
                    collRef.doc(c.id),
                    c.clean
                );

            }
        );

        await batch.commit();

        slice.forEach(
            function (c) {

                last.set(c.id, c.key);

            }
        );

    }

}


/* ==========================================
   🗑️ DELETE ONE DOCUMENT (ትክክለኛ/ግልጽ ጥያቄ ብቻ)
   ------------------------------------------
   ይህ የሚጠራው የተለየ record ላይ deliberate deletion
   ተፈጽሞ ከሆነ ብቻ ነው (ለምሳሌ deletePatient) -
   ከ array diff በራስ-ሰር አይገመትም።
========================================== */

async function deleteFirestoreDoc(
    collectionName,
    docId
) {

    if (
        typeof isFirebaseConfigured !== "function" ||
        !isFirebaseConfigured()
    ) {

        return;

    }

    if (
        typeof initFirebaseBackup !== "function" ||
        !initFirebaseBackup()
    ) {

        return;

    }

    try {

        if (!(await waitForFirebaseAuth())) {

            return;

        }

        const collRef =
            getClinicDataCollectionRef(collectionName);

        if (!collRef) {

            return;

        }

        await collRef.doc(String(docId)).delete();

        getLastSynced(collectionName).delete(String(docId));

    } catch (error) {

        console.error(
            "Firestore delete error (" +
            collectionName +
            "):",
            error
        );

    }

}


/* ==========================================
   💾 SAVE ONE COLLECTION (localStorage + Firestore)
   ------------------------------------------
   registerFirestoreSync ካደረግንለት collection ውስጥ
   አንዱን ለማስቀመጥ ይህን እንጠቀማለን - ሁለቱንም (ፈጣን local
   cache + Firestore) ያዘምናል።
========================================== */

function saveFirestoreCollection(collectionName) {

    const entry =
        FIRESTORE_SYNC_REGISTRY[collectionName];

    if (!entry) {

        return;

    }

    const array =
        entry.getArray();

    localStorage.setItem(
        entry.storageKey,
        JSON.stringify(array)
    );

    syncArrayToFirestore(
        collectionName,
        array
    );

}


/* ==========================================
   👂 START LIVE LISTENERS (ሁሉንም collections)
========================================== */

async function startFirestoreSync() {

    if (
        typeof isFirebaseConfigured !== "function" ||
        !isFirebaseConfigured()
    ) {

        return;

    }

    if (
        typeof initFirebaseBackup !== "function" ||
        !initFirebaseBackup()
    ) {

        return;

    }

    /* ደንቡ መግባትን ስለሚጠይቅ መጀመሪያ መግቢያው መጠናቀቅ አለበት */
    if (!(await waitForFirebaseAuth())) {

        return;

    }

    Object.keys(FIRESTORE_SYNC_REGISTRY).forEach(
        function (collectionName) {

            const entry =
                FIRESTORE_SYNC_REGISTRY[collectionName];

            if (entry.unsubscribe) {

                return;

            }

            const collRef =
                getClinicDataCollectionRef(collectionName);

            if (!collRef) {

                return;

            }

            let isFirstSnapshot =
                true;

            entry.unsubscribe =
                collRef.onSnapshot(
                    function (snapshot) {

                        const meta =
                            snapshot.metadata || {};

                        const items =
                            snapshot.docs.map(
                                function (doc) {

                                    return doc.data();

                                }
                            );

                        /* የመጀመሪያው snapshot ከስልኩ cache ብቻ ሆኖ ባዶ ከሆነ
                           የአገልጋዩን መልስ እንጠብቃለን (ባዶ ነው ብለን
                           ውሂብ እንዳንጥል/እንዳንዘራ) */
                        if (
                            isFirstSnapshot &&
                            meta.fromCache &&
                            items.length === 0
                        ) {

                            return;

                        }

                        /* ==========================================
                           ⚠️ ደህንነት: ይህ የመጀመሪያው snapshot ከሆነ እና
                           Firestore ባዶ ሆኖ ካገኘነው (ገና ማንም ይህን
                           collection ወደ Firestore አልላከውም ማለት
                           ነው)፣ ነገር ግን ይህ መሳሪያ አስቀድሞ የራሱ ውሂብ
                           ካለው (localStorage) - ያንን ውሂብ አናጥፋም!
                           ይልቁን ወደ Firestore እንልካለን (እንዘራለን)።
                        ========================================== */

                        if (
                            isFirstSnapshot &&
                            items.length === 0 &&
                            entry.getArray().length > 0
                        ) {

                            isFirstSnapshot = false;

                            syncArrayToFirestore(
                                collectionName,
                                entry.getArray()
                            );

                            return;

                        }

                        let finalItems =
                            items;

                        let needPush =
                            false;

                        /* ከመጀመሪያው በኋላ፦ ገና ያልተላከ የራስ ለውጥ እንዳይጠፋ ያዋህዳል */
                        if (!isFirstSnapshot) {

                            const merged =
                                mergeSnapshotWithLocal(
                                    collectionName,
                                    items,
                                    entry.getArray()
                                );

                            finalItems =
                                merged.items;

                            needPush =
                                merged.hasUnsynced;

                        }

                        isFirstSnapshot = false;

                        rebuildLastSynced(
                            collectionName,
                            items
                        );

                        entry.setArray(finalItems);

                        localStorage.setItem(
                            entry.storageKey,
                            JSON.stringify(finalItems)
                        );

                        entry.onChange();

                        if (needPush) {

                            syncArrayToFirestore(
                                collectionName,
                                finalItems
                            );

                        }

                    },
                    function (error) {

                        console.error(
                            "Firestore listener error (" +
                            collectionName +
                            "):",
                            error
                        );

                        /* እንደገና መሞከር እንዲቻል */
                        entry.unsubscribe = null;

                    }
                );

        }
    );

}

/* ኢንተርኔት ሲመለስ፣ ያልጀመሩ ማዳመጫዎችን እንደገና ይጀምራል */
if (typeof window !== "undefined" && window.addEventListener) {

    window.addEventListener(
        "online",
        function () {

            if (
                typeof isLoggedIn === "function" &&
                isLoggedIn()
            ) {

                startFirestoreSync();

            }

        }
    );

}


/* ==========================================
   🛑 STOP LIVE LISTENERS (logout ላይ)
========================================== */

function stopFirestoreSync() {

    Object.keys(FIRESTORE_SYNC_REGISTRY).forEach(
        function (collectionName) {

            const entry =
                FIRESTORE_SYNC_REGISTRY[collectionName];

            if (
                entry.unsubscribe &&
                typeof entry.unsubscribe === "function"
            ) {

                entry.unsubscribe();

                entry.unsubscribe = null;

            }

        }
    );

}


/* ==========================================
   🔁 RE-RENDER CURRENT PAGE (ውሂብ ከሌላ ስልክ ሲመጣ)
========================================== */

function rerenderCurrentPage() {

    const pageId =
        typeof getCurrentVisiblePageId === "function"
            ? getCurrentVisiblePageId()
            : null;

    if (!pageId) {

        return;

    }

    const renderers = {

        dashboard:
            function () {

                if (
                    typeof updateDashboardNotice === "function"
                ) {

                    updateDashboardNotice();

                }

                if (
                    typeof updatePatientCount === "function"
                ) {

                    updatePatientCount();

                }

                if (
                    typeof updateDoctorCount === "function"
                ) {

                    updateDoctorCount();

                }

            },

        patients:
            function () {

                if (
                    typeof displayPatients === "function"
                ) {

                    displayPatients();

                }

            },

        doctors:
            function () {

                if (
                    typeof displayDoctors === "function"
                ) {

                    displayDoctors();

                }

            },

        laboratory:
            function () {

                if (
                    typeof displayLaboratory === "function"
                ) {

                    displayLaboratory();

                }

            },

        radiology:
            function () {

                if (
                    typeof displayRadiology === "function"
                ) {

                    displayRadiology();

                }

            },

        pharmacy:
            function () {

                if (
                    typeof displayPharmacy === "function"
                ) {

                    displayPharmacy();

                }

            },

        payments:
            function () {

                if (
                    typeof displayPayments === "function"
                ) {

                    displayPayments();

                }

            },

        reports:
            function () {

                if (
                    typeof displayReports === "function"
                ) {

                    displayReports();

                }

            },

        security:
            function () {

                if (
                    typeof displaySecurity === "function"
                ) {

                    displaySecurity();

                }

            },

        recycle:
            function () {

                if (
                    typeof displayRecycle === "function"
                ) {

                    displayRecycle();

                }

            }

    };

    if (renderers[pageId]) {

        renderers[pageId]();

    }

}