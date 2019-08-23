import Color from './Color';

export default class ColorMap {
    constructor () {
        this.keys = [];
        this.colors = [];

        this.minValue = 0;
        this.maxValue = 0;
    };

    getComponent (val) {
        let ret = 0.0;

        if (val <= -0.75) ret = 0.0;
        else if (val <= -0.25) ret = this.interpolate(val, 0.0, -0.75, 1.0, -0.25);
        else if (val <= 0.25) ret = 1.0;
        else if (val <= 0.75) ret = this.interpolate(val, 1.0, 0.25, 0.0, 0.75);
        else ret = 0.0;

        return Math.round(ret * 1e6) / 1e6;
    };

    interpolate (val, y0, x0, y1, x1) {
        return (val - x0) * (y1 - y0) / (x1 - x0) + y0;
    };

    init (vals, minValue, maxValue) {
        this.keys = [];
        this.colors = [];

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
        } else {
            let incPos = 1.5 / (vals - 1);
            for (let i = -0.75; i <= 0.75; i+= incPos) {
                this.keys.push(i);
            }
        }

        this.keys.sort(function(a, b) { return a - b });

        let inc = 1.3 / (this.keys.length - 1.0);
        for (let i = 0; i < this.keys.length; i++) {
            let val = i * inc - 0.6;

            let red = this.getComponent(val + 0.5);
            let green = this.getComponent(val);
            let blue = this.getComponent(val - 0.5);

            let r = Math.ceil(red * 255.0);
            let g = Math.ceil(green * 255.0);
            let b = Math.ceil(blue * 255.0);
            let color = new Color(r, g, b);

            this.colors.push(color);
        }

        this.colors.reverse();
    };

    getColor (val) {
        for (let i = 0; i < this.keys.length; i++) {
            if(this.keys[i] >= val) {
                return this.colors[i];
            }
        }

        return this.getColor(this.keys[this.keys.length - 1]);
    };

    getMappedValue (val) {
        let d = this.maxValue - this.minValue;
        return (((val - this.minValue) / d) * 1.5) - 0.75;
    };

    getValue (mappedValue) {
        let d = this.maxValue - this.minValue;
        return ((mappedValue + 0.75) / 1.5) * (d) + this.minValue;
    };

    getValueInterval (value1, value2) {
        let val1 = this.getMappedValue(value1);
        let val2 = this.getMappedValue(value2);

        let keys = this.keys
            .filter(function (key){
                return key < Math.max(val1, val2) && key > Math.min(val1, val2)
            })
            .sort((a,b) => parseFloat(a) - parseFloat(b));

        let ret = {};
        for (let i = 0; i < keys.length; i++){
            ret[this.getValue(parseFloat(keys[i]))] = this.colors[keys[i]];
        }

        return ret;
    };
}