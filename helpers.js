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
      return users[ids];
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

const addUser = newUser => {
  const newUserId = generateShortURL();
  newUser.id = newUserId
  users[newUserId] = newUser;
  return newUser
}

const fetchUserInfo = (email, database) => {
  for (let key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return undefined;
};

module.exports = { urlDatabase, users, currentUser, urlsForUser, generateShortURL, addUser, fetchUserInfo };