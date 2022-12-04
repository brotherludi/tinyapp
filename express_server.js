const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')
app.use(cookieParser())
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const currentUser = cookie => {
  for (let ids in users) {
    if (cookie === ids) {
      return users[ids]['email'];
    }
  }
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
  let templateVars = { urls: urlDatabase, current_user: currentUser(req.cookies['user_id'])};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const current_user = currentUser(req.cookies['user_id'])
  if (!current_user) {
    res.redirect('/login');
  }
  let templateVars = {current_user: current_user}
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  //console.log(req.body); // Log the POST request body to the console
  const shortURL = generateShortURL()
  const longURL = req.body.longURL
  urlDatabase[shortURL] = longURL
  res.redirect("/urls"); 
});

app.get("/register", (req, res) => {
  templateVars = {current_user: currentUser(req.cookies['user_id'], users)}
  res.render("urls_register", templateVars);
})

const addUser = newUser => {
  const newUserId = generateShortURL();
  newUser.id = newUserId
  users[newUserId] = newUser;
  return newUser
}

app.post("/register", (req, res) => {
  const {email, password} = req.body;
  if (email === '') {//in order to make first two 400 code work, first delete code in urls_register.ejs the "required" after "email" and "password".
    return res.status(400).send('Email is required!');
  }
   if (password === '') {
    return res.status(400).send('Password is required!');
  }  
   const emailExist = Object.values(users).find((user) => user.email === email);
  if (emailExist) {
    return res.status(400).send('Email is Already Registered!');
  }
  newUser = addUser(req.body)
  res.cookie('user_id', newUser.id)
  res.redirect('/urls');
})

app.get("/login", (req, res) => {
  templateVars = { current_user: currentUser(req.cookies['user_id'], users) }
  res.render("urls_login", templateVars);
})

const fetchUserInfo = (email, database) => {
  for (let key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return undefined;
};

app.post("/login", (req, res) => {
  const emailUsed = req.body['email'];
  const pwdUsed = req.body['password'];
  if (fetchUserInfo(emailUsed, users)) {
    const password = fetchUserInfo(emailUsed, users).password;
    const id = fetchUserInfo(emailUsed, users).id;
    if (password !== pwdUsed) {
      res.status(403).send('Error 403... Password incorrect!')
    } else {
      res.cookie('user_id', id);
      res.redirect('/urls');
    }
  } else {
    res.status(403).send('Error 403... Email not found!')
  }
});

app.get("/debug/database", (req, res) => {res.json(users)})

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.post("/urls/:id", (req, res) => { 
  const id = req.params.id
  const longURL = req.body.updatedURL
  urlDatabase[id] = longURL
 res.redirect("/urls");
});

//edit url
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], current_user: req.cookies['current_user']};
  res.render("urls_show", templateVars);
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