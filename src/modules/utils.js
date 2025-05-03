// Utility functions for the RBMK Simulator

/**
 * Quickly calculate a value based on a ratio
 * @param {number} val - The value to calculate
 * @param {number} mult - The multiplier
 * @param {number} div - The divisor
 * @returns {number} - The calculated value
 */
export function quickMath(val, mult, div) {
  return Math.min(Math.ceil(val * mult / div), mult);
}

/**
 * Fill an array with null values
 * @param {Array} array - The array to fill
 * @param {number} amount - The number of elements to fill
 * @returns {Array} - The filled array
 */
export function fillArray(array, amount) {
  const fakeArray = array.slice();
  for (let i = 0; i < amount; i++) {
    fakeArray[i] = null;
  }
  return fakeArray;
}

/**
 * Find a constructor in an array by name
 * @param {Array} array - The array of constructors
 * @param {string} name - The name to find
 * @returns {Function|null} - The found constructor or null
 */
export function findConstructor(array, name) {
  let constructor = null;
  array.forEach(ah => {
    const thing = new ah();
    if (thing.constructor.name === name) {
      constructor = ah;
    }
  });
  return constructor;
}

/**
 * Calculate the average of values in an array
 * @param {Array<number>} array - The array of numbers
 * @returns {number} - The average value
 */
export function averageCalc(array) {
  if (!array.length) return 0;
  
  const number = array.reduce((acc, item) => acc + item, 0);
  const result = number / array.length;
  
  return isNaN(result) ? 0 : result;
}

/**
 * Clamp a value between a minimum and maximum
 * @param {number} val - The value to clamp
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} - The clamped value
 */
export function clamp(val, min, max) {
  if (val >= max) {
    return max;
  } else if (val <= min) {
    return min;
  } else {
    return val;
  }
}

/**
 * Format a number to a fixed decimal places
 * @param {number} value - The value to format
 * @param {number} decimals - The number of decimal places
 * @returns {string} - The formatted value
 */
export function formatNumber(value, decimals = 1) {
  return (isNaN(value) ? 0 : value).toFixed(decimals);
}

/**
 * Create an HTML element with properties
 * @param {string} tag - The tag name
 * @param {Object} props - The properties to set
 * @param {string|Node} [content] - The content to append
 * @returns {HTMLElement} - The created element
 */
export function createElement(tag, props, content) {
  const element = document.createElement(tag);
  
  if (props) {
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'style' && typeof value === 'object') {
        Object.entries(value).forEach(([styleKey, styleValue]) => {
          element.style[styleKey] = styleValue;
        });
      } else if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.substring(2).toLowerCase(), value);
      } else {
        element.setAttribute(key, value);
      }
    });
  }
  
  if (content) {
    if (typeof content === 'string') {
      element.innerHTML = content;
    } else {
      element.appendChild(content);
    }
  }
  
  return element;
}

/**
 * Create a debounced function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}