const MongoClient = require('mongodb').MongoClient;
const dbName = require('../config/database').dbName;
const dbUrl = require('../config/database').dbUrl;
const validator = require("email-validator");
const hashString = require("../utils/hashString").hashString;

module.exports = {
  validateSignUp,
  validateUsername,
  validatePassword,
  confirmPassword,
  validateForename,
  validateSurname,
  signUp,
  signIn,
  deleteUser,
  getUsername,
};

function validateSignUp(username, password, conf_password, forename, surname, email){
  if (confirmPassword(password, conf_password)){
    if(validator.validate(email)){
      if(validateUsername(username) && validatePassword(password) && validateForename(forename) && validateSurname(surname)){
        return true;
      }
      else{
        return false;
      }
    }
    else{
      return false;
    }
  }else{
    return false;
  }
}

function validateUsername(username){
  let usernameRegEx = /^[a-zA-Z0-9]{3,32}$/;
  if(usernameRegEx.test(username)){
    return true;
  }
  else{
    return false;
  }
}

function validatePassword(password){
  let passRegEx = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])\S{8,128}$/;
  if(passRegEx.test(password)){
    return true;
  }
  else{
    return false;
  }
}

function confirmPassword(password, confirmPassword){
  if(password == confirmPassword){
    return true;
  }
  else{
    return false;
  }
}

function validateForename(forename){
  let forenameRegEx = /^[a-zA-Z]{2,32}$/
  if(forenameRegEx.test(forename)){
    return true;
  }
  else{
    return false;
  }
}

function validateSurname(surname){
  let surnameRegEx = /^[a-zA-Z ]{2,64}$/;
  if(surnameRegEx.test(surname)){
    return true;
  }
  else{
    return false;
  }
}

async function signUp(username, password, confirmPassword, forename, surname, email){
  const signingUp = new Promise(async function(resolve, reject){
    try{
      const userAlreadyExists = await getUsername(username);
      if(validateSignUp(username, password, confirmPassword, forename, surname, email) && (userAlreadyExists == false)){
        let hashedPass = await hashString(password)
        MongoClient.connect(dbUrl, function(err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            let newUser = { username: username, password: hashedPass, email: email, forename: forename, surname: surname, role: "user" };
            dbo.collection("users").insertOne(newUser, function(err, res) {
              if (err) throw err;
              //console.log("[" + new Date() + "] db.users.insertOne(" + newUser + "). SUCCESS");
              db.close();
            });
        });
        resolve({status: true, message: "User successfully entered into database"});
      }
      else{
        resolve({status: false, message: "Not validated. Password may not be sufficiently complex, email may be invalid, username may already exist, etc"});
      }
    }
    catch(error){
      //console.error(error);
      console.log("[" + new Date() + "] db.users.insertOne(" + newUsers + "). FAILED");
      reject({status: false, message:"An unxpected error occurred!"});
    }
  });
  return await signingUp;
}

async function signIn(username, password){
  let success = new Promise(async function(resolve, reject){
    try{
      MongoClient.connect(dbUrl, async function(err, db){
        if (err) throw err;
        let dbo = db.db("coffee_table");
        let hashedPass = await hashString(password);
        dbo.collection("users").findOne({username:username, password: hashedPass}, function(err, result){
          if (err) throw err;
          if (result !== null){
            //console.log("[" + new Date() + "] db.users.findOne({username: " + username + ", password: " + password + "}). SUCCESS");
            db.close();
            resolve({status: true, username: result.username, role: result.role});
          }
          else{
            //console.log("[" + new Date() + "] db.users.findOne({username: " + username + ", password: " + password + "}). FAILED");
            db.close();
            resolve({status: false});  
          }
        });
      });
    }
    catch(err){
      //console.log(err);
      //console.log("[" + new Date() + "] db.users.findOne({username: " + username + ", password: " + password + "}). FAILED");
      reject({status: false});
    }
  });
  return success;
}

/**
* Deletes user from database
* @param {string} username - the username of the user to delete
* @return {boolean} true if user has been deleted; false if user has not been deleted.
*/
async function deleteUser(username){
  let success = new Promise(function (resolve, reject){
    try{
      MongoClient.connect(dbUrl, function(err, db){
        if (err) throw err;
        var dbo = db.db("coffee_table");
        dbo.collection("users").findOneAndDelete({username: username}, function(err, result){
          if (err) throw err;
          if(result.value !== null){
            db.close();
            resolve(true);
          }
          else{
            console.log(result.value);
            db.close();
            resolve(false);
          }
        })
      });
    }
    catch(err){
      //console.log(err);
      reject(false);
    }
  });
  return success;
}
/**
* Returns the requested username from the database if it exists
* @param {string} username - Username to search for
* @return {string} username if the username exists, false in any other circumstance
*/
async function getUsername(username){
  return success = new Promise(function (resolve, reject){
    MongoClient.connect(dbUrl, function(err, db) {
      try{
        if (err) throw err;
        const dbo = db.db("coffee_table");
        dbo.collection("users").findOne({username: username}, function(err, result){
          if (err) throw err;
          if (result !== null){
            db.close();
            resolve(result.username);
          }
          else{
            db.close();
            resolve(false);
          }
        });
      }
      catch(err){
        // console.log("Error occurred when checking for username " + username);
        // console.log(err);
        reject(false);
      }
    });
  });
}
