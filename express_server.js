const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');//Encrypted Cookies
const bcrypt = require("bcryptjs");
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'user_id',
  keys: ['id']
}))

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$ixrCSJgDmCl2rSFGQpKZMeAUtAOjB8ppH84UoDjbJx/YdEixgaH/W" //"purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$c4HsdpmrzS61hGrN4yfDe.G6bANLwqY3mOQrBmDK7jB/RQ7nFRgfq" //"dishwasher-funk",
  },
};

const currentUser = cookie => {
  for (let ids in users) {
    if (cookie === ids) {
      return users[ids]['email'];
    }
  }
};
//function returns the URLs where the userID is equal to the id of the currently logged-in user.
const urlsForUser = (id) => {
  let userURLs = {}
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLs[url] = urlDatabase[url]
    }
  }
  return userURLs
}

//Generate random six digit string
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
  let userID = req.session.user_id
  let userURLs = urlsForUser(userID)
  let templateVars = { urls: userURLs, current_user: currentUser(req.session.user_id) };
  if (!req.session.user_id) {
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

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    templateVars = { current_user: currentUser(req.session.user_id, users) }
    res.render("urls_register", templateVars);
  }
})

const addUser = newUser => {
  const newUserId = generateShortURL();
  newUser.id = newUserId
  users[newUserId] = newUser;
  return newUser
}
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

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    templateVars = { current_user: currentUser(req.session.user_id, users) }
    res.render("urls_login", templateVars);
  }
})

const fetchUserInfo = (email, database) => {
  for (let key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return undefined;
};
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
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id
  const longURL = req.body.updatedURL
  urlDatabase[id].longURL = longURL
  res.redirect("/urls");
});

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

//Go to the actual website
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id].longURL) {
    return res.status(404).send("🚨Short url invalid!");
  }
  const longURL = urlDatabase[req.params.id].longURL
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});