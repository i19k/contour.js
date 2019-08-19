const Contour = require('../lib');
const fs = require('fs');

let path = 'D:\\Belgeler\\YAZILIM\\github\\mclittle\\Contour.js\\test\\model1.json';

fs.readFile(path, (err, data) => {
    if (err) throw err;
    let content = JSON.parse(data);

    let contour = new Contour('#vp');

    Render(model, myThree.args);
    myThree.zoomToFit();
});