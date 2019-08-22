

Color.prototype = Object();
Color.prototype.constructor = function (r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
};

Color.prototype.toRGBString = function () {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
};