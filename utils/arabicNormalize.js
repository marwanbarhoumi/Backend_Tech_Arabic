function normalizeArabic(text) {
  if (!text) return "";

  return text
    // نحّي التشكيل
    .replace(/[\u064B-\u065F]/g, "")

    // توحيد الألف
    .replace(/[أإآ]/g, "ا")

    // توحيد الياء
    .replace(/ى/g, "ي")

    // توحيد التاء المربوطة (اختياري)
    .replace(/ة/g, "ه")

    // نحّي الرموز
    .replace(/[^\u0600-\u06FF\s]/g, "")

    // spaces
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = normalizeArabic;
