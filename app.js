const stringUtils = require('./stringutils');

const text = "hello world";

console.log("Capitalized:", stringUtils.capitalize(text));
console.log("Reversed:", stringUtils.reverseString(text));
console.log("Vowel Count:", stringUtils.countVowels(text));
