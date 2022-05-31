const express = require('express');
const db = require('./database');
const crypto = require('crypto');
const random = require('randomstring');

let cookiec, cookiea;

db.connect();
const app = express();
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
require("dotenv").config();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`server started at ${PORT}`));

const router = express.Router();

app.use('/', router);
router.get('/', (req, res) => {
    res.render('homepage');
});
router.get('/authenticate', (req, res) => {
    res.render('authenticate');
});
router.get('/authorize', (req, res) => {
    res.render('authorize');
});

router.post('/client', (req, res) => {
    let name = req.body.uname;
    let password = req.body.pass;
    let string = new String(password);
    let i = 0; let l = string.length;
    for (i = 0; i < l; i++) {
        string = string + string[l - i - 1];
    }
    db.query('select * from users where username =' + db.escape(name) + ';',
        (error, result, fields) => {
            const hash = crypto.createHash('sha256').update(string).digest('base64');
            if (error) {
                return res.render('notclient');
            }

            else {
                if (result[0] != undefined && result[0].password === hash) {
                    cookiec = random.generate(8);
                    return res.render('client', { SessionID: cookiec, uname: name });
                }
                else if (result[0].password == null)
                    return res.send("Password field is empty");
                else {
                    return res.render('notclient');
                }
            }
        });
    db.query('select * from books where user= ' + name + ';',
        (error, result, fields) => {
            a = result;
        })
});

router.post('/admin', (req, res) => {
    let name = req.body.uname;
    let password = req.body.pass;
    let string = new String(password);
    let i = 0; let l = string.length;
    for (i = 0; i < l; i++) {
        string = string + string[l - i - 1];
    }
    db.query('select * from admin where username =' + db.escape(name) + ';',
        (error, result, fields) => {
            const hash = crypto.createHash('sha256').update(string).digest('base64');
            if (error) {
                console.log('err');
                return res.render('notadmin');
            }
            else {

                if (result[0] != undefined && result[0].password === hash) {
                    cookiea = random.generate(8);
                    return res.render('admin', { SessionID: cookiea, uname: name });
                }
                else {
                    return res.render('notadmin');
                }
            }
        });
});

router.get('/register', (req, res) => {
    res.render(`register`);
});
router.post('/newuser', (req, res) => {
    let name = req.body.uname;
    let password = req.body.pass;
    let passwordC = req.body.passc;
    let string = new String(password);
    let i = 0; let l = string.length;
    for (i = 0; i < l; i++) {
        string = string + string[l - i - 1];
    }
    const hash = crypto.createHash('sha256').update(string).digest('base64');
    db.query("select * from users where username = " + db.escape(name) + ";",
        (error, result, field) => {
            if (result[0] === undefined) {
                if (name && (password == passwordC)) {
                    db.query("insert into users values(" + db.escape(name) + ",'" + hash + "');");
                    res.render(`authenticate`);
                }
                else if (password !== passwordC) {
                    res.send("Passwords dont match. Please enter the same password");
                }
                else {
                    res.send("Password field is empty");
                }
            }
            else {
                res.send("Username already taken. Choose another one.");
            }
        });
});

router.post('/addbook', (req, res) => {
    let bname = req.body.name;
    let cookie = req.body.ID;
    let name = req.body.uname;
    if (cookiec == cookie) {
        db.query('select * from books where name  =' + db.escape(bname) + ';',
            (error, result, fields) => {
                if (error) {
                    return res.render('invalidbookc', { SessionID: cookiec, uname: name });
                }
                else {
                    if (result[0] != undefined && result[0].user == null) {
                        db.query('update books set status = 0, user =' + db.escape(name) + 'where name=' + db.escape(bname) + ';',
                            (err, result, fields) => {
                                if (err) throw err;
                            })
                        return res.render('client', { SessionID: cookiec, uname: name });
                    }
                    else {
                        return res.render('invalidbookc', { SessionID: cookiec, uname: name });
                    }
                }
            });
    }
    else if (cookiea == cookie) {
        db.query('insert into books values(' + db.escape(bname) + ',null,null,null,null,null);')
        return res.render('admin', { SessionID: cookiea })
    }
    else {
        cookiec = "";
        return res.render('cookiemismatch');
    }
});
router.post('/removebook', (req, res) => {
    let bname = req.body.name;
    let cookie = req.body.ID;
    let name = req.body.uname;
    if (cookiec == cookie) {
        db.query('select * from books where name =' + db.escape(bname) + ';',
            (error, result, fields) => {
                if (error) {
                    return res.render('invalidbookc', { SessionID: cookiec, uname: name });
                }
                else {
                    if (result[0] != undefined && result[0].user == name) {
                        db.query('update books set status = -1 where name=' + db.escape(bname) + ';',
                            (err, result, fields) => {
                                if (err) throw err;
                            })
                        return res.render('client', { SessionID: cookiec, uname: name });
                    }
                    else {
                        return res.redirect('invalidbookc', { SessionID: cookiec, uname: name });
                    }
                }
            });
    }
    else if (cookiea == cookie) {
        db.query('delete from books where name = ' + db.escape(bname) + ';')
        return res.render('admin', { SessionID: cookiea })
    }
    else {
        cookiec = "";
        return res.render('cookiemismatch');
    }
});
router.post('/logout', (req, res) => {
    cookiec = "";
    cookiea = "";
    return res.render('homepage');
});

router.post('/approved', (req, res) => {
    let name = req.body.uname;
    let bname = req.body.bname;
    let today = new Date();
    db.query("update books set status = 1, day =" + today.getDate() + " ,month =" + today.getMonth() + ",year =" + today.getFullYear() + ",user =" + db.escape(name) + " where name=" + db.escape(bname) + ";");
    return res.render('admin', { SessionID: cookiea });
});

router.post('/disapproved', (req, res) => {
    let name = req.body.uname;
    let bname = req.body.bname;
    let today = new Date();
    db.query("update books set status = null, user = null where name = " + db.escape(bname) + ";");
    return res.render('admin', { SessionID: cookiea });
});

router.post('/approved1', (req, res) => {
    let bname = req.body.bname;
    db.query("update books set status = null, user = null, day=null, month = null, year=null where name =" + db.escape(bname) + ";");
    return res.render('admin', { SessionID: cookiea });
});

router.post('/disapproved1', (req, res) => {
    let bname = req.body.bname;
    db.query("update books set status = 1 where name = " + db.escape(bname)+";");
    return res.render('admin', { SessionID: cookiea });
});

router.post('/list1', (req, res) => {
    let name = req.body.uname;
    let cookie = req.body.ID;
    if (cookie == cookiec) {
        db.query(`select * from books where user= "${name}" AND (status=1 OR status = -1);`,
            (error, result, fields) => {
                let a = result;
                return res.render('client',{ mylist: a,SessionID: cookiec, uname: name});
            })
    }
    else {
        return res.render('cookiemismatch');
    }
});
router.post('/list2', (req, res) => {
    let cookie = req.body.ID;
    let name = req.body.uname;
    if (cookie == cookiec) {
        db.query('select * from books where status is null OR status=0 ;',
            (error, result, fields) => {
                let a = result;
                return res.render('client',{ available: a, SessionID: cookiec, uname: name });
            })
    }
    else if (cookie == cookiea) {
        db.query('select * from books where status is null OR status=0 ;',
            (error, result, fields) => {
                let a = result;
                return res.render('admin',{ available: a, SessionID: cookiea  });
            })
    }
    else {
        return res.render('cookiemismatch');
    }
});
router.post('/list3', (req, res) => {
    let cookie = req.body.ID;
    if (cookie == cookiea) {
        db.query('select * from books where status=1 OR status=-1;',
            (error, result, fields) => {
                let a = result;
                return res.render('admin',{ unavailable: a , SessionID: cookiea  });
            })
    }
    else {
        return res.render('cookiemismatch');
    }
});
router.post('/checkout', (req, res) => {
    let cookie = req.body.ID;
    if (cookie == cookiea) {
        db.query('select * from books where status = 0;',
            (error, result, fields) => {
                let a = result;
                return res.render('admin',{ approval: a,SessionID: cookiea });
            })
    }
    else {
        return res.render('cookiemismatch');
    }
});
router.post('/checkin', (req, res) => {
    let cookie = req.body.ID;
    if (cookie == cookiea) {
        db.query('select * from books where status = -1;',
            (error, result, fields) => {
                let a = result;
                return res.render('admin',{ ret: a,SessionID: cookiea });
            })
    }
    else {
        return res.render('cookiemismatch');
    }
});