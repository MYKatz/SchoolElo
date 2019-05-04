const express = require('express');
const app = express();
const exphbs  = require('express-handlebars');

require('dotenv').config()

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use('/assets', express.static("assets"))

// === routes ===

app.get('/', function(req, res){
    res.render('home', {
        school: [
            {name: "Stanford", rank: 1, elo: 1700},
            {name: "Harvard", rank: 2, elo: 1500},
            {name: "MIT", rank: 3, elo: 1400},
            {name: "Carnegie Mellon", rank: 4, elo: 1390}
        ]
    })
});

app.listen(80, () => console.log('Server started on port 80'));