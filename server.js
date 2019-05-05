const express = require('express');
const app = express();
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser')

const crypto = require("crypto");

require('dotenv').config()

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use('/assets', express.static("assets"));

app.use(bodyParser.urlencoded({
    extended: true
}));

var schools = [];
var counter = 0;
var matches = {

};

//mongoose stuff
var mongoose = require("mongoose");
mongoose.promise = global.Promise;
mongoose.connect(process.env.MONGO_URI);

// schemas

var School = require('./models/school.js');
var Match = require('./models/match.js');


// helpers

function updateList(){
    tmp = [];
    School.find({}).sort({elo: -1}).exec(function(err, docs){
        var rank = 0;
        var lastelo = -1;
        var r = "";
        for(var i = 0; i < docs.length; i++){
            if(docs[i].elo != lastelo){
                rank = i + 1;
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
        schools = tmp;
    });
}

function resetHistory(){
    School.updateMany({}, {history: [1000, 1000, 1000, 1000, 1000], elo: 1000}, {multi: true}, function(err, s){
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

function removeMatch(id){
    if(matches[id]){
        delete matches[id]
    }
}

setInterval(updateList, 30000); //update list every half-minute

//updateHistory();
//resetHistory();
updateList();
// === routes ===


app.get('/', function(req, res){
    res.render('home', {
        school: schools
    })
});

app.get('/api/newMatch', function(req, res){
    var school1 = Math.floor(Math.random() * 50)
    var school2 = Math.floor(Math.random() * 50)
    while(school1 == school2){
        school2 = Math.floor(Math.random() * 50)
    }
    toSend = {school1: null, school2: null}
    var hash = crypto.randomBytes(20).toString('hex');
    School.findOne().skip(school1).exec(function(err, s1){
        toSend.school1 = s1.name;
        School.findOne().skip(school2).exec(function(err, s2){
            toSend.school2 = s2.name
            matches[hash] = toSend;
            toSend.hash = hash;
            res.send(toSend);
        });
    });
    //setTimeout(removeMatch(hash), 300000); //5 minute delay, then delete match
});

app.post('/api/matchResult', function(req, res){
    //receives json in form {result: Number, hash: str}
    var k = 50 //K, elo rating constant. This will be 50 for now to slightly increase volatility.
    if(matches[req.body.hash] && req.body.result <= 1 && req.body.result >= 0){
        var match = matches[req.body.hash] //just in case the match gets removed from memory while we're processing it
        School.findOne({name: match.school1}, function(err, s1){
            School.findOne({name: match.school2}, function(err, s2){
                var Ra = s1.elo;
                var Rb = s2.elo;
                var Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400));
                var Eb =  1 - Ea;
                var Rap = Ra + k * (req.body.result - Ea);
                var Rbp = Rb + k * ((1 - req.body.result) - Eb);
                s1.elo = parseInt(Rap);
                s2.elo = parseInt(Rbp);
                s1.save()
                s2.save()
                var newMatch = new Match();
                newMatch.school1 = s1.name;
                newMatch.school2 = s2.name;
                newMatch.result = req.body.result;
                newMatch.save();
                res.send({success: true});
                counter++;
                console.log(counter);
                if(counter > 99){
                    counter = 0;
                    updateHistory();
                }
            })
        })
    }
    else{
        res.send("Error");
        //match expired or malformed result. Probably a result of some meddling on the client-side
    }
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