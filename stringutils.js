// Capitalize the first letter of a string
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Reverse a string
function reverseString(str) {
    return str.split('').reverse().join('');
}

// Count vowels in a string
function countVowels(str) {
    const vowels = 'aeiouAEIOU';
    let count = 0;

    for (let char of str) {
        if (vowels.includes(char)) {
            count++;
        }
    }
    return count;
}

// Export functions
module.exports = {
    capitalize,
    reverseString,
    countVowels
};
