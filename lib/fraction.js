// 分数（有理数）类，用于精确计算，避免浮点数精度丢失
class Fraction {
  constructor(numerator, denominator = 1) {
    if (denominator === 0) {
      throw new Error('分母不能为0');
    }

    // 处理符号
    if (denominator < 0) {
      numerator = -numerator;
      denominator = -denominator;
    }

    // 约分
    const gcd = this.gcd(Math.abs(numerator), Math.abs(denominator));
    this.numerator = numerator / gcd;
    this.denominator = denominator / gcd;
  }

  // 最大公约数
  gcd(a, b) {
    if (b === 0) return a;
    return this.gcd(b, a % b);
  }

  // 从字符串创建分数（支持整数和小数）
  static fromString(str) {
    if (str.includes('.')) {
      // 小数：如 "3.14" -> 314/100
      const parts = str.split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1];
      const denominator = Math.pow(10, decimalPart.length);
      const numerator = parseInt(integerPart) * denominator + 
                       (integerPart.startsWith('-') ? -1 : 1) * parseInt(decimalPart);
      return new Fraction(numerator, denominator);
    } else {
      // 整数
      return new Fraction(parseInt(str, 10), 1);
    }
  }

  // 从数字创建分数（用于变量值等）
  static fromNumber(num) {
    if (Number.isInteger(num)) {
      return new Fraction(num, 1);
    }
    // 对于浮点数，转换为分数
    const str = num.toString();
    return Fraction.fromString(str);
  }

  // 加法
  add(other) {
    if (typeof other === 'number') {
      other = Fraction.fromNumber(other);
    }
    const num = this.numerator * other.denominator + other.numerator * this.denominator;
    const den = this.denominator * other.denominator;
    return new Fraction(num, den);
  }

  // 减法
  subtract(other) {
    if (typeof other === 'number') {
      other = Fraction.fromNumber(other);
    }
    const num = this.numerator * other.denominator - other.numerator * this.denominator;
    const den = this.denominator * other.denominator;
    return new Fraction(num, den);
  }

  // 乘法
  multiply(other) {
    if (typeof other === 'number') {
      other = Fraction.fromNumber(other);
    }
    const num = this.numerator * other.numerator;
    const den = this.denominator * other.denominator;
    return new Fraction(num, den);
  }

  // 除法
  divide(other) {
    if (typeof other === 'number') {
      other = Fraction.fromNumber(other);
    }
    if (other.numerator === 0) {
      return Infinity;
    }
    const num = this.numerator * other.denominator;
    const den = this.denominator * other.numerator;
    return new Fraction(num, den);
  }

  // 取负
  negate() {
    return new Fraction(-this.numerator, this.denominator);
  }

  // 转换为数字（用于最终结果）
  toNumber() {
    return this.numerator / this.denominator;
  }

  // 检查是否为有限值
  isFinite() {
    return isFinite(this.numerator) && isFinite(this.denominator);
  }

  // 检查是否为零
  isZero() {
    return this.numerator === 0;
  }

  // 获取数值（用于比较）
  valueOf() {
    return this.toNumber();
  }
}

export { Fraction };

