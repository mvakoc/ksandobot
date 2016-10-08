'use strict';

var _restify = require('restify');

var _restify2 = _interopRequireDefault(_restify);

var _botbuilder = require('botbuilder');

var _botbuilder2 = _interopRequireDefault(_botbuilder);

var _questions = require('./questions');

var _questions2 = _interopRequireDefault(_questions);

var _celebs = require('./celebs');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// Setting up the server
var server = _restify2.default.createServer();
server.listen(3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new _botbuilder2.default.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_SECRET
});

var bot = new _botbuilder2.default.UniversalBot(connector);

server.post('/api/messages', connector.listen());

bot.dialog('/', [function (session, args, next) {
    session.send('Ahoj, já jsem tvůj pomocník s výběrem kšand. Odpověz mi prosím na pár otázek a já ti řeknu jaké kšandy se k tobě hodí'), session.send('A jako bonus ti řeknu jaká celebrita by si vybrala stejně jako ty :-)'), session.userData.answers = [];
    next();
}].concat(_toConsumableArray(_questions2.default.map(function (question) {
    return function (session, result, next) {
        if (result.response) {
            session.userData.answers.push(result.response);
        }
        var card = new _botbuilder2.default.HeroCard(session).text(question.text).buttons(question.answers.map(function (answer) {
            return _botbuilder2.default.CardAction.imBack(session, answer.text, answer.text);
        }));
        var msg = new _botbuilder2.default.Message(session).attachments([card]);
        _botbuilder2.default.Prompts.text(session, msg);
    };
})), [function (session, result) {
    if (result.response) {
        session.userData.answers.push(result.response);
    }
    var scores = session.userData.answers.map(function (response, index) {
        return _questions2.default[index].answers.find(function (answer) {
            return answer.text === response;
        }).scores;
    }).reduce(function (prev, curr) {
        return prev.map(function (value, index) {
            return value + curr[index];
        });
    }, [0, 0, 0, 0, 0, 0, 0]);
    var celeb = (0, _celebs.returnCeleb)(scores.indexOf(Math.max.apply(Math, _toConsumableArray(scores))));
    var card = new _botbuilder2.default.HeroCard(session).title(celeb.name).images([_botbuilder2.default.CardImage.create(session, celeb.picture)]);
    var msg = new _botbuilder2.default.Message(session).attachments([card]);
    session.send(msg);

    session.send('Zajímavé, vy jste jasný:');

    var braces = new _botbuilder2.default.Message(session).attachmentLayout(_botbuilder2.default.AttachmentLayout.carousel).attachments(celeb.braces.map(function (brace) {
        return new _botbuilder2.default.HeroCard(session).images([_botbuilder2.default.CardImage.create(session, brace.picture)]).buttons([_botbuilder2.default.CardAction.openUrl(session, brace.url, brace.name)]);
    }));
    session.send(braces);
}]));