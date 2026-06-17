document.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.getElementById("passwordInput");
    const toggleVisibility = document.getElementById("toggleVisibility");
    const strengthBar = document.getElementById("strengthBar");
    const strengthLabel = document.getElementById("strengthLabel");
    const feedbackList = document.getElementById("feedbackList");

    const commonDictionary = [
        "password", "123456", "123456789", "qwerty", "iloveyou", "welcome", 
        "admin", "letmein", "trustnoone", "monkey", "shadow", "computer security"
    ];

    const leetMap = {
        '4': 'a', '@': 'a', '8': 'b', '3': 'e', '1': 'i', '!': 'i', 
        '0': 'o', '5': 's', '$': 's', '7': 't', '2': 'z'
    };

    function decodeLeet(str) {
        return str.toLowerCase().split('').map(char => leetMap[char] || char).join('');
    }

    // Toggle Visibility Feature
    toggleVisibility.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggleVisibility.textContent = "Hide";
        } else {
            passwordInput.type = "password";
            toggleVisibility.textContent = "Show";
        }
    });

    // Real-Time Event Listener
    passwordInput.addEventListener("input", () => {
        const password = passwordInput.value;
        const analysis = evaluatePassword(password);
        updateUI(analysis);
    });

    // Core Security Scoring Algorithm
    function evaluatePassword(pwd) {
        let score = 0;
        let tips = [];

        if (pwd.length === 0) {
            return { score: 0, category: "Very Weak", colorClass: "very-weak", tips: ["Enter a password to start evaluation."] };
        }

        // --- 1. BASE ENTROPY BONUS ---
        // Length provides exponential security in mathematical search spaces
        score += pwd.length * 4; 

        // Character Variety Verification
        const hasUpper = /[A-Z]/.test(pwd);
        const hasLower = /[a-z]/.test(pwd);
        const hasDigit = /[0-9]/.test(pwd);
        const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

        if (hasUpper) score += 5;
        if (hasLower) score += 5;
        if (hasDigit) score += 5;
        if (hasSpecial) score += 5;


        // --- 2. PENALTY DETECTIONS (Attacker & Pattern Awareness) ---
        
        // Match Risk A: Check Normalized & Dictionary Entries
        const normalizedPwd = decodeLeet(pwd.toLowerCase());
        let dictionaryMatch = false;

        for (let word of commonDictionary) {
            if (normalizedPwd.includes(word)) {
                dictionaryMatch = true;
                break;
            }
        }

        if (dictionaryMatch) {
            score -= 40; 
            tips.push("Contains a common dictionary word or pattern (easily guessed).");
        }

        // Match Risk B: Character Repetitions (e.g., "aaaaaa", "11111")
        if (/(\w|\d|\s)\1{2,}/.test(pwd)) {
            score -= 15;
            tips.push("Avoid repetitive character configurations.");
        }

        // Match Risk C: Straight Sequential Runs (e.g., "abc", "789")
        if (hasSequentialPatterns(pwd)) {
            score -= 15;
            tips.push("Avoid sequential letters or keyboard rows (e.g., 'abc', '123').");
        }

        // Match Risk D: Minimal Length Boundaries
        if (pwd.length < 8) {
            score -= 20;
            tips.push("Critical Deficit: Shorter than the standard 8-character modern baseline.");
        }


        // Bound check scores between explicit limits
        score = Math.max(0, Math.min(score, 100));

        // --- 3. CATEGORY MAPPER ---
        let category = "Very Weak";
        let colorClass = "very-weak";

        if (score > 80) {
            category = "Very Strong";
            colorClass = "very-strong";
        } else if (score > 60) {
            category = "Strong";
            colorClass = "strong";
        } else if (score > 40) {
            category = "Fair";
            colorClass = "fair";
        } else if (score > 20) {
            category = "Weak";
            colorClass = "weak";
        }

        // Positive enforcement hints if the score isn't maxed
        if (score < 80 && tips.length === 0) {
            if (pwd.length < 14) {
                tips.push("Increase length beyond 14 characters to achieve multi-decade brute-force resistance.");
            }
            if (!hasSpecial || !hasDigit) {
                tips.push("Mixing unexpected character structures expands attacker dictionary requirements.");
            }
        }

        if (score >= 85) {
            tips.push("Excellent. Your passphrase resists modern high-GPU dictionary attacks.");
        }

        return { score, category, colorClass, tips };
    }

    // Mathematical routine checking for sequential unicode indexes
    function hasSequentialPatterns(str) {
        const lower = str.toLowerCase();
        for (let i = 0; i < lower.length - 2; i++) {
            const code1 = lower.charCodeAt(i);
            const code2 = lower.charCodeAt(i + 1);
            const code3 = lower.charCodeAt(i + 2);
            
            // Forward sequence (abc) or Reverse sequence (cba)
            if ((code2 === code1 + 1 && code3 === code2 + 1) || 
                (code2 === code1 - 1 && code3 === code2 - 1)) {
                return true;
            }
        }
        return false;
    }

    // DOM Painting Layer
    function updateUI(analysis) {
        // Dynamic UI adjustment
        strengthBar.style.width = `${analysis.score}%`;
        
        // Remove prior dynamic utility classes
        strengthLabel.className = "";
        strengthLabel.classList.add(analysis.colorClass);
        strengthLabel.textContent = analysis.category;

        // Apply dynamic thematic color to the strength bar
        strengthBar.style.backgroundColor = `var(--${analysis.colorClass})`;

        // Re-render suggestions
        feedbackList.innerHTML = "";
        analysis.tips.forEach(tip => {
            const li = document.createElement("li");
            li.textContent = tip;
            if (analysis.score >= 85) {
                li.classList.add("good-news");
            }
            feedbackList.appendChild(li);
        });
    }
});