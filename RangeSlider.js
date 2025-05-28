// RangeSlider.js
export class RangeSlider {
  constructor(rangeElementId, labelElementSelector, min, max, messageHandler = null) {
    this.range = document.getElementById(rangeElementId);
    this.label = document.querySelector(labelElementSelector);
    this.min = min;
    this.max = max;
    this.messageHandler = messageHandler;

    if (!this.range || !this.label) {
      this.flashMessage("Range slider elements not found.");
      return;
    }

    this.init();
  }

  init() {
    this.setLabel(this.range.value); // Set initial label value
    this.range.addEventListener("input", this.handleRangeInput.bind(this));
    this.label.addEventListener("input", this.handleLabelInput.bind(this));
    this.label.addEventListener("blur", this.handleLabelBlur.bind(this));
  }

  setLabel(value) {
    this.label.value = value;
  }

  handleRangeInput(e) {
    this.setLabel(e.target.value);
  }

  handleLabelInput(e) {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digit characters
    e.target.value = value;

    if (value !== "" && (parseInt(value) < this.min || parseInt(value) > this.max)) {
      e.target.classList.add("out-of-range");
    } else {
      e.target.classList.remove("out-of-range");
    }
  }

  handleLabelBlur(e) {
    let value = parseInt(e.target.value);
    if (isNaN(value) || value < this.min) value = this.min;
    else if (value > this.max) value = this.max;

    this.range.value = value;
    this.setLabel(value);
    e.target.classList.remove("out-of-range");
  }

  getValue() {
    return parseInt(this.range.value);
  }

  flashMessage(msg) {
    if (typeof this.messageHandler === "function") {
      this.messageHandler(msg);
    }
  }
}
