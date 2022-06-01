const express = require('express');
const db = require('./database');
const crypto = require('crypto');
const random = require('randomstring');

db.connect();
const app = express();
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
require("dotenv").config();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`server started at ${PORT}`)
);

const router = express.Router();

app.use('/', router);
router.get('/', (req, res) => {
    res.render('homepage');
});
router.get('/client/authenticate', (req, res) => {
    res.render('authenticate');
});
router.get('/admin/authorize', (req, res) => {
    res.render('authorize');
});
router.get('/admin/auth', validateCookiesA, (req, res) => {
    res.render('admin');
});
router.get('/admin/auth', validateCookiesA, (req, res) => {
    res.render('admin');
});
router.get('/client/auth', validateCookiesC, (req, res) => {
    res.render('admin');
});

router.post('/client/auth', (req, res) => {
    let name = req.body.uname;
    let password = req.body.pass;
    let string = new String(password);
    db.query('select * from users where username =' + db.escape(name) + ';',
        (error, result, fields) => {
            if (error) {
                return res.render('notclient');
            }
            else {
                let salt = new String(result[0].salt);
                string += salt;
                const hash = crypto.createHash('sha256').update(string).digest('base64');
                if (result[0] != undefined && result[0].password === hash) {
                    let cookiec = random.generate(8);
                    res.cookie("sessionID", cookiec, {
                        maxAge: 12000000,
                        httpOnly: true
                    });
                    db.query('update users set cookie=' + db.escape(cookiec) + ' where username =' + db.escape(name) + ';');
                    return res.render('client', { uname: name });
                }
                else if (result[0].password == null)
                    return res.send("Password field is empty");
                else {
                    return res.render('notclient');
                }
            }
        });
});

router.post('/admin/auth', (req, res) => {
    let name = req.body.uname;
    let password = req.body.pass;
    let string = new String(password);
    db.query('select * from admin where username =' + db.escape(name) + ';',
        (error, result, fields) => {
            if (error) {
                return res.render('notadmin');
            }
            else {
                let salt = new String(result[0].salt);
                string += salt;
                const hash = crypto.createHash('sha256').update(string).digest('base64');
                if (result[0] != undefined && result[0].password === hash) {
                    let cookiea = random.generate(8);
                    res.cookie("sessionID", cookiea, {
                        maxAge: 12000000,
                        httpOnly: true
                    });
                    db.query('update admin set cookie=' + db.escape(cookiea) + ' where username =' + db.escape(name) + ';');
                    return res.render('admin', { uname: name });
                }
                else {
                    return res.render('notadmin');
                }
            }
        });
});

router.get('/client/register', (req, res) => {
    res.render(`register`);
});
router.post('/client/newuser', (req, res) => {
    let name = req.body.uname;
    let password = req.body.pass;
    let passwordC = req.body.passc;
    let length = password.length;
    db.query("select * from users where username = " + db.escape(name) + ";",
        (error, result, field) => {
            if (result[0] === undefined) {
                if (length >= 8) {
                    if (name && (password == passwordC)) {
                        let salt = random.generate(8);
                        let string = new String(password)
                        string = password + salt;
                        const hash = crypto.createHash('sha256').update(string).digest('base64');
                        db.query("insert into users values(" + db.escape(name) + "," + db.escape(hash) + "," + db.escape(salt) + ",null);");
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
                    res.send("Please enter password of appropriate length");
                }
            }
            else {
                res.send("Username already taken. Choose another one.");
            }
        });
});

router.post('/admin/addbook', validateCookiesA, (req, res) => {
    let bname = req.body.name;
    let cookie = req.body.ID;
    let quantity = parseInt(req.body.quantity)
    db.query('select * from available where name=' + db.escape(bname) + ';',
        (err, result, fields) => {
            if (err) throw err;
            if (result[0] != undefined) {
                db.query('update available set quantity=' + (quantity + result[0].quantity) + ' where name=' + db.escape(bname) + ';')
            }
            else {
                db.query('insert into available values(' + db.escape(bname) + ',' + db.escape(quantity) + ');');
            }
        })
    return res.render('admin')
});

router.post('/client/requestbook', validateCookiesC, (req, res) => {
    let bname = req.body.name;
    let cookie = req.body.ID;
    let quantity = parseInt(req.body.quantity)
    let name = req.body.uname;
    db.query('select * from available where name  =' + db.escape(bname) + ';',
        (error, result, fields) => {
            if (error)
                return res.render('invalidbookc', { uname: name });

            else {
                if (result[0] != undefined) {
                    if (result[0].quantity > quantity) {
                        db.query('insert into  requests  values(' + db.escape(bname) + ',' + db.escape(name) + ',' + db.escape(quantity) + ',0);',
                            (err, result, fields) => {
                                if (err) throw err;
                            });
                        db.query('update available set quantity =' + (result[0].quantity - quantity) + ' where name =' + db.escape(bname) + ';');
                        return res.render('client', { uname: name });
                    }
                    else if (result[0].quantity == quantity) {
                        db.query('insert into  requests  values(' + db.escape(bname) + ',' + db.escape(name) + ',' + db.escape(quantity) + ',0);',
                            (err, result, fields) => {
                                if (err) throw err;
                            });
                        db.query('delete from available where name=' + db.escape(bname) + ';')
                        return res.render('client', { uname: name });
                    }
                    else {
                        return res.render('invalidbookc', { uname: name });
                    }
                }
                else {
                    return res.render('invalidbookc', { uname: name });
                }
            }
        });
});
router.post('/admin/removebook', validateCookiesA, (req, res) => {
    let bname = req.body.name;
    let cookie = req.body.ID;
    let name = req.body.uname;
    let quantity = parseInt(req.body.quantity)
    db.query(' select * from available where name = ' + db.escape(bname) + ';',
        (err, result, fields) => {
            if (err) throw err;
            if (result[0] != undefined) {
                if (quantity > result[0].quantity) {
                    return res.render('invalidbooka')
                }
                else if (quantity < result[0].quantity) {
                    db.query('update available set quantity=' + db.escape((result[0].quantity - quantity)) + ' where name=' + db.escape(bname) + ';')
                    return res.render('admin')
                }
                else {
                    db.query('delete from available where name = ' + db.escape(bname) + ";")
                    return res.render('admin')
                }
            }
            else {
                return res.render('invalidbooka');
            }
        })
});
router.post('/client/returnbook', validateCookiesC, (req, res) => {
    let bname = req.body.name;
    let cookie = req.body.ID;
    let name = req.body.uname;
    let quantity = parseInt(req.body.quantity);
    db.query('select * from unavailable where name =' + db.escape(bname) + ' AND user=' + db.escape(name) + ';',
        (error, result, fields) => {
            if (error) {
                return res.render('invalidbookc', { SessionID: cookiec, uname: name });
            }

            if (result[0] != undefined && result[0].user == name) {
                db.query('insert into requests values(' + db.escape(bname) + ',' + db.escape(name) + ',' + db.escape(quantity) + ',-1);',
                    (err, result, fields) => {
                        if (err) throw err;
                    })
                return res.render('client', { uname: name });
            }
            else {
                return res.render('invalidbookc', { uname: name });
            }

        });
});
router.post('/client/logout', validateCookiesC, (req, res) => {
    let cookie = req.headers.cookie.slice(10);
    db.query('update user set cookie=null where cookie=' + db.escape(cookie) + ';');
    return res.render('homepage');
});
router.post('/admin/logout', validateCookiesA, (req, res) => {
    let cookie = req.headers.cookie.slice(10);
    db.query('update admin set cookie=null where cookie=' + db.escape(cookie) + ';');
    return res.render('homepage');
});

router.post('/admin/approved', validateCookiesA, (req, res) => {
    let name = req.body.uname;
    let bname = req.body.bname;
    let quantity = parseInt(req.body.quantity);
    let today = new Date();
    db.query('select * from unavailable where name=' + db.escape(bname) + ' AND user=' + db.escape(name),
        (err, result, fields) => {
            if (result[0] == undefined) {
                db.query('insert into unavailable values(' + db.escape(bname) + ',' + db.escape(name) + ',' + db.escape(quantity) + ',' + today.getDate() + ',' + today.getMonth() + ',' + today.getFullYear() + ');');
            }
            else {
                db.query('update unavailable set quantity =' + db.escape(quantity + result[0].quantity) + ' where name=' + db.escape(bname) + ' AND user=' + db.escape(name) + ';');
            }
        })
    db.query('delete from requests where name=' + db.escape(bname) + ' AND user=' + db.escape(name) + ' AND status=0;')
    return res.render('admin');
});

router.post('/admin/disapproved', validateCookiesA, (req, res) => {
    let name = req.body.uname;
    let bname = req.body.bname;
    let quantity = parseInt(req.body.quantity);
    db.query('select * from available where name=' + db.escape(bname) + ';',
        (err, result, fields) => {
            if (result[0] == undefined) {
                db.query('insert into available values(' + db.escape(bname) + ',' + db.escape(quantity) + ');')
            }
            else {
                db.query('update available set quantity=' + db.escape((result[0].quantity + quantity)) + ' where name=' + db.escape(bname) + ';');
            }
        })
    db.query('update requests set status=2 where user=' + db.escape(name) + 'AND name=' + db.escape(bname) + 'AND status=0;');
    return res.render('admin');
});

router.post('/admin/approvedreturn', validateCookiesA, (req, res) => {
    let name = req.body.uname;
    let bname = req.body.bname;
    let quantity = parseInt(req.body.quantity);
    db.query('select * from available where name=' + bname + ';',
        (err, result, fields) => {
            if (result[0] == undefined) {
                db.query('insert into available values(' + db.escape(bname) + ',' + db.escape(quantity) + ');')
            }

            else {
                db.query('update available set quantity=' + db.escape((result[0].quantity + quantity)) + ' where name=' + db.escape(bname) + ';');
            }
        })
    db.query('select * from unavailable where name=' + db.escape(bname) + 'AND user=' + db.escape(name) + ';',
        (err, result, fields) => {
            let q1 = result[0].quantity;
            if (q1 > quantity) {
                db.query('update unavailable set quantity=' + db.escape((q1 - quantity)) + ' where name=' + db.escape(bname) + 'AND user=' + db.escape(name) + ';')
            }
            if (q1 == quantity)
                db.query('delete from unavailable where name=' + db.escape(bname) + 'AND user=' + db.escape(name) + ';')
        })
    db.query('delete from requests where user=' + db.escape(name) + 'AND name=' + db.escape(bname) + ' AND status=-1;');
    return res.render('admin');
});

router.post('/admin/disapprovedreturn', validateCookiesA, (req, res) => {
    let name = req.body.uname;
    let bname = req.body.bname;
    db.query('update requests set status=2 where user=' + db.escape(name) + ' AND name=' + db.escape(bname) + ' AND status=-1;')
    return res.render('admin');
});

router.post('/client/list1', validateCookiesC, (req, res) => {
    let name = req.body.uname;
    let cookie = req.body.ID;
    db.query('select * from unavailable where user=' + db.escape(name),
        (error, result, fields) => {
            let a = result;
            return res.render('client', { mylist: a, uname: name });
        })

});
router.post('/client/availablebooks', validateCookiesC, (req, res) => {
    let cookie = req.body.ID;
    let name = req.body.uname;
    db.query('select * from available;',
        (error, result, fields) => {
            let a = result;
            return res.render('client', { available: a, uname: name });
        })


});
router.post('/admin/availablebooks', validateCookiesA, (req, res) => {
    db.query('select * from available;',
        (error, result, fields) => {
            let a = result;
            return res.render('admin', { available: a });
        })
});
router.post('/admin/unavailable', validateCookiesA, (req, res) => {
    let cookie = req.body.ID;
    db.query('select * from unavailable;',
        (error, result, fields) => {
            let a = result;
            return res.render('admin', { unavailable: a });
        })

});
router.post('/admin/checkout', validateCookiesA, (req, res) => {
    let cookie = req.body.ID;
    db.query('select * from requests where status = 0;',
        (error, result, fields) => {
            let a = result;
            return res.render('admin', { approval: a });
        })

});
router.post('/admin/checkin', validateCookiesA, (req, res) => {
    let cookie = req.body.ID;
    db.query('select * from requests where status = -1;',
        (error, result, fields) => {
            let a = result;
            return res.render('admin', { ret: a });
        })
});
router.post('/client/requestedbooks', validateCookiesC, (req, res) => {
    let cookie = req.body.ID;
    let name = req.body.uname;
    db.query('select * from requests where status=0 AND user=' + db.escape(name) + ';',
        (error, result, fields) => {
            let a = result;
            return res.render('client', { requested: a, uname: name });
        })
});

router.post('/client/rejectedrequests', validateCookiesC, (req, res) => {
    let cookie = req.body.ID;
    let name = req.body.uname;
    db.query('select * from requests where status=2 AND user=' + db.escape(name) + ';',
        (error, result, fields) => {
            let a = result;
            db.query('delete from requests where status=2 AND user=' + db.escape(name) + ';')
            return res.render('client', { rejected: a, uname: name });
        })

});
router.get('/admin/registeradmin', validateCookiesA, (req, res) => {
    res.render('registeradmin');
});
router.get('/newadmin', (req, res) => {
    res.render('registeradmin');
});
router.post('/admin/registeradmin', validateCookiesA, (req, res) => {
    let name = req.body.uname;
    let password = req.body.pass;
    let passwordC = req.body.passc;

    db.query("select * from adminreq where user = " + db.escape(name) + ";",
        (error, result, field) => {
            if (result[0] === undefined) {
                if (name && (password == passwordC)) {
                    db.query("insert into adminreq values(" + db.escape(name) + "," + db.escape(password) + ");");
                    res.send("Admin will approve your request soon!");
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
router.post('/admin/showadminrequests', validateCookiesA, (req, res) => {
    let cookie = req.body.ID;
    db.query('select * from adminreq',
        (error, result, fields) => {
            let a = result;
            return res.render('admin', { adminrequests: a });
        })
});
router.post('/admin/approvedadmin', validateCookiesA, (req, res) => {
    let name = req.body.name;
    let password = req.body.password;
    db.query('delete from adminreq where user=' + db.escape(name) + ';')
    let string = new String(password);
    let salt = random.generate(8);
    string += salt;
    const hash = crypto.createHash('sha256').update(string).digest('base64');
    db.query('insert into admin values(' + db.escape(name) + ',' + db.escape(hash) + ',' + db.escape(salt) + ',null);');
    return res.render('admin');
});
router.post('/admin/disapprovedadmin', validateCookiesA, (req, res) => {
    let name = req.body.name;
    db.query('delete from adminreq where user="' + db.escape(name) + '";')
    return res.render('admin');
});

function validateCookiesA(req, res, next) {
    const cookie = req.headers.cookie.slice(10);
    if (cookie == undefined) {
        return res.render('cookiemismatch');
    }
    else {
        if (req.headers.cookie.includes("sessionID")) {
            db.query('select * from admin where cookie = ' + db.escape(cookie) + ';',
                (err, result, field) => {
                    if (err) throw err;
                    else {
                        if (cookie === result[0].cookie) {
                            next();
                        }
                        else {
                            return res.render('cookiemismatch');
                        }
                    }
                }
            )
        }
        else {
            return res.render('cookiemismatch');
        }
    }
}
function validateCookiesC(req, res, next) {
    const cookie = req.headers.cookie.slice(10);
    if (cookie == undefined) {
        return res.render('cookiemismatch');
    }
    else {
        if (req.headers.cookie.includes("sessionID")) {
            db.query('select * from users where cookie = ' + db.escape(cookie) + ';',
                (err, result, field) => {
                    console.log(result);
                    if (err) throw err;
                    else {
                        if (cookie == result[0].cookie) {
                            next();
                        }
                        else {
                            return res.render('cookiemismatch');
                        }
                    }
                }
            )
        }
        else {
            return res.render('cookiemismatch');
        }
    }
}