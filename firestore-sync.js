
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

/* ==========================================
   🔐 ረዳት ተግባራት፦ ሃሽ + በስልኩ የሚቀመጥ "የመጨረሻ የተመሳሰለ" ሁኔታ
   ------------------------------------------
   ⚠️ ከዚህ በፊት "የመጨረሻ የተመሳሰለ" ሁኔታ በማህደረ ትውስታ ብቻ ነበር
   (ገጹ ሲታደስ ይጠፋ ነበር)። ስለዚህ ኦፍላይን የተመዘገበ ታካሚ ገጹ ከታደሰ
   በኋላ ኢንተርኔት ሲመለስ በአገልጋዩ ዝርዝር ይተካ እና ይጠፋ ነበር።
   አሁን ሁኔታው በስልኩ ላይ ይቀመጣል፣ እና የመጀመሪያው snapshot ላይም
   የስልኩ ያልተላኩ ለውጦች ይጠበቃሉ።
========================================== */

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


function hashSyncKey(text) {

    let h1 = 0x811c9dc5;

    let h2 = 5381;

    for (let i = 0; i < text.length; i++) {

        const c = text.charCodeAt(i);

        h1 ^= c;

        h1 = Math.imul(h1, 16777619) >>> 0;

        h2 = (Math.imul(h2, 33) + c) >>> 0;

    }

    return (
        h1.toString(36) + "." +
        h2.toString(36) + "." +
        text.length.toString(36)
    );

}


function syncKeyOf(item) {

    return hashSyncKey(
        stableStringify(
            cleanForFirestore(item)
        )
    );

}


const FIRESTORE_LAST_SYNCED_META = {};

const FIRESTORE_PERSIST_TIMERS = {};

let FIRESTORE_RETRY_TIMER = null;


function currentSyncClinicId() {

    try {

        return typeof getClinicBackupId === "function"
            ? getClinicBackupId()
            : "unknown";

    } catch (error) {

        return "unknown";

    }

}


function lastSyncedStorageKey(collectionName) {

    return (
        "clinicLastSynced:" +
        currentSyncClinicId() +
        ":" +
        collectionName
    );

}


function getLastSynced(collectionName) {

    const clinicId =
        currentSyncClinicId();

    const meta =
        FIRESTORE_LAST_SYNCED_META[collectionName];

    if (
        !FIRESTORE_LAST_SYNCED[collectionName] ||
        !meta ||
        meta.clinicId !== clinicId
    ) {

        const map =
            new Map();

        let persisted =
            false;

        try {

            const raw =
                localStorage.getItem(
                    lastSyncedStorageKey(collectionName)
                );

            if (raw) {

                const obj =
                    JSON.parse(raw);

                Object.keys(obj).forEach(
                    function (id) {

                        map.set(id, obj[id]);

                    }
                );

                persisted =
                    true;

            }

        } catch (error) {

            persisted = false;

        }

        FIRESTORE_LAST_SYNCED[collectionName] =
            map;

        FIRESTORE_LAST_SYNCED_META[collectionName] = {
            clinicId: clinicId,
            persisted: persisted
        };

    }

    return FIRESTORE_LAST_SYNCED[collectionName];

}


function hasPersistedLastSynced(collectionName) {

    getLastSynced(collectionName);

    return !!FIRESTORE_LAST_SYNCED_META[collectionName].persisted;

}


function persistLastSynced(collectionName) {

    if (FIRESTORE_PERSIST_TIMERS[collectionName]) {

        return;

    }

    FIRESTORE_PERSIST_TIMERS[collectionName] =
        setTimeout(
            function () {

                FIRESTORE_PERSIST_TIMERS[collectionName] = null;

                try {

                    const obj = {};

                    getLastSynced(collectionName).forEach(
                        function (value, id) {

                            obj[id] = value;

                        }
                    );

                    localStorage.setItem(
                        lastSyncedStorageKey(collectionName),
                        JSON.stringify(obj)
                    );

                    FIRESTORE_LAST_SYNCED_META[collectionName].persisted =
                        true;

                } catch (error) {

                    console.warn(error);

                }

            },
            300
        );

}


/* ገና ከአገልጋዩ ያልተሰረዙ ሰነዶች (ኦፍላይን የተሰረዙ) በስልኩ ላይ ይታወሳሉ */
function pendingDeletesKey(collectionName) {

    return (
        "clinicPendingDeletes:" +
        currentSyncClinicId() +
        ":" +
        collectionName
    );

}


function getPendingDeletes(collectionName) {

    try {

        return new Set(
            JSON.parse(
                localStorage.getItem(
                    pendingDeletesKey(collectionName)
                )
            ) || []
        );

    } catch (error) {

        return new Set();

    }

}


function savePendingDeletes(collectionName, set) {

    try {

        localStorage.setItem(
            pendingDeletesKey(collectionName),
            JSON.stringify(Array.from(set))
        );

    } catch (error) {

        console.warn(error);

    }

}


function withSyncTimeout(promise, ms) {

    return Promise.race([

        promise,

        new Promise(
            function (resolve, reject) {

                setTimeout(
                    function () {

                        reject(new Error("sync-timeout"));

                    },
                    ms
                );

            }
        )

    ]);

}


function rebuildLastSynced(collectionName, serverItems) {

    const last =
        getLastSynced(collectionName);

    last.clear();

    serverItems.forEach(
        function (item) {

            last.set(
                String(item.id),
                syncKeyOf(item)
            );

        }
    );

    persistLastSynced(collectionName);

}


/* አካባቢያዊ ዝርዝሩን ከአገልጋዩ ጋር ያዋህዳል፦ ገና ያልተላከ የራስ ለውጥ ይጠበቃል */
function mergeSnapshotWithLocal(collectionName, serverItems, localArray) {

    const last =
        getLastSynced(collectionName);

    const pendingDeletes =
        getPendingDeletes(collectionName);

    const merged =
        new Map();

    serverItems.forEach(
        function (item) {

            const id =
                String(item.id);

            if (!pendingDeletes.has(id)) {

                merged.set(id, item);

            }

        }
    );

    let hasUnsynced =
        false;

    (Array.isArray(localArray) ? localArray : []).forEach(
        function (item) {

            if (!item || typeof item !== "object") {

                return;

            }

            const id =
                String(item.id);

            if (pendingDeletes.has(id)) {

                return;

            }

            const lastKey =
                last.get(id);

            const localKey =
                syncKeyOf(item);

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


/* የመጀመሪያው ማመሳሰል (ከዚህ ስልክ ምንም የተቀመጠ "የተመሳሰለ" ሁኔታ ከሌለ)፦
   አገልጋዩ ያሸንፋል፣ በስልኩ ላይ ብቻ ያሉ አዲስ ሰነዶች ግን አይጠፉም፣ ይላካሉ */
function bootstrapMergeWithLocal(collectionName, serverItems, localArray) {

    const pendingDeletes =
        getPendingDeletes(collectionName);

    const merged =
        new Map();

    serverItems.forEach(
        function (item) {

            const id =
                String(item.id);

            if (!pendingDeletes.has(id)) {

                merged.set(id, item);

            }

        }
    );

    let hasUnsynced =
        false;

    (Array.isArray(localArray) ? localArray : []).forEach(
        function (item) {

            if (!item || typeof item !== "object") {

                return;

            }

            const id =
                String(item.id);

            if (!merged.has(id) && !pendingDeletes.has(id)) {

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


function countUnsynced(collectionName) {

    const entry =
        FIRESTORE_SYNC_REGISTRY[collectionName];

    if (!entry) {

        return 0;

    }

    const last =
        getLastSynced(collectionName);

    let count =
        0;

    (entry.getArray() || []).forEach(
        function (item) {

            if (!item || typeof item !== "object") {

                return;

            }

            if (last.get(String(item.id)) !== syncKeyOf(item)) {

                count++;

            }

        }
    );

    count +=
        getPendingDeletes(collectionName).size;

    return count;

}


/* ያልተላኩ ለውጦችን በየጊዜው እንደገና ይልካል (ኢንተርኔት ሲመለስ) */
function scheduleSyncRetry() {

    if (FIRESTORE_RETRY_TIMER) {

        return;

    }

    FIRESTORE_RETRY_TIMER =
        setTimeout(
            function () {

                FIRESTORE_RETRY_TIMER = null;

                pushAllPendingSync();

            },
            20000
        );

}


function pushAllPendingSync() {

    if (
        typeof isLoggedIn === "function" &&
        !isLoggedIn()
    ) {

        return;

    }

    Object.keys(FIRESTORE_SYNC_REGISTRY).forEach(
        function (collectionName) {

            const entry =
                FIRESTORE_SYNC_REGISTRY[collectionName];

            if (!entry.synced) {

                return;

            }

            if (countUnsynced(collectionName) > 0) {

                syncArrayToFirestore(
                    collectionName,
                    entry.getArray()
                );

            }

            getPendingDeletes(collectionName).forEach(
                function (id) {

                    deleteFirestoreDoc(collectionName, id);

                }
            );

        }
    );

}


/* ==========================================
   🟢 የግንኙነት ሁኔታ ማሳያ (ራስጌ ላይ)
========================================== */

function updateSyncBadge() {

    const badge =
        document.getElementById("syncStatusBadge");

    if (!badge) {

        return;

    }

    const online =
        typeof navigator === "undefined" ||
        navigator.onLine !== false;

    let pending =
        0;

    let allSynced =
        true;

    Object.keys(FIRESTORE_SYNC_REGISTRY).forEach(
        function (collectionName) {

            const entry =
                FIRESTORE_SYNC_REGISTRY[collectionName];

            if (!entry.synced) {

                allSynced = false;

                return;

            }

            pending +=
                countUnsynced(collectionName);

        }
    );

    let text;

    let color;

    if (!online) {

        text =
            "🔴 ኦፍላይን" +
            (
                pending > 0
                    ? " • " + pending + " ለውጥ አልተላከም"
                    : ""
            );

        color = "#c0392b";

    } else if (!allSynced) {

        text = "🟡 እየተመሳሰለ...";

        color = "#b9770e";

    } else if (pending > 0) {

        text = "🟠 " + pending + " ለውጥ በመላክ ላይ";

        color = "#b9770e";

    } else {

        text = "🟢 ተመሳስሏል";

        color = "#1e8449";

    }

    badge.textContent =
        text;

    badge.style.color =
        color;

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

                /* ለጊዜው አልተሳካም (ኦፍላይን)፤ በኋላ እንደገና ይሞከራል */
                scheduleSyncRetry();

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

        throw new Error("auth-not-ready");

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
                hashSyncKey(stableStringify(clean));

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

        /* ኦፍላይን ሲሆን commit() አይመለስም፤ ወረፋው እንዳይቆም ጊዜ ገደብ አለው */
        await withSyncTimeout(
            batch.commit(),
            20000
        );

        slice.forEach(
            function (c) {

                last.set(c.id, c.key);

            }
        );

        persistLastSynced(collectionName);

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

    const id =
        String(docId);

    /* ኦፍላይን ቢሆንም እንዳይረሳ በስልኩ ላይ ይመዘገባል */
    const pending =
        getPendingDeletes(collectionName);

    pending.add(id);

    savePendingDeletes(collectionName, pending);

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

            scheduleSyncRetry();

            return;

        }

        const collRef =
            getClinicDataCollectionRef(collectionName);

        if (!collRef) {

            return;

        }

        await withSyncTimeout(
            collRef.doc(id).delete(),
            20000
        );

        const stillPending =
            getPendingDeletes(collectionName);

        stillPending.delete(id);

        savePendingDeletes(collectionName, stillPending);

        getLastSynced(collectionName).delete(id);

        persistLastSynced(collectionName);

    } catch (error) {

        console.error(
            "Firestore delete error (" +
            collectionName +
            "):",
            error
        );

        scheduleSyncRetry();

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

    /* ከቆሻሻ የተመለሰ (ወይም እንደገና የተፈጠረ) ሰነድ "ለመሰረዝ ተጠባባቂ" ዝርዝር ይወጣል */
    const pending =
        getPendingDeletes(collectionName);

    if (pending.size > 0) {

        let removed =
            false;

        (Array.isArray(array) ? array : []).forEach(
            function (item) {

                if (
                    item &&
                    typeof item === "object" &&
                    pending.delete(String(item.id))
                ) {

                    removed = true;

                }

            }
        );

        if (removed) {

            savePendingDeletes(collectionName, pending);

        }

    }

    syncArrayToFirestore(
        collectionName,
        array
    );

    updateSyncBadge();

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

            /* ከዚህ ስልክ የተቀመጠ "የተመሳሰለ" ሁኔታ ነበር? (ከመጀመሪያው snapshot በፊት ይነበባል) */
            const hadPersistedState =
                hasPersistedLastSynced(collectionName);

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

                        /* የመጀመሪያው snapshot ባዶ ሆኖ ስልኩ ግን ውሂብ ካለው፦
                           ውሂቡን አናጥፋም፣ ወደ Firestore እንልካለን (እንዘራለን) */
                        if (
                            isFirstSnapshot &&
                            items.length === 0 &&
                            entry.getArray().length > 0
                        ) {

                            isFirstSnapshot = false;

                            entry.synced = true;

                            syncArrayToFirestore(
                                collectionName,
                                entry.getArray()
                            );

                            updateSyncBadge();

                            return;

                        }

                        const pendingDeletes =
                            getPendingDeletes(collectionName);

                        let merged;

                        if (isFirstSnapshot && !hadPersistedState) {

                            /* አዲስ ስልክ ወይም ከዚህ ማሻሻያ በኋላ የመጀመሪያ ጊዜ */
                            merged =
                                bootstrapMergeWithLocal(
                                    collectionName,
                                    items,
                                    entry.getArray()
                                );

                        } else {

                            /* ሁልጊዜ፦ ገና ያልተላከ የራስ ለውጥ ይጠበቃል
                               (ገጹ ከታደሰ በኋላ ባለው የመጀመሪያ snapshot ጭምር) */
                            merged =
                                mergeSnapshotWithLocal(
                                    collectionName,
                                    items,
                                    entry.getArray()
                                );

                        }

                        const finalItems =
                            merged.items;

                        const needPush =
                            merged.hasUnsynced;

                        isFirstSnapshot = false;

                        entry.synced = true;

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

                        /* ኦፍላይን የተሰረዙትን ወደ አገልጋዩ እንደገና ይልካል */
                        pendingDeletes.forEach(
                            function (id) {

                                deleteFirestoreDoc(collectionName, id);

                            }
                        );

                        updateSyncBadge();

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

                        entry.synced = false;

                        updateSyncBadge();

                    }
                );

        }
    );

}


/* ኢንተርኔት ሲመለስ፦ ያልጀመሩ ማዳመጫዎችን እንደገና ይጀምራል፣ ያልተላኩ ለውጦችን ይልካል */
if (typeof window !== "undefined" && window.addEventListener) {

    window.addEventListener(
        "online",
        function () {

            if (
                typeof isLoggedIn === "function" &&
                isLoggedIn()
            ) {

                startFirestoreSync();

                setTimeout(
                    pushAllPendingSync,
                    2000
                );

            }

            updateSyncBadge();

        }
    );

    window.addEventListener(
        "offline",
        function () {

            updateSyncBadge();

        }
    );

    setInterval(
        updateSyncBadge,
        8000
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

            entry.synced = false;

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