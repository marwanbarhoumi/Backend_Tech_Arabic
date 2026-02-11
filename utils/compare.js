const normalize = require("./arabicNormalize");

function compare(studentRaw, correctRaw) {
  const student = normalize(studentRaw);
  const correct = normalize(correctRaw);

  const studentWords = student.split(" ");
  const correctWords = correct.split(" ");

  let correctCount = 0;
  const mistakes = [];

  correctWords.forEach((word, i) => {
    if (studentWords[i] === word) {
      correctCount++;
    } else {
      mistakes.push({
        word,
        tip: "حاول نطق هذه الكلمة بوضوح أكبر"
      });
    }
  });

  const score = Math.round(
    (correctCount / correctWords.length) * 100
  );

  let feedback;

  if (score === 100) feedback = "ممتاز 👏 نطقك واضح جداً";
  else if (score >= 80) feedback = "جيد جداً ✨";
  else if (score >= 60) feedback = "حاول تحسين بعض الكلمات";
  else feedback = "حاول مرة أخرى وركز على مخارج الحروف";

  return {
    score,
    feedback,
    mistakes
  };
}

module.exports = compare;
