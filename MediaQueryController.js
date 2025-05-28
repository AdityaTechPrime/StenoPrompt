// MediaQueryController.js

/**
 * @class MediaQueryController
 * @description Manages UI changes based on media queries (screen size).
 */
export class MediaQueryController {
    constructor() {
        this.mediaQuery = window.matchMedia('(max-width: 600px)');
        this.speedHeading = document.querySelector('.speed-heading-text'); // Targeted by new class in HTML
        this.rangeContainer = document.querySelector('.range-container');

        if (!this.speedHeading || !this.rangeContainer) {
            console.error("MediaQueryController: Required UI elements not found.");
            return;
        }

        this.init();
    }

    /**
     * @description Initializes the media query listener and applies initial styles.
     */
    init() {
        // Add listener for media query changes
        this.mediaQuery.addListener(this.#handleMediaQueryChange.bind(this));

        // Apply initial styles based on current screen size
        this.#handleMediaQueryChange(this.mediaQuery);
    }

    /**
     * @private
     * @description Handles changes to the media query state.
     * @param {MediaQueryListEvent} event - The media query event object.
     */
    #handleMediaQueryChange(event) {
        if (event.matches) {
            // Screen is 600px or less
            this.speedHeading.textContent = "Speed W.P.M.";
            this.rangeContainer.classList.add('range-container-small');
        } else {
            // Screen is wider than 600px
            this.speedHeading.textContent = "Select your speed in Words Per Minute (WPM)";
            this.rangeContainer.classList.remove('range-container-small');
        }
    }
}