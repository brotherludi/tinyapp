const express = require("express");
const cookieSession = require('cookie-session');//Encrypted Cookies
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require("bcryptjs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['mySecrectKey']
}));
app.set("view engine", "ejs");

const { urlDatabase, users, currentUser, urlsForUser, generateShortURL, addUser, fetchUserInfo } = require("./helpers");

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/", (req, res) => {
  const { user_id } = req.session
  if (!user_id) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let userID = req.session.user_id
  let userURLs = urlsForUser(userID)
  let templateVars = { urls: userURLs, current_user: currentUser(req.session.user_id) };
  if (!req.session.user_id) {
    res.status(401).send("🚨Please login or register first!");
    res.redirect('/login')
  } else
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const current_user = currentUser(req.session.user_id)
  if (!current_user) {
    res.redirect('/login');
  }
  let templateVars = { current_user: current_user }
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    templateVars = { current_user: currentUser(req.session.user_id, users) }
    res.render("urls_register", templateVars);
  }
})

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    templateVars = { current_user: currentUser(req.session.user_id, users) }
    res.render("urls_login", templateVars);
  }
})

//edit url
app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("🚨Short url invalid!😱");
  } else if (!req.session.user_id) {
    res.status(401).send("🚨Please login!🥸");
  } else if (urlDatabase[shortURL].userID !== req.session.user_id) {
    res.status(401).send("🚨You do not own the URL!😑")
  }
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, current_user: currentUser(req.session.user_id) };
  res.render("urls_show", templateVars);
});

//Go to the actual website
app.get("/u/:id", (req, res) => {
  const id = req.params.id
  const urlObject = urlDatabase[id]
  if (!urlObject) {
    return res.status(404).send('URL not found!');
  }
  const longURL = urlDatabase[req.params.id].longURL
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send("Please login!");
  } else {
    const shortURL = generateShortURL()
    const longURL = req.body.longURL
    const userID = req.session.user_id
    urlDatabase[shortURL] = { longURL: longURL, userID: userID }
    res.redirect("/urls");
  }
});

//Register new user
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (email === '') {//in order to make first two 400 code work, first delete code in urls_register.ejs the "required" after "email" and "password".
    return res.status(400).send('🚨Email is required!📧');
  }
  if (password === '') {
    return res.status(400).send('🚨Password is required!😅');
  }
  const emailExist = Object.values(users).find((user) => user.email === email);
  if (emailExist) {
    return res.status(400).send('🚨Email is Already Registered!😳');
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  newUser = addUser({ email: req.body.email, password: hashedPassword })
  req.session.user_id = newUser.id;
  res.redirect('/urls');
})

//Endpoint to log in a user using email and password
app.post("/login", (req, res) => {
  const emailUsed = req.body['email'];
  const pwdUsed = req.body['password'];//real password
  const user = fetchUserInfo(emailUsed, users)
  if (user) {
    const password = user.password;//hashed password
    const id = user.id;
    if (!bcrypt.compareSync(pwdUsed, password)) {
      res.status(403).send('🚨Password incorrect!🤔')
    } else {
      req.session.user_id = id
      res.redirect('/urls');
    }
  } else {
    res.status(403).send('🚨Email not found, Please register first!🤓')
  }
});

//logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.post("/urls/:id", (req, res) => {
  const { user_id } = req.session
  if (!user_id) {
    return res.status(401).send('Please login first!')
  }
  const id = req.params.id
  const urlObject = urlDatabase[id]
  if (!urlObject) {
    return res.status(404).send('URL not found!')
  }
  if (urlObject.userID !== user_id) {
    return res.status(403).send('You are not the owner of the url!')
  }
  const longURL = req.body.updatedURL
  urlDatabase[id].longURL = longURL
  res.redirect("/urls");
});

//Delete a url
app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id
  if (!req.session.user_id) {
    res.status(401).send("🚨Please login!");
  } else if (urlDatabase[shortURL].userID !== req.session.user_id) {
    res.status(401).send("🚨You do not own the URL!🫤")
  } else
    delete urlDatabase[req.params.id]
  res.redirect("/urls");
});