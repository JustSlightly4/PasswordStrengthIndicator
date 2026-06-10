const inputField = document.getElementById('myInput');
const resultParagraph = document.getElementById('result');
const entropyParagraph = document.getElementById('entropy');
const uniquenessParagraph = document.getElementById('uniqueness');
const patternsParagraph = document.getElementById('patterns');
const feedbackBox = document.getElementById('feedbackBox');

const commonPasswords = new Set([
    "qwerty",
    "password",
    "admin",
]);

const resultColors = [
    "var(--strength-0)", // 0 - Very Weak
    "var(--strength-1)", // 1 - Weak
    "var(--strength-2)", // 2 - Fair
    "var(--strength-3)", // 3 - Strong
    "var(--strength-4)"  // 4 - Very Strong
];

let typingTimer;
const doneTypingInterval = 500; 

inputField.addEventListener('input', function() {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(executeAction, doneTypingInterval);
});

inputField.addEventListener('paste', function() {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(executeAction, doneTypingInterval);
});

function countUniqueCharacters(password) {
    return new Set(password).size;
}

function isAllSame(password) {
    return new Set(password).size === 1;
}

function hasRepeatingPattern(password) {
    const len = password.length;

    for (let start = 0; start < len; start++) {

        for (let size = 1; size <= (len - start) / 2; size++) {

            const pattern = password.slice(start, start + size);
            if (!pattern) continue;

            let i = start;
            let matchCount = 0;

            while (i + size <= len &&
                   password.slice(i, i + size) === pattern) {
                matchCount++;
                i += size;
            }

            if (matchCount > 2) {
                return true;
            }
        }
    }

    return false;
}

function hasSequence(password) {
    let counter = 1;

    for (let i = 0; i < password.length - 1; i++) {
        const current = password[i].toLowerCase().charCodeAt(0);
        const next = password[i + 1].toLowerCase().charCodeAt(0);

        if (next === current + 1) {
            counter++;
            if (counter > 2) return true;
        } else {
            counter = 1;
        }
    }

    return false;
}

function hasBackwardsSequence(password) {
    let counter = 1;

    for (let i = 0; i < password.length - 1; i++) {
        const current = password[i].toLowerCase().charCodeAt(0);
        const next = password[i + 1].toLowerCase().charCodeAt(0);

        if (next === current - 1) {
            counter++;
            if (counter > 2) return true;
        } else {
            counter = 1;
        }
    }

    return false;
}

function containsCommonPassword(password) {
    const lower = password.toLowerCase();

    for (let common of commonPasswords) {
        if (lower.includes(common)) {
            return true;
        }
    }

    return false;
}

function estimateEntropy(password) {
    const pool =
        (/[a-z]/.test(password) ? 26 : 0) +
        (/[A-Z]/.test(password) ? 26 : 0) +
        (/[0-9]/.test(password) ? 10 : 0) +
        (/[^a-zA-Z0-9]/.test(password) ? 33 : 0);

    return password.length * Math.log2(pool || 1);
}

function executeAction() {

    const password = inputField.value;

    feedbackBox.innerHTML = "";
    
    if (password.trim() === "") {
        resultParagraph.textContent = "Type in a password for grading...";
        entropyParagraph.textContent = "Entropy: nil";
        uniquenessParagraph.textContent = "Character Uniqueness: nil";
        patternsParagraph.textContent = "Patterns: nil";
        return;
    }

    let feedback = [];

    //Entropy Score
    let passwordEntropy = estimateEntropy(password);
    let entropyScore = 0;
    if (passwordEntropy > 119) {
        entropyScore = 4; // Very Strong
    } else if (passwordEntropy > 79) {
        entropyScore = 3; // Strong
    } else if (passwordEntropy > 59) {
        entropyScore = 2; // Fair
        feedback.push("This password has moderate strength but could still be cracked within days using targeted guessing.");
    } else if (passwordEntropy > 35) {
        entropyScore = 1; // Weak
        feedback.push("This password could be cracked in minutes to hours using basic brute-force tools.");
    } else {
        feedback.push("This password is extremely easy to guess and could be cracked instantly.");
    }

    //Unique Character Score
    let uniqueCharacters = countUniqueCharacters(password);
    let uniquenessScore = 0;

    if (uniqueCharacters > 7) {
        uniquenessScore = 4;
    } else if (uniqueCharacters > 6) {
        uniquenessScore = 3;
    } else if (uniqueCharacters > 5) { 
        uniquenessScore = 2;
        feedback.push("Password should have more unique characters.")
    } else if (uniqueCharacters > 4) {
        uniquenessScore = 1;
        feedback.push("Password should have more unique characters.")
    } else {
        feedback.push("Password should have more unique characters.")
    }

    //Pattern Scoreing
    let patternScore = 4;
    if (isAllSame(password)) {
        patternScore = 0;
        feedback.push("Password should not be a single character or number.");
    } else {
        if (hasRepeatingPattern(password)) {
            feedback.push("Password should avoid having repeating patterns.");
            patternScore -= 2;
        }
        if (hasSequence(password) || hasBackwardsSequence(password)) {
            feedback.push("Password should avoid having sequences of characters or numbers.");
            patternScore -= 2;
        }
        if (containsCommonPassword(password)) {
            feedback.push("Password should not contain common passwords.");
            patternScore -= 2;
        }
        if (patternScore < 0) patternScore = 0;
    }

    //Final Scoring
    let finalScore = Math.round((entropyScore * 0.5) + (uniquenessScore * 0.2) + (patternScore * 0.3));

    switch(finalScore) {
        case 4:
            resultParagraph.textContent = "Your password is Very Strong.";
            break;
        case 3:
            resultParagraph.textContent = "Your password is Strong.";
            break;
        case 2:
            resultParagraph.textContent = "Your password is Fair.";
            break;
        case 1:
            resultParagraph.textContent = "Your password is Weak.";
            break;
        default:
            resultParagraph.textContent = "Your password is Very Weak.";
            break;
    }
    resultParagraph.style.color = resultColors[finalScore];

    entropyParagraph.textContent = "Entropy: " + entropyScore;
    uniquenessParagraph.textContent = "Character Uniqueness: " + uniquenessScore;
    patternsParagraph.textContent = "Patterns: " + patternScore;

    feedback.forEach(msg => {
        const div = document.createElement("div");
        div.className = "feedback-item";
        div.textContent = msg;
        feedbackBox.appendChild(div);
    });
}