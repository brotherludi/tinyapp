const express = require("express");
const app = express();
const PORT = 3000; // default port 8080
const cookieParser = require('cookie-parser')
app.use(cookieParser())
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const upperCase = lowerCase.toUpperCase();
  const numeric = '1234567890';
  const alphaNumeric = lowerCase + upperCase + numeric;
  //alphaNumeric is 62
  let index = Math.round(Math.random() * 100);
  if (index > 61) {
    while (index > 61) {
      index = Math.round(Math.random() * 100);
    }
  }
  return alphaNumeric[index];
}

const generateShortURL = () => {
  let randomString = '';
  while (randomString.length < 6) {
    randomString += generateRandomString();
  }
  return randomString;
}

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies['username'] };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const shortURL = generateShortURL()
  const longURL = req.body.longURL
  urlDatabase[shortURL] = longURL
  res.redirect("/urls"); 
});

app.post("/login", (req, res) => {
  const username = req.body.username
  res.cookie('username', username);
  res.redirect("/urls"); 
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => { 
  const id = req.params.id
  const longURL = req.body.updatedURL
  urlDatabase[id] = longURL
 res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies['username']}
  res.render("urls_new", templateVars);
});

app.post("/urls/:id/delete", (req, res) => { 
  delete urlDatabase[req.params.id]
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});