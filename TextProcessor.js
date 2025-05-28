// TextProcessor.js
export class TextProcessor {
    constructor(wordLimit) {
        this.WORD_LIMIT = wordLimit;
    }

    getWordCount(text) {
        // This count is for the original text from area1.
        // It relies on whitespace splitting for simple word count.
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        return words.length;
    }

    // NEW LOGIC FOR TRUNCATE TEXT
    truncateText(text) {
        // First, get the raw words for counting
        const rawWords = text.trim().split(/\s+/).filter(w => w.length > 0);

        if (rawWords.length > this.WORD_LIMIT) {
            let truncatedOutput = '';
            let currentWordCount = 0;
            let lastIndex = 0;

            // This regex captures words (non-whitespace) and also captures any whitespace.
            // We use a global match to iterate through the text.
            const regex = /(\S+|\s+)/g;
            let match;

            while ((match = regex.exec(text)) !== null && currentWordCount < this.WORD_LIMIT) {
                const segment = match[0];
                if (/\s+/.test(segment)) {
                    // It's a separator, just append it
                    truncatedOutput += segment;
                } else {
                    // It's a word
                    truncatedOutput += segment;
                    currentWordCount++; // Increment word count only for actual words
                }
                lastIndex = regex.lastIndex; // Keep track of the current position
            }

            // If we hit the word limit exactly on a word,
            // we need to include any whitespace that followed that word in the original text,
            // up to the point where the next word (which would be truncated) starts.
            // This ensures we don't end abruptly mid-space or before a newline.
            if (currentWordCount === this.WORD_LIMIT && lastIndex < text.length) {
                 // Capture any immediate trailing whitespace after the last word
                const remainingText = text.substring(lastIndex);
                const trailingWhitespaceMatch = /^(\s*)/.exec(remainingText);
                if (trailingWhitespaceMatch && trailingWhitespaceMatch[1]) {
                    truncatedOutput += trailingWhitespaceMatch[1];
                }
            }


            return {
                truncatedText: truncatedOutput,
                isTruncated: true
            };
        }
        return {
            truncatedText: text, // No truncation, return original text
            isTruncated: false
        };
    }

    calculateReadingTime(wordCount, wpm) {
        if (wpm === 0) return "00:00:00"; // Prevent division by zero

        const totalMinutes = wordCount / wpm;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.floor(totalMinutes % 60);
        const seconds = Math.round((totalMinutes * 60) % 60);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}