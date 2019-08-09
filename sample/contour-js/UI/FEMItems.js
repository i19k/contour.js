function FEMItem(){
    this.key = "aaa";

    try{
        this.constructor.Items.push(this);
    }

    catch(err){
        this.constructor.Items = [];
        this.constructor.Items.push(this);
    }
}

Object.assign(FEMItem.prototype, {
    FromDict: function (items){
        for(key in items){
            this[key] = items[key];
        }
    }
});

function LoadPattern(){
    FEMItem.call(this);
}

LoadPattern.prototype = Object.assign(Object.create( FEMItem.prototype ), {
    constructor: LoadPattern,
});


var lp = new LoadPattern();
var lp2 = new LoadPattern();
lp.FromDict({deneme : "adsf", deneme2: "qwer"})
console.log(lp.deneme2);

