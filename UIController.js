// UIController.js

/**
 * @class UIController
 * @description Manages all interactions and updates related to the User Interface.
 */
export class UIController {
    /**
     * @constructor
     * @description Initializes UI element references and sets up initial UI behavior.
     */
    constructor() {
        // --- UI Element References ---
        this.playPauseBtn = document.getElementById("playPauseBtn");
        this.playPauseIcon = document.getElementById("playPauseIcon");
        this.area1 = document.getElementById("area1"); // Input textarea
        this.area2 = document.getElementById("area2"); // Display area for reading
        this.startBtn = document.getElementById("startBtn");
        this.closeBtn = document.getElementById("closeBtn");
        this.wordCountElem = document.getElementById("wordCount");
        this.messageElem = document.querySelector(".header-h3-msg");

        // Reference the main display elements
        this.stopwatchDisplayElem = document.querySelector(".clock"); // Div containing stopwatch and total
        this.wordsStatElem = document.querySelector(".words-stat"); // Div containing current words and total words

        // Reference the specific spans within those elements
        this.clockTotal = this.stopwatchDisplayElem ? this.stopwatchDisplayElem.querySelector(".clock-total") : null;
        this.wordsTotalElem = this.wordsStatElem ? this.wordsStatElem.querySelector(".words-total") : null;

        this.header1 = document.getElementById("header1"); // Header for input view
        this.header2 = document.getElementById("header2"); // Header for reading view
        this.forwardBtn = document.getElementById("forwardBtn");
        this.backwardBtn = document.getElementById("backwardBtn");

        // --- SVG Icon Paths ---
        this.playPath = "M8 5v14l11-7z";
        this.pausePath = "M6 19h4V5H6v14zm8-14v14h4V5h-4z";

        // --- Internal State for Reading View ---
        this.area2OriginalText = "";
        this.area2ParsedContent = []; // Stores words and separators
        this.area2Words = []; // Stores only words

        // --- Initial UI Setup ---
        this.#enableTabInTextarea();
    }

    /**
     * @private
     * @description Enables tab key to insert a tab character in area1 textarea.
     */
    #enableTabInTextarea() {
        if (!this.area1) return;
        this.area1.addEventListener("keydown", function(e) {
            if (e.key === "Tab") {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 1;
            }
        });
    }

    /**
     * @private
     * @description Splits text into an array of words and separators.
     * @param {string} text - The input text to split.
     * @returns {Array<Object>} An array of objects, each with a 'type' ('word' or 'separator') and 'value'.
     */
    #splitTextAndSeparators(text) {
        const result = [];
        const regex = /(\S+|\s+)/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            const segment = match[0];
            if (/\s+/.test(segment)) {
                result.push({ type: 'separator', value: segment });
            } else {
                result.push({ type: 'word', value: segment });
            }
        }
        return result;
    }

    /**
     * @private
     * @description Escapes HTML characters in a string to prevent XSS.
     * @param {string} str - The string to escape.
     * @returns {string} The HTML-escaped string.
     */
    #escapeHtml(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // --- Public Methods for UI Updates and Interactions ---

    /**
     * @description Updates the stopwatch display with formatted time (HH:MM:SS).
     * This method directly updates the text content of the .clock element.
     * @param {number} hours - Current hours.
     * @param {number} minutes - Current minutes.
     * @param {number} seconds - Current seconds.
     */
    updateStopwatchDisplay(hours, minutes, seconds) {
        if (this.stopwatchDisplayElem) {
            const formattedHours = String(hours).padStart(2, '0');
            const formattedMinutes = String(minutes).padStart(2, '0');
            const formattedSeconds = String(seconds).padStart(2, '0');

            if (this.stopwatchDisplayElem.firstChild && this.stopwatchDisplayElem.firstChild.nodeType === Node.TEXT_NODE) {
                 this.stopwatchDisplayElem.firstChild.nodeValue = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
            } else {
                this.stopwatchDisplayElem.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
                if (this.clockTotal && !this.stopwatchDisplayElem.contains(this.clockTotal)) {
                    this.stopwatchDisplayElem.appendChild(this.clockTotal);
                }
            }
        }
    }

    /**
     * @description Sets the play/pause button icon and title based on playing state.
     * @param {boolean} isPlaying - True if currently playing, false otherwise.
     */
    setPlayPauseState(isPlaying) {
        this.playPauseIcon.setAttribute("d", isPlaying ? this.pausePath : this.playPath);
        this.playPauseBtn.title = isPlaying ? "Pause" : "Play";
    }

    /**
     * @description Toggles between the input view (area1) and the reading view (area2).
     * @param {boolean} isStarting - True when transitioning to reading view, false when returning to input view.
     */
    toggleViews(isStarting) {
        if (isStarting) {
            this.area2OriginalText = this.area1.value;
            this.area2ParsedContent = this.#splitTextAndSeparators(this.area2OriginalText);
            this.area2Words = this.area2ParsedContent.filter(item => item.type === 'word').map(item => item.value);
            // Initially set textContent for safety before highlighting
            this.area2.textContent = this.area2OriginalText;
        } else {
            this.area1.value = this.area2OriginalText;
            this.clearHighlight();
        }
        this.header1.classList.toggle("hidden");
        this.header2.classList.toggle("hidden");
        this.area1.classList.toggle("hidden");
        this.area2.classList.toggle("hidden");

        // Synchronize scroll positions
        if (isStarting) {
            this.area2.scrollTop = this.area1.scrollTop;
        } else {
            this.area1.scrollTop = this.area2.scrollTop;
        }
    }

    /**
     * @description Displays a flashing message in the header.
     * @param {string} text - The message to display.
     */
    showFlashingMessage(text) {
        this.messageElem.textContent = text;
        this.messageElem.classList.add("flash");
        this.messageElem.style.display = "block";

        setTimeout(() => {
            this.messageElem.classList.remove("flash");
            this.messageElem.style.display = "none";
        }, 4000); // Message fades after 4 seconds
    }

    /**
     * @description Updates the displayed word count for the input area.
     * @param {number} count - The current word count.
     */
    updateWordCount(count) {
        this.wordCountElem.textContent = `${count} word${count !== 1 ? "s" : ""}`;
    }

    /**
     * @description Updates the total words and WPM speed display.
     * @param {number} wordCount - The total number of words.
     * @param {number} wpm - The words per minute speed.
     */
    updateWordsTotal(wordCount, wpm) {
        if (this.wordsTotalElem) {
            this.wordsTotalElem.textContent = ` / ${wordCount} words @ ${wpm} W.P.M. Speed`;
            this.wordsTotalElem.dataset.wpmSpeed = wpm; // Store WPM for later use
        }
    }

    /**
     * @description Updates the current word progress display (e.g., "0001 / 1000 words").
     * @param {number} currentWordIndex - The 0-based index of the current word being read.
     * @param {number} totalWords - The total number of words in the text.
     */
    updateWordsStatDisplay(currentWordIndex, totalWords) {
        if (this.wordsStatElem) {
            this.wordsStatElem.textContent = `${(currentWordIndex + 1).toString().padStart(4, '0')}`;

            if (this.wordsTotalElem && !this.wordsStatElem.contains(this.wordsTotalElem)) {
                this.wordsStatElem.appendChild(this.wordsTotalElem);
            }
            if (this.wordsTotalElem) {
                this.wordsTotalElem.textContent = ` / ${totalWords} words @ ${this.wordsTotalElem.dataset.wpmSpeed || '??'} W.P.M. Speed`;
            }
        }
    }

    /**
     * @description Sets the disabled state of the start button.
     * @param {boolean} isDisabled - True to disable, false to enable.
     */
    setStartButtonState(isDisabled) {
        this.startBtn.disabled = isDisabled;
    }

    /**
     * @description Updates the total estimated reading time display.
     * This method only updates the *estimated time span* within the .clock element.
     * @param {string} timeString - Formatted time string (e.g., "30:00").
     */
    updateClockTotal(timeString) {
        if (this.clockTotal) {
            this.clockTotal.textContent = `  ${timeString}`;
        }
    }

    /**
     * @description Gets the current value of the input textarea (area1).
     * @returns {string} The text content of area1.
     */
    getArea1Value() {
        return this.area1.value;
    }

    /**
     * @description Sets the value of the input textarea (area1).
     * @param {string} value - The text content to set.
     */
    setArea1Value(value) {
        this.area1.value = value;
    }

    /**
     * @description Highlights a specific word in the reading area (area2) and scrolls to it if necessary.
     * @param {number} wordIndex - The 0-based index of the word to highlight among all words.
     * @param {number} number} totalWords - The total number of words (for context, though not directly used in highlighting logic here).
     */
    highlightWord(wordIndex, totalWords) {
        if (!this.area2 || !this.area2ParsedContent || this.area2ParsedContent.length === 0) return;

        let highlightedHtml = '';
        let currentWordTracker = 0;

        this.area2ParsedContent.forEach((item) => {
            if (item.type === 'word') {
                if (currentWordTracker === wordIndex) {
                    // Only the highlighted word is wrapped, the rest is escaped
                    highlightedHtml += `<span class="highlighted-word">${this.#escapeHtml(item.value)}</span>`;
                } else {
                    highlightedHtml += this.#escapeHtml(item.value); // Escape all other words
                }
                currentWordTracker++;
            } else {
                highlightedHtml += this.#escapeHtml(item.value); // Escape all separators
            }
        });
        this.area2.innerHTML = highlightedHtml; // Now it's safe to use innerHTML

        // Scroll the highlighted word into view if it's outside the current viewport
        const highlightedSpan = this.area2.querySelector('.highlighted-word');
        if (highlightedSpan) {
            const containerHeight = this.area2.clientHeight;
            const spanTop = highlightedSpan.offsetTop;
            const spanHeight = highlightedSpan.offsetHeight;

            if (spanTop < this.area2.scrollTop || (spanTop + spanHeight) > (this.area2.scrollTop + containerHeight)) {
                this.area2.scrollTop = spanTop - (containerHeight / 2) + (spanHeight / 2);
            }
        }
    }

    /**
     * @description Removes any highlighting from the reading area (area2).
     */
    clearHighlight() {
        if (this.area2) {
            // When clearing, set textContent to the original text (which is just plain text)
            this.area2.textContent = this.area2OriginalText;
        }
    }

    // --- Event Listeners Registration ---

    /**
     * @description Registers a click handler for the play/pause button.
     * @param {Function} handler - The callback function to execute on click.
     */
    onPlayPauseClick(handler) {
        this.playPauseBtn.addEventListener("click", handler);
    }

    /**
     * @description Registers a click handler for the start button.
     * @param {Function} handler - The callback function to execute on click.
     */
    onStartBtnClick(handler) {
        this.startBtn.addEventListener("click", handler);
    }

    /**
     * @description Registers a click handler for the close button.
     * @param {Function} handler - The callback function to execute on click.
     */
    onCloseBtnClick(handler) {
        this.closeBtn.addEventListener("click", handler);
    }

    /**
     * @description Registers an input event handler for area1 textarea.
     * @param {Function} handler - The callback function to execute on input.
     */
    onArea1Input(handler) {
        this.area1.addEventListener("input", handler);
    }

    /**
     * @description Registers a click handler for the forward button.
     * @param {Function} handler - The callback function to execute on click.
     */
    onForwardBtnClick(handler) {
        if (this.forwardBtn) {
            this.forwardBtn.addEventListener("click", handler);
        }
    }

    /**
     * @description Registers a click handler for the backward button.
     * @param {Function} handler - The callback function to execute on click.
     */
    onBackwardBtnClick(handler) {
        if (this.backwardBtn) {
            this.backwardBtn.addEventListener("click", handler);
        }
    }

    /**
     * @description Sets up scroll synchronization between area1 and area2 when area1 is visible.
     */
    setupScrollSynchronization() {
        this.area1.addEventListener("scroll", () => {
            if (this.area2.classList.contains("hidden") && !this.area1.classList.contains("hidden")) {
                this.area2.scrollTop = this.area1.scrollTop;
            }
        });
    }
}