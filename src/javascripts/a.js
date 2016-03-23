console.log('I\'m a.js'); //eslint-disable-line
require('../stylesheets/c.styl');
var logo = require('images/quiz/ci_cash_logo.png');
var img = new Image();
img.src = logo;

document.getElementById('jsImg').appendChild(img);
