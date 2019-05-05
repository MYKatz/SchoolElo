const express = require('express');
const app = express();
const exphbs  = require('express-handlebars');

require('dotenv').config()

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use('/assets', express.static("assets"))

var schools = []

//mongoose stuff
var mongoose = require("mongoose");
mongoose.promise = global.Promise;
mongoose.connect(process.env.MONGO_URI);

// schemas

var School = require('./models/school.js');

// helpers

function updateList(){
    tmp = [];
    School.find({}).sort({elo: -1}).exec(function(err, docs){
        var rank = 0;
        var lastelo = -1;
        var r = "";
        for(var i = 0; i < docs.length; i++){
            if(docs[i].elo != lastelo){
                rank++;
                lastelo = docs[i].elo;
                r = rank.toString()
            }
            else{
                r = "=" + rank.toString()
            }
            if(i < (docs.length-1) && docs[i].elo == docs[i+1].elo){
                r = "=" + rank.toString()
            }
            obj = {name: docs[i].name, elo: docs[i].elo, rank: r}
            max = Math.max(...docs[i].history) + 5
            min = Math.min(...docs[i].history) - 5
            hist = ""
            for(var j = 0; j < docs[i].history.length; j++){
                hist += (j*25).toString() + "," + (50 - (50 * (docs[i].history[j] - min) / (max - min))) + " "
            }
            obj.history = '"' + hist + '"'
            tmp.push(obj)
        }
    });
    schools = tmp;
}

function resetHistory(){
    School.updateMany({}, {history: [1000, 1000, 1000, 1000, 1000]}, {multi: true}, function(err, s){
        console.log("updated")
    });
}

function updateHistory(){
    School.find({}).exec(function(err, docs){
        for(var i = 0; i < docs.length; i++){
            School.findOne({name: docs[i].name}, function(err, doc){
                newArr = doc.history.slice(1);
                newArr.push(doc.elo);
                doc.history = newArr;
                doc.save();
            })
        }
    });
}

//updateHistory();
updateList();
// === routes ===


app.get('/', function(req, res){
    res.render('home', {
        school: schools
    })
});

app.get('/addschool/:name', function(req, res){
    var newSchool = new School();
    newSchool.name = req.params.name;
    newSchool.elo = 1000;
    newSchool.history = [];
    newSchool.save(function(err, s){
        res.send(s.name)
    })
});

app.get('/schools', function(req, res){
    School.find({}).sort({elo: -1}).exec(function(err, docs){
        res.send(docs);
    });
});

app.listen(80, () => console.log('Server started on port 80'));