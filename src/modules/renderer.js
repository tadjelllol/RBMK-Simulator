/**
 * Renderer class for handling canvas rendering
 */
export class Renderer {
  /**
   * Create a new Renderer
   * @param {HTMLCanvasElement} canvas - The canvas element to render to
   */
  constructor(canvas) {
    this.canvasObj = canvas;
    this.canvas = canvas.getContext("2d");
    this.canvas.imageSmoothingEnabled = false;
  }

  /**
   * Draw an image on the canvas
   * @param {string} type - The type of draw operation
   * @param {Object} args - The arguments for the draw operation
   */
  draw(type, args) {
    if (type === "image") {
      /*
        args:
          - img: Image
          
          - x: int // X position of the image
          - y: int // Y position of the image
          - w: int // Width of the image
          - h: int // Height of the image

          / crop: true
          - sX: int // X position of the cropped image
          - sY: int // Y position of the cropped image
          - sW: int // Width of the cropped image
          - sH: int // Height of the cropped image
      */

      // Skip drawing if image is not loaded or in broken state
      if (!args.img || !args.img.complete || args.img.naturalWidth === 0) {
        return;
      }

      if (args.crop) {
        this.canvas.drawImage(
          args.img,
          args.sX,
          args.sY,
          args.sW,
          args.sH,
          args.x,
          args.y,
          args.w,
          args.h
        );
      } else {
        this.canvas.drawImage(args.img, args.x, args.y, args.w, args.h);
      }
    }
  }

  /**
   * Reset the canvas
   */
  reset() {
    this.canvas.imageSmoothingEnabled = false;
    this.canvas.clearRect(0, 0, this.canvas.canvas.width, this.canvas.canvas.height);
  }

  /**
   * Draw a rectangle on the canvas
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @param {number} width - The width
   * @param {number} height - The height
   * @param {string} fillStyle - The fill style
   * @param {string} strokeStyle - The stroke style
   */
  drawRect(x, y, width, height, fillStyle, strokeStyle = null) {
    if (fillStyle) {
      this.canvas.fillStyle = fillStyle;
      this.canvas.fillRect(x, y, width, height);
    }
    
    if (strokeStyle) {
      this.canvas.strokeStyle = strokeStyle;
      this.canvas.strokeRect(x, y, width, height);
    }
  }

  /**
   * Draw text on the canvas
   * @param {string} text - The text to draw
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @param {string} fillStyle - The fill style
   * @param {string} font - The font
   */
  drawText(text, x, y, fillStyle = 'white', font = '12px monospace') {
    this.canvas.font = font;
    this.canvas.fillStyle = fillStyle;
    this.canvas.fillText(text, x, y);
  }

  /**
   * Draw a line on the canvas
   * @param {number} x1 - The starting x position
   * @param {number} y1 - The starting y position
   * @param {number} x2 - The ending x position
   * @param {number} y2 - The ending y position
   * @param {string} strokeStyle - The stroke style
   * @param {number} lineWidth - The line width
   */
  drawLine(x1, y1, x2, y2, strokeStyle = 'white', lineWidth = 1) {
    this.canvas.beginPath();
    this.canvas.moveTo(x1, y1);
    this.canvas.lineTo(x2, y2);
    this.canvas.strokeStyle = strokeStyle;
    this.canvas.lineWidth = lineWidth;
    this.canvas.stroke();
  }

  /**
   * Draw a circle on the canvas
   * @param {number} x - The x position of the center
   * @param {number} y - The y position of the center
   * @param {number} radius - The radius
   * @param {string} fillStyle - The fill style
   * @param {string} strokeStyle - The stroke style
   */
  drawCircle(x, y, radius, fillStyle = null, strokeStyle = null) {
    this.canvas.beginPath();
    this.canvas.arc(x, y, radius, 0, Math.PI * 2);
    
    if (fillStyle) {
      this.canvas.fillStyle = fillStyle;
      this.canvas.fill();
    }
    
    if (strokeStyle) {
      this.canvas.strokeStyle = strokeStyle;
      this.canvas.stroke();
    }
  }
}