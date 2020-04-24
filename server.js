const express = require('express')
const cookieSession = require('cookie-session')
const path = require('path')
const bodyParser = require('body-parser');
const port = 3000
const fs = require('fs');
const app = express()

const file = {
    write: function (path, obj) {
        const writedata = new Uint8Array(Buffer.from(JSON.stringify(obj)));
        fs.writeFile(path, writedata, (err) => {
            if (err) throw err;
        });
    }
};

const lobby = {
    join: function (req, type, lobbyid, callback) {
        const lobbyfile = path.join(__dirname + '/data/lobbys/' + type + 'lobby' + lobbyid + '.json');
        fs.readFile(lobbyfile, (err, data) => {
            if (err) throw err;
            const obj = JSON.parse(data);

            if (obj.playersQueued.length > obj.stats.maxQueue) {
                console.log("Queue full");
                callback();
                return;
            }

            console.log("Updating lobby in the session.");
            req.session.lobby = {
                id: lobbyid, type: type,
            };

            const index = obj.playersQueued.indexOf(req.session.user.id);
            if (index >= 0) {
                console.log("User " + req.session.user.username + " already joined.");
                callback();
                return;
            }

            obj.playersQueued.push(req.session.user.id);
            file.write(lobbyfile, obj);
            console.log(req.session.user.username + " joined the queue!");
            callback();
        });
    },

    leave: function (req, type, lobbyid, callback) {
        req.session.lobby = {};

        const lobbyfile = path.join(__dirname + '/data/lobbys/' + type + 'lobby' + lobbyid + '.json');
        fs.readFile(lobbyfile, (err, data) => {
            if (err) throw err;

            const obj = JSON.parse(data);
            const index = obj.playersQueued.indexOf(req.session.user.id);
            if (index < 0) {
                console.log("User " + req.session.user.username + " is not in the queue.");
                callback();
                return;
            }

            obj.playersQueued.splice(index, 1);
            file.write(lobbyfile, obj);
            console.log(req.session.user.username + " left the queue!");
            callback();
        });
    }
};

app.set('trust proxy', 1)

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', express.static('pages'));
app.use(cookieSession({
    name: 'session',
    secret: '1f232b3eqybfcmd123rythgfbdnvs',
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: false
}));

app.get('/login', function (req, res) {
    res.sendFile(path.join(__dirname + '/pages/login.html'));
});

app.post('/lobby/:type/:id/join', function (req, res) {
    lobby.join(req, req.params.type, req.params.id, function () {
        res.setHeader('Content-Type', 'application/json');
        res.json(req.session.lobby);
    });
});

app.post('/lobby/:type/:id/leave', function (req, res) {
    lobby.leave(req, req.params.type, req.params.id, function () {
        res.setHeader('Content-Type', 'application/json');
        res.json(req.session.lobby);
    });
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/pages/game/main.html'));
});

app.get('/nav', function (req, res) {
    res.sendFile(path.join(__dirname + '/pages/nav.html'));
});

app.get('/account', function (req, res) {
    res.sendFile(path.join(__dirname + '/pages/account.html'));
});

app.get('/play', function (req, res) {
    res.sendFile(path.join(__dirname + '/pages/game/play.html'));
});

app.get('/login/result', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    const user = req.session.user;
    const payload = typeof (user) == "undefined" || user == null ? {} : {
        user: {
            id: user.id,
            username: user.username,
            status: user.status,
        },
        lobby: req.session.lobby
    };
    res.end(JSON.stringify(payload, null, 3));
});

app.get('/logout', function (req, res) {
    const file = path.join(__dirname + '/data/accounts/accounts.json');
    fs.readFile(file, (err, data) => {
        if (err) throw err;

        const accounts = JSON.parse(data);
        const account = accounts.find(_ => _.username == req.session.user.username);
        account.status = "offline"

        const writedata = new Uint8Array(Buffer.from(JSON.stringify(accounts)));
        fs.writeFile(file, writedata, (err) => {
            if (err) throw err;

            console.log(account.status);

            lobby.leave(req, req.session.lobby.type, req.session.lobby.id,
                () => { req.session = null; res.redirect('/'); });
        });
    });
});

app.post('/login', function (req, res) {
    const file = path.join(__dirname + '/data/accounts/accounts.json');
    fs.readFile(file, (err, data) => {
        if (err) throw err;
        const accounts = JSON.parse(data);
        let currentaccount = null;

        for (let i = 0; i < accounts.length; i++) {
            if (req.body.username == accounts[i].username) {
                if (req.body.pin == accounts[i].pin) {
                    console.log("Signed In!:", accounts[i].username);
                    req.session.user = accounts[i];
                    res.redirect('/')
                    currentaccount = accounts[i];
                    accounts[i].status = "online";

                    const data = new Uint8Array(Buffer.from(JSON.stringify(accounts)));
                    fs.writeFile(file, data, (err) => {
                        if (err) throw err;
                    });

                    console.log(accounts[i].status);

                    break;
                } else {
                    res.status(403);
                    res.send("Wrong password");
                    return;
                }
            }
        }
        if (currentaccount == null) {
            res.status(403);
            res.send("Wrong email");
        }

    });
});


app.listen(port, () => console.log(`Example app listening`))