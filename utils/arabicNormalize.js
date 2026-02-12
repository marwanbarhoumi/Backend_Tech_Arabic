module.exports = function normalizeArabic(text) {
  return text
    .replace(/[ًٌٍَُِّْـ]/g, "")      // remove tashkeel
    .replace(/أ|إ|آ/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};
