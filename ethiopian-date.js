
/* ==========================================
   📅 የኢትዮጵያ ቀን መቁጠሪያ (Ethiopian Calendar)
   ------------------------------------------
   ውሂብ ራሱ (localStorage) ሁልጊዜ በመደበኛ ISO/Gregorian
   ይቀመጣል (ለትክክለኛ sort/filter) - ለተጠቃሚው ግን
   navigator ላይ የሚታየው ቀን/ሰዓት ሁሉ በኢትዮጵያ ካላንደር
   እና በኢትዮጵያ ሰዓት አቆጣጠር ብቻ ይቀየራል።
========================================== */

const ETHIOPIAN_MONTHS = [

    "መስከረም", "ጥቅምት", "ህዳር", "ታህሳስ",

    "ጥር", "የካቲት", "መጋቢት", "ሚያዝያ",

    "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"

];


function isGregorianLeapYear(year) {

    return (
        (year % 4 === 0 && year % 100 !== 0) ||
        year % 400 === 0
    );

}


/* ==========================================
   🔄 GREGORIAN → ETHIOPIAN
========================================== */

function toEthiopianDate(input) {

    const gregDate =
        input instanceof Date
            ? input
            : new Date(input);

    if (
        isNaN(gregDate.getTime())
    ) {

        return null;

    }

    const gYear =
        gregDate.getFullYear();

    const newYearDayThisYear =
        isGregorianLeapYear(gYear + 1)
            ? 12
            : 11;

    const newYearThisYear =
        new Date(
            gYear,
            8,
            newYearDayThisYear
        );

    let ethYear;

    let daysSinceNewYear;

    if (gregDate >= newYearThisYear) {

        ethYear =
            gYear - 7;

        daysSinceNewYear =
            Math.floor(
                (gregDate - newYearThisYear) /
                86400000
            );

    } else {

        const newYearDayPrevYear =
            isGregorianLeapYear(gYear)
                ? 12
                : 11;

        const newYearPrevYear =
            new Date(
                gYear - 1,
                8,
                newYearDayPrevYear
            );

        ethYear =
            gYear - 8;

        daysSinceNewYear =
            Math.floor(
                (gregDate - newYearPrevYear) /
                86400000
            );

    }

    const ethMonthIndex =
        Math.floor(
            daysSinceNewYear / 30
        );

    const ethDay =
        (daysSinceNewYear % 30) + 1;

    return {

        year: ethYear,

        month: ethMonthIndex + 1,

        monthName:
            ETHIOPIAN_MONTHS[ethMonthIndex] ||
            "",

        day: ethDay,

        hours:
            gregDate.getHours(),

        minutes:
            gregDate.getMinutes()

    };

}


/* ==========================================
   🕒 ETHIOPIAN TIME (ከምዕራባዊ ሰዓት 6 ሰዓት ልዩነት)
========================================== */

function toEthiopianTimeString(input) {

    const gregDate =
        input instanceof Date
            ? input
            : new Date(input);

    if (
        isNaN(gregDate.getTime())
    ) {

        return "-";

    }

    const h =
        gregDate.getHours();

    const m =
        gregDate.getMinutes();

    let period = "ለሊት";

    if (h >= 6 && h < 12) {

        period = "ጠዋት";

    } else if (h >= 12 && h < 18) {

        period = "ከሰዓት";

    } else if (h >= 18) {

        period = "ማታ";

    }

    let ethHour =
        h - 6;

    if (ethHour <= 0) {

        ethHour += 12;

    }

    if (ethHour > 12) {

        ethHour -= 12;

    }

    return (
        String(ethHour).padStart(2, "0") +
        ":" +
        String(m).padStart(2, "0") +
        " " +
        period
    );

}


/* ==========================================
   📅 FULL DATE (ለምሳሌ: 12 መስከረም 2018 ዓ.ም)
========================================== */

function formatEthiopianDate(input) {

    if (!input) {

        return "-";

    }

    const eth =
        toEthiopianDate(input);

    if (!eth) {

        return "-";

    }

    return (

        eth.day +
        " " +
        eth.monthName +
        " " +
        eth.year +
        " ዓ.ም"

    );

}


/* ==========================================
   📅🕒 FULL DATE + TIME
   (localStorage/toLocaleString() ምትክ በየትም ቦታ
   ይህ ጥቅም ላይ ይውላል)
========================================== */

function formatEthiopianDateTime(input) {

    if (!input) {

        return "-";

    }

    return (

        formatEthiopianDate(input) +
        " " +
        toEthiopianTimeString(input)

    );

}