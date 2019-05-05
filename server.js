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
        for(var i = 0; i < docs.length; i++){
            obj = {name: docs[i].name, elo: docs[i].elo, rank: i+1}
            if(docs[i].history.length > 5){
                obj.history = "" //process this somehow
            }
            else{
                obj.history = "0,25 100,25"
            }
            tmp.push(obj)
        }
    });
    schools = tmp;
}

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