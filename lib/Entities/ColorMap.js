

ColorMap.prototype = Object();
ColorMap.prototype.constructor = function () {
    this.colors = {};
    this.rgbColors = {};

    this.minValue = 0;
    this.maxValue = 0;
};

ColorMap.prototype.getMain = function(val) {
    let ret = 0.0;

    if (val <= -0.75) ret = 0.0;
    else if (val <= -0.25) ret = this.interpolate(val, 0.0, -0.75, 1.0, -0.25);
    else if (val <= 0.25) ret = 1.0;
    else if (val <= 0.75) ret = this.interpolate(val, 1.0, 0.25, 0.0, 0.75);
    else ret = 0.0;

    return Math.round(ret * 1e6) / 1e6;
};

ColorMap.prototype.interpolate = function(val, y0, x0, y1, x1) {
    return (val - x0) * (y1 - y0) / (x1 - x0) + y0;
};

ColorMap.prototype.init = function(vals, minValue, maxValue) {
    this.keys = [];
    this.colors = [];
    this.rgbColors = [];

    this.minValue = minValue;
    this.maxValue = maxValue;

    if (Array.isArray(vals)) {
        this.keys.push(this.getMappedValue(this.minValue));
        this.keys.push(this.getMappedValue(this.maxValue));

        for (let i = 0; i < vals.length; i++) {
            if (vals[i] > minValue && vals[i] < maxValue) {
                this.keys.push(this.getMappedValue(vals[i]));
            }
        }
    }
    else {
        let incPos = 1.5 / (vals - 1);
        for (let i = -0.75; i <= 0.75; i+= incPos) {
            this.keys.push(i);
        }
    }

    this.keys.sort(function(a, b) { return a - b });

    let inc = 1.3 / (this.keys.length - 1.0);
    for (let i = 0; i < this.keys.length; i++) {
        let val = i * inc - 0.6;

        let red = this.getMain(val + 0.5);
        let green = this.getMain(val);
        let blue = this.getMain(val - 0.5);

        let color = 'rgb('+ Math.ceil(red * 255.0) + ','
            + Math.ceil(green * 255.0) + ','
            + Math.ceil(blue * 255.0) +')';

        this.colors.push(new THREE.Color(color));
        this.rgbColors.push(color);
    }

    this.colors.reverse();
    this.rgbColors.reverse();

};

ColorMap.prototype.getColor = function(val) {
    for (let i = 0; i < this.keys.length; i++) {
        if(this.keys[i] >= val) {
            return this.colors[i];
        }
    }

    return this.getColor(this.keys[this.keys.length - 1]);
};

ColorMap.prototype.getRGBColor = function(val) {
    for (let i = 0; i < this.keys.length; i++) {
        if(this.keys[i] >= val) {
            return this.rgbColors[i];
        }
    }

    return this.getRGBColor(this.keys[this.keys.length - 1]);
};

ColorMap.prototype.getMappedValue = function(val) {
    let d = this.maxValue - this.minValue;
    return (((val - this.minValue) / d) * 1.5) - 0.75;
};

ColorMap.prototype.getValue = function(mappedValue) {
    let d = this.maxValue - this.minValue;
    return ((mappedValue + 0.75) / 1.5) * (d) + this.minValue;
};

module.exports = ColorMap;