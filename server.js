var express = require('express');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;

// DATABASE
var db = require("quick.db");
// DATABASE

if(!db.get("users")) db.set("users",[]);
passport.use(new Strategy(
  function(username, password, done) {
    let us = require("quick.db").get("users");
      if (!us.some(i=> i.username === username) || us.filter(i=> i.username === username)[0].password !== password) { return done("Hatalı kullanıcı adı veya parola."); }
      return done(null, us.filter(i=> i.username === username)[0]);
  }
));

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});
passport.deserializeUser(function(id, cb) {
  function ids(id, cb) {
    process.nextTick(function() {
      if (db.get("users").some(i=> i.id === id)) {
        cb(null, db.get("users").filter(i=> i.id === id)[0]);
      } else {
        cb(new Error(id+" ID'li kullanıcı bulunamadı."));
      }
    })
  }
  ids(id, function (err, user) { if (err) { return cb(err); } cb(null, user)});
});
var app = express();
app.set('views', __dirname + '/site');
app.set('view engine', 'ejs');
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.get("/", (req,res) => {
  res.render("index", {db,req,res,hata:[]});
})
app.get("/giris", (req,res) => {
  if(req.user) return res.redirect("/profil");
  res.render("giris", {db,req,res,hata:[]});
})
app.post('/giris', 
passport.authenticate('local', { failureRedirect: '/giris' }),
function(req, res) {
  res.redirect('/');
});
app.get("/kayit", (req,res) => {
  if(req.user) return res.redirect("/profil");
  res.render("kayit", {db,req,res,hata:[]});
})
app.post("/kayit", (req,res) => {
  if(req.user) return res.redirect("/profil");
  let hata = [];
  if(req.body.username.length < 6) hata.push("Kullanıcı adınız çok kısa.");
  if(db.get("users").some(i=> i.username.toLowerCase() === req.body.username.toLowerCase())) hata.push("Bu isim önceden alınmış.");
  let filt = eval("["+("abcçdefghıijklmnoöprsştuüvyz1234567890").split("").map(i=> "'"+i+"'").join(",")+"]");
  if(req.body.password.length < 8 || req.body.password.split("").filter(i=> !isNaN(i)).length < 2 || req.body.password.split("").filter(i=> !filt.some(a=> a === i.toLowerCase())).length < 1) hata.push("Şifreniz en az 8 haneden, 2 sayıdan ve 1 sembol içermelidir.");
  if(hata.length > 0) return res.render("kayit", {db,req,res,hata});
  db.push({id:db.get("users").map(i=> i.id).sort().reverse()[0],username:req.body.username,password:req.body.password,acilma:Date.now()});
  res.redirect("/");
})
app.get("/cikis", (req,res) => {
  if(!req.user) return res.redirect("/");
  req.logout();
  if(req.query.redirect) {
    res.redirect(req.query.redirect);
  } else {
    res.redirect("/");
  }
})
app.get("/profil", (req,res) => {
  if(!req.user) return res.redirect("/");
  res.render("profil", {db,req,res,hata:[]});
})
// APP GET/POST KISIMLARI
require(__dirname+"/app.js")(app);
// APP GET/POST KISIMLARI

app.listen(3000);