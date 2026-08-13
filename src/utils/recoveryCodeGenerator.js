/**
 * Generates a random, 7-character distinct security recovery code
 * combining uppercase letters, lowercase letters, numbers, and special characters.
 */
export function generate7CharRecoveryCode() {
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude easily confused chars like I, O
  const lowers = "abcdefghijkmnpqrstuvwxyz"; // exclude l
  const numbers = "23456789"; // exclude 0, 1
  const specials = "@#$%!*&?";

  const allChars = uppers + lowers + numbers + specials;

  // Guarantee at least 1 upper, 1 lower, 1 number, 1 special character
  let code = [
    uppers[Math.floor(Math.random() * uppers.length)],
    lowers[Math.floor(Math.random() * lowers.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    specials[Math.floor(Math.random() * specials.length)],
  ];

  // Fill the remaining 3 characters from allChars
  for (let i = 0; i < 3; i++) {
    code.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Shuffle array using Fisher-Yates algorithm
  for (let i = code.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [code[i], code[j]] = [code[j], code[i]];
  }

  return code.join("");
}
