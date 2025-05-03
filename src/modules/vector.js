/**
 * Vector3 class for 3D vector operations
 */
export class Vec3 {
  /**
   * Create a new Vec3
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {number} z - The z coordinate
   */
  constructor(x, y, z) {
    this.xCoord = x;
    this.yCoord = y;
    this.zCoord = z;
  }

  /**
   * Rotate the vector around the Y axis
   * @param {number} amount - The rotation amount in radians
   */
  rotateAroundY(amount) {
    const cos = Math.cos(amount);
    const sin = Math.sin(amount);
    
    const newX = this.xCoord * cos - this.zCoord * sin;
    const newZ = this.xCoord * sin + this.zCoord * cos;
    
    this.xCoord = newX;
    this.zCoord = newZ;
  }

  /**
   * Get the length of the vector
   * @returns {number} - The length of the vector
   */
  length() {
    return Math.sqrt(this.xCoord * this.xCoord + this.yCoord * this.yCoord + this.zCoord * this.zCoord);
  }

  /**
   * Normalize the vector
   * @returns {Vec3} - The normalized vector
   */
  normalize() {
    const len = this.length();
    if (len === 0) return this;
    
    this.xCoord /= len;
    this.yCoord /= len;
    this.zCoord /= len;
    
    return this;
  }

  /**
   * Add another vector to this vector
   * @param {Vec3} vec - The vector to add
   * @returns {Vec3} - This vector after addition
   */
  add(vec) {
    this.xCoord += vec.xCoord;
    this.yCoord += vec.yCoord;
    this.zCoord += vec.zCoord;
    
    return this;
  }

  /**
   * Subtract another vector from this vector
   * @param {Vec3} vec - The vector to subtract
   * @returns {Vec3} - This vector after subtraction
   */
  subtract(vec) {
    this.xCoord -= vec.xCoord;
    this.yCoord -= vec.yCoord;
    this.zCoord -= vec.zCoord;
    
    return this;
  }

  /**
   * Scale this vector by a scalar value
   * @param {number} scalar - The scalar value
   * @returns {Vec3} - This vector after scaling
   */
  scale(scalar) {
    this.xCoord *= scalar;
    this.yCoord *= scalar;
    this.zCoord *= scalar;
    
    return this;
  }

  /**
   * Create a copy of this vector
   * @returns {Vec3} - A new vector with the same coordinates
   */
  clone() {
    return new Vec3(this.xCoord, this.yCoord, this.zCoord);
  }
}