const express = require('express');
const app = express();
const exphbs  = require('express-handlebars');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use('/assets', express.static("assets"))

// === routes ===

app.get('/', function(req, res){
    res.render('home')
});

app.listen(80, () => console.log('Server started on port 80'));