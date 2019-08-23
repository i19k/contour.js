const express = require('express');
const app = express();
const path = require('path');
const port = 3000;
const router = express.Router();

router.get('/',function(req,res){
    return res.sendFile(path.join(__dirname+'/../src/index.html'));
});

app.use('/', router);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));