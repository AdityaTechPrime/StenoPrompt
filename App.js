// App.js
import { RangeSlider } from './RangeSlider.js';
import { TextProcessor } from './TextProcessor.js';
import { UIController } from './UIController.js';
import { MediaQueryController } from './MediaQueryController.js';

/**
 * @class App
 * @description Main application class that orchestrates interactions between UI, TextProcessor, and RangeSlider.
 */
class App {
    /**
     * @constructor
     * @description Initializes controllers and application state.
     */
    constructor() {
        this.ui = new UIController();
        this.textProcessor = new TextProcessor(2000); // WORD_LIMIT is chnaged from 1000 to 2000
        this.rangeSlider = new RangeSlider("range", ".range-label", 30, 150, this.ui.showFlashingMessage.bind(this.ui));
        this.mediaQueryController = new MediaQueryController();

        // --- Application State ---
        this.isPlaying = false; // State for play/pause of reading playback
        this.MIN_WORDS_FOR_START = 10; // Minimum words required to start reading

        // Playback state variables
        this.currentWordIndex = 0;
        this.playbackInterval = null; // Stores the setInterval ID for word highlighting playback

        // Stopwatch state variables
        this.stopwatchInterval = null; // Stores the setInterval ID for the stopwatch
        this.elapsedTime = 0; // Total milliseconds elapsed in stopwatch
        this.startTime = 0; // Timestamp when stopwatch last started/resumed

        this.wasPlayingBeforeHidden = false; // To store playback state when tab/window becomes hidden

        this.init();
    }

    /**
     * @description Initializes the application by setting up event listeners and initial UI state.
     */
    init() {
        this.#setupEventListeners(); // Use private method convention
        this.ui.setupScrollSynchronization();
        this.#updateAppState(); // Initial update to set word count and button state
        this.#resetStopwatch(); // Initialize stopwatch display to 00:00:00 on load
    }

    /**
     * @private
     * @description Sets up all global and UI-related event listeners.
     */
    #setupEventListeners() {
        // Play/Pause Button Click
        this.ui.onPlayPauseClick(() => {
            const wasPlayingBeforeClick = this.isPlaying; // Store state before toggling
            this.isPlaying = !this.isPlaying;
            this.ui.setPlayPauseState(this.isPlaying);

            if (this.isPlaying) { // If now playing (was paused or finished)
                // NEW LOGIC: If we are at the end of the text and press play, restart from beginning
                const totalWords = this.ui.area2Words.length;
                if (totalWords > 0 && this.currentWordIndex >= totalWords -1 && !wasPlayingBeforeClick) {
                    this.currentWordIndex = 0; // Reset to start
                    this.ui.clearHighlight(); // Clear any existing highlight
                    this.#resetStopwatch(); // Reset stopwatch for a new session
                }
                this.#startReading();
            } else { // If now paused
                this.#pauseReading();
            }
        });

        // Start Button Click
        this.ui.onStartBtnClick(() => {
            this.#updateAppState(); // Re-run truncation and word count check on area1 before starting

            const wordCount = this.textProcessor.getWordCount(this.ui.getArea1Value());
            if (wordCount < this.MIN_WORDS_FOR_START) {
                this.ui.showFlashingMessage(`Please enter at least ${this.MIN_WORDS_FOR_START} words to start.`);
                return; // Prevent starting if not enough words
            }

            this.ui.toggleViews(true); // Switch to reading view
            this.#updateWordsAndWPMDisplay(); // Update total words and WPM speed display
            this.#updateReadingTime(); // Update estimated total reading time
            
            this.currentWordIndex = 0; // Reset word index for new session
            this.ui.clearHighlight(); // Clear any previous highlights
            this.#pauseReading(); // Ensure playback is stopped (and stopwatch paused)
            this.ui.setPlayPauseState(false); // Set play button icon to 'Play' state
            this.ui.updateWordsStatDisplay(this.currentWordIndex, this.ui.area2Words.length);

            this.#resetStopwatch(); // Reset stopwatch on new session start
        });

        // Close Button Click
        this.ui.onCloseBtnClick(() => {
            this.ui.toggleViews(false); // Switch back to editing view
            this.#updateAppState(); // Update word count for editing view
            this.#pauseReading(); // Stop playback (and stopwatch)
            this.currentWordIndex = 0; // Reset word index for next session
            this.ui.setPlayPauseState(false); // Reset play/pause button icon

            // Update display to 0/total words when closing from reading view
            this.ui.updateWordsStatDisplay(0, 0); 
            
            this.#resetStopwatch(); // Reset stopwatch when closing
        });

        // Textarea Input Event
        this.ui.onArea1Input(() => {
            this.#updateAppState();
        });

        // Range Slider Input Event (WPM change)
        this.rangeSlider.range.addEventListener("input", () => {
            this.#handleWpmChange();
        });
        // Range Slider Label Blur Event (manual WPM input change)
        this.rangeSlider.label.addEventListener("blur", () => {
            this.#handleWpmChange();
        });

        // Forward and Backward Buttons
        this.ui.onForwardBtnClick(() => {
            this.#jumpWord(1);
        });

        this.ui.onBackwardBtnClick(() => {
            this.#jumpWord(-1);
        });

        // Visibility Change Listener for tab/window focus
        document.addEventListener('visibilitychange', this.#handleVisibilityChange.bind(this));
    }

    /**
     * @private
     * @description Handles WPM changes from the slider or direct input, updating display and playback.
     */
    #handleWpmChange() {
        this.#updateReadingTime();
        this.#updateWordsAndWPMDisplay(); // Also update WPM on the stats display
        if (this.isPlaying) {
            this.#pauseReading();
            this.#startReading();
        }
        // Update word stat display regardless of playing state to show current word / new total
        this.ui.updateWordsStatDisplay(this.currentWordIndex, this.ui.area2Words.length);
    }

    /**
     * @private
     * @description Updates the application's overall state, including text truncation, word count, and start button state.
     */
    #updateAppState() {
        let currentText = this.ui.getArea1Value();
        const { truncatedText, isTruncated } = this.textProcessor.truncateText(currentText);

        if (isTruncated) {
            this.ui.setArea1Value(truncatedText);
            this.ui.showFlashingMessage(`Exceeded ${this.textProcessor.WORD_LIMIT}-word limit`);
        }

        const wordCount = this.textProcessor.getWordCount(this.ui.getArea1Value());
        this.ui.updateWordCount(wordCount);
        this.ui.setStartButtonState(wordCount < this.MIN_WORDS_FOR_START);
    }

    /**
     * @private
     * @description Updates the total words and WPM display in the UI.
     */
    #updateWordsAndWPMDisplay() {
        const wordCount = this.ui.area2Words.length;
        const wpm = this.rangeSlider.getValue();
        this.ui.updateWordsTotal(wordCount, wpm);
    }

    /**
     * @private
     * @description Calculates and updates the estimated total reading time display in the UI.
     */
    #updateReadingTime() {
        const wordCount = this.ui.area2Words.length;
        const wpm = this.rangeSlider.getValue();
        const readingTime = this.textProcessor.calculateReadingTime(wordCount, wpm);
        this.ui.updateClockTotal(readingTime);
    }

    /**
     * @private
     * @description Starts the word-by-word reading playback.
     */
    #startReading() {
        this.#pauseReading(); // Ensure previous interval is cleared

        const words = this.ui.area2Words;
        if (words.length === 0) {
            this.isPlaying = false;
            this.ui.setPlayPauseState(false);
            this.ui.showFlashingMessage("No text to play!");
            this.ui.updateWordsStatDisplay(0, 0);
            return;
        }

        const wpm = this.rangeSlider.getValue();
        // Calculate delay between words in milliseconds
        const intervalDelayMs = (60 * 1000) / wpm; 

        this.ui.updateWordsStatDisplay(this.currentWordIndex, words.length);

        this.playbackInterval = setInterval(() => {
            if (this.currentWordIndex < words.length) {
                this.ui.highlightWord(this.currentWordIndex, words.length);
                this.ui.updateWordsStatDisplay(this.currentWordIndex, words.length);
                this.currentWordIndex++;
            } else {
                // End of text reached
                this.#pauseReading(); // This will now also stop the stopwatch
                this.isPlaying = false;
                this.ui.setPlayPauseState(false);
                this.ui.clearHighlight();
                this.ui.showFlashingMessage("End of text reached!");
                
                // Display total words read at the end
                this.ui.updateWordsStatDisplay(words.length - 1, words.length); 
                
                // currentWordIndex remains at words.length for potential review via jumpWord
            }
        }, intervalDelayMs);

        this.#startStopwatch(); // Start the stopwatch when playback begins
    }

    /**
     * @private
     * @description Pauses the word-by-word reading playback.
     */
    #pauseReading() {
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
        this.#pauseStopwatch(); // Pause the stopwatch when playback pauses
    }

    /**
     * @private
     * @description Jumps the current word index forward or backward by a specified offset.
     * @param {number} offset - The number of words to jump (e.g., 1 for forward, -1 for backward).
     */
    #jumpWord(offset) {
        const wasPlaying = this.isPlaying; // Store current playback state
        this.#pauseReading(); // Pause playback and stopwatch

        const words = this.ui.area2Words;
        const totalWords = words.length;

        this.currentWordIndex += offset;

        // Ensure currentWordIndex stays within valid bounds: [0, totalWords - 1]
        if (totalWords > 0) {
            this.currentWordIndex = Math.max(0, Math.min(totalWords - 1, this.currentWordIndex));
        } else {
            this.currentWordIndex = 0; // No words, so index is 0
        }
        
        if (totalWords === 0) {
            this.ui.clearHighlight();
            this.ui.updateWordsStatDisplay(0, 0);
        } else {
            this.ui.highlightWord(this.currentWordIndex, totalWords);
            this.ui.updateWordsStatDisplay(this.currentWordIndex, totalWords);
        }

        // Resume playback and stopwatch if it was playing before the jump
        if (wasPlaying) {
            this.#startReading(); 
        }
    }

    // --- Stopwatch Methods ---

    /**
     * @private
     * @description Starts or resumes the stopwatch.
     */
    #startStopwatch() {
        if (!this.stopwatchInterval) { // Prevent multiple intervals
            this.startTime = Date.now(); // Record when it started/resumed
            this.stopwatchInterval = setInterval(() => {
                // Accumulate elapsed time since last update
                this.elapsedTime += Date.now() - this.startTime; 
                this.startTime = Date.now(); // Reset start time for next interval
                this.#updateStopwatchDisplay(); // Update UI
            }, 1000); // Update every second
        }
    }

    /**
     * @private
     * @description Pauses the stopwatch.
     */
    #pauseStopwatch() {
        if (this.stopwatchInterval) {
            clearInterval(this.stopwatchInterval);
            this.stopwatchInterval = null;
            // Accumulate any time elapsed since the last interval update before pausing
            this.elapsedTime += Date.now() - this.startTime;
        }
    }

    /**
     * @private
     * @description Resets the stopwatch to 00:00:00.
     */
    #resetStopwatch() {
        this.#pauseStopwatch(); // Ensure it's paused
        this.elapsedTime = 0;
        this.startTime = 0;
        this.#updateStopwatchDisplay(); // Update display to 00:00:00
    }

    /**
     * @private
     * @description Formats and updates the stopwatch display in the UI.
     */
    #updateStopwatchDisplay() {
        const totalSeconds = Math.floor(this.elapsedTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        this.ui.updateStopwatchDisplay(hours, minutes, seconds);
    }

    /**
     * @private
     * @description Handles changes in document visibility (tab/window focus).
     */
    #handleVisibilityChange() {
        if (document.hidden) {
            // Tab is hidden, pause if currently playing
            this.wasPlayingBeforeHidden = this.isPlaying; 
            if (this.isPlaying) { 
                this.#pauseReading(); // This will stop playback and stopwatch
                this.isPlaying = false; // Ensure App state is reflected
                this.ui.setPlayPauseState(false); // Update UI button to 'Play'
            }
        } else {
            // Tab is visible, resume if it was playing before being hidden
            if (this.wasPlayingBeforeHidden) {
                this.isPlaying = true; // Restore App state
                this.#startReading(); // This will resume playback and stopwatch
                this.ui.setPlayPauseState(true); // Update UI button to 'Pause'
            }
            this.wasPlayingBeforeHidden = false; // Reset the flag
        }
    }
}

// Initialize the App when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    new App();
});