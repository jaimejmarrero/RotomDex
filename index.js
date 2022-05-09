const express = require('express');
const app = express()
const { Client, Pool } = require('pg')
var http = require('http')
var cheerio = require('cheerio');
const bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(express.static('Client'))
const fs = require('fs')
const readline = require("readline");
let raw = fs.readFileSync('pokedex.json')
let data = JSON.parse(raw)
const path = require('path');
app.use(bodyParser.urlencoded({extended: false}));

let loggedInUser = '';
//Connects to database
let connection = new Pool({
    host: '45.79.131.73',
    port: 5432,
    user: 'j_marrero4',
    password: 'j_marrero4',
    database: 'j_marrero4'
});

app.get('/',(req,res) => {
    res.send("You have to catch them all");
});

app.get('/get-pokemon', (req, res) => {
    let pokemon = req.query.name
    const pokemonName = data.find(pokedex => pokedex.name.english.toLowerCase() === pokemon.toLowerCase())
    console.log(pokemonName)
    if(!pokemonName) {
        return res.status(404).json({success: false, message: "Who's that Pokemon? Try again!"})
    }

    if (pokemonName) {
        return res.status(200).json({ success: true, pokemon: pokemonName})
    }

})


app.get('/get-type', (req, res) => {
    let pokeType = req.query.type
//formatting to UpperCase
    const array = pokeType.split("")
    let pokeTypeForm = array[0].toUpperCase() + array.slice(1).join("");


    let pokedex = data
    const result = pokedex.filter(pokemon => pokemon.type.includes(pokeTypeForm));

    if(!result) {
        return res.json({message: "Try Senparching Water, Fire, Grass..."})
    }

    if (result) {

        var fileHTML = cheerio.load(fs.readFileSync(__dirname + "/Client/index.html", "utf8"));
        console.log(fileHTML);
        fileHTML(".element-label").remove()
        fileHTML(".element-p").remove()
        for (index = 0; index < result.length; index++) {
            var name = result[index].name.english;
            var type = result[index].type;
            var types = type.join(', ')

            var elementToUpdate = fileHTML("#pokemon")
            var newData = `<label class = "element-label">${name}</label><p class = "element-p">${types}</p>`
            elementToUpdate.append(newData);
        }
    }
    fs.writeFileSync(__dirname + "/Client/index.html", fileHTML.html());

    res.status(200).sendFile(__dirname + "/Client/index.html")
})
app.post('/login', async (req, res) => {
    try {
        let username = req.body.trainerName;
        let pw = req.body.password;
        console.log(username);
        console.log(pw);
        const query = `SELECT * FROM users WHERE name = '${username}' and password = '${pw}'`
        connection.query(query, (err, response) => {
            if (err) {
                res.status(400).json({ success: false,
                message: 'Error while checking if user already exists' })
                console.log(err.stack)
            } else {
                // check if user exists 
                //console.log("returned rows incoming")
                console.log(response.rows[0])
                if (response.rows[0] == undefined) {
                    // User does not exist... alert user
                    res.status(400).json({ success: false,
                        message: 'Trainer account does not exist. Please create an account' })
                }

                else {
                    console.log("User logged in successfully")
                    loggedInUser = username;
                    console.log(loggedInUser);
                    //return res.status(200).json({ success: true,
                    //message: 'User logged in successfully' })
                    var trainerPage = cheerio.load(fs.readFileSync(__dirname + "/Client/Trainers.html", "utf8"))
                    trainerPage(".welcome-name").remove()
                    var elementToUpdate = trainerPage("#welcome-message")
                    var welcomeH = `<h1 class = "welcome-name">Welcome ${username}!</h1>`
                    elementToUpdate.append(welcomeH);
                    fs.writeFileSync(__dirname + "/Client/Trainers.html", trainerPage.html());
                    res.status(200).sendFile(__dirname + "/Client/Trainers.html")
                }

            }
        })
    } catch (err) {
        res.status(400).json({ success: false,
            message: 'Other error while logging in. Please check the console for more details' })
    }
})

app.post('/add-pokemon', (req, res) =>{
    try {
        console.log(loggedInUser)
        let pokeName = req.body.pokemonName;
        const pokemonFound = data.find(pokedex => pokedex.name.english.toLowerCase() === pokeName.toLowerCase())
        console.log(pokemonFound)
        if (!pokemonFound) {
            res.status(404).json({success: false,
                message: "Who's that Pokemon?! Check your Pokedex!"
            })
            return
        }

        let pokeType = req.body.pokemonType;
        const pokeValues = new Array()
        pokeValues.push(loggedInUser, pokeName, pokeType)
        const text = 'INSERT INTO collections(username, pokemonname, pokemontype) VALUES($1, $2, $3) RETURNING *';
        connection.query(text, pokeValues, (err, response) => {
            if (err) {
                console.log(err.stack)
                console.log('Error while inserting into database');
                res.status(400).json({ success: false,
                    message: 'Error while inserting into db' })
            } else {
                console.log(response.rows[0])
                //return res.status(200).json({ success: true,
                //message: 'User added successfully!'  })
                let trainerPage = cheerio.load(fs.readFileSync(__dirname + "/Client/Trainers.html", "utf8"))
                trainerPage(".welcome-h").remove()
                // get element from trainers page to update
                let elementToUpdate = trainerPage("#welcome-message")
                let welcomeH = `<h1 class = "welcome-h">Added ${pokeName} Successfully!</h1>`
                elementToUpdate.append(welcomeH);
                fs.writeFileSync(__dirname + "/Client/Trainers.html", trainerPage.html());
                res.status(200).sendFile(__dirname + "/Client/Trainers.html")
            }
        })
    }
    catch {
        console.log('Other error while Pokemon to PC')
        console.log(err)
        res.status(400).json({ success: false,
            message: 'Error while adding pokemon.' })

    }

})
app.post('/delete-pokemon', (req, res) =>{
    try {
        console.log(loggedInUser)
        let pokeName = req.body.pokemonName;
        let pokeType = req.body.pokemonType;
        const pokemonFound = data.find(pokedex => pokedex.name.english.toLowerCase() === pokeName.toLowerCase())

        if (!pokemonFound) {
            res.status(404).json({success: false,
                message: "Who's that Pokemon?! Check your Pokedex!"
            })
            return
        }
        const pokeValues = new Array()
        pokeValues.push(loggedInUser, pokeName, pokeType)
        const text = 'DELETE FROM collections where username = $1 and  pokemonname = $2 and pokemontype = $3';
        connection.query(text, pokeValues, (err, response) => {
            if (err) {
                console.log(err.stack)
                console.log('Error while deleting from PC');
                res.status(400).json({ success: false,
                    message: 'Error while deleting from PC' })
            } else {
                //console.log(response.rows[0])
                let trainerPage = cheerio.load(fs.readFileSync(__dirname + "/Client/Trainers.html", "utf8"))
                trainerPage(".welcome-h").remove()
                // get element from trainers page to update
                let elementToUpdate = trainerPage("#welcome-message")
                let welcomeH = `<h1 class = "welcome-h">Deleted ${pokeName} Successfully!</h1>`
                elementToUpdate.append(welcomeH);
                fs.writeFileSync(__dirname + "/Client/Trainers.html", trainerPage.html());
                res.status(200).sendFile(__dirname + "/Client/Trainers.html")
            }
        })
    }
    catch {
        console.log('Other error while releasing pokemon from PC')
        console.log(err)
        res.status(400).json({ success: false,
            message: 'Error while releasing pokemon.' })

    }

})

app.get('/get-collection', (req, res) =>{
    try {
        console.log(loggedInUser)
        const userArray = new Array()
        userArray.push(loggedInUser)
        const text = 'SELECT pokemonname, pokemontype FROM collections where username = $1';
        connection.query(text, userArray , (err, response) => {
            if (err) {
                console.log(err.stack)
                console.log('Error while selecting from database');
                res.status(400).json({ success: false,
                    message: 'Error while selecting from db' })
            } else {
                console.log("rows object coming")
                console.log(response.rows)
                let trainerPage = cheerio.load(fs.readFileSync(__dirname + "/Client/Trainers.html", "utf8"))
                trainerPage(".welcome-h").remove()
                trainerPage(".collection-label").remove()
                trainerPage(".collection-p").remove()
                for (index = 0; index < response.rows.length; index++) {
                    let name = response.rows[index].pokemonname;
                    let type = response.rows[index].pokemontype;
                    console.log("got into here")
                    let elementToUpdate = trainerPage("#collection")
                    let newData = `<label class = "collection-label">${name}</label><p class = "collection-p">${type}</p>`
                    elementToUpdate.append(newData);
                }
                fs.writeFileSync(__dirname + "/Client/Trainers.html", trainerPage.html());
                res.status(200).sendFile(__dirname + "/Client/Trainers.html")
            }
        })
    }
    catch {
        console.log('Other error while selecting pokemon from PC')
        console.log(err)
        res.status(400).json({ success: false,
            message: 'Error while selecting pokemon.' })

    }

})




app.post('/sign-up', async (req, res) => {
    let userAdded = 0;
    try {
        let username = req.body.newUsername;
        let pw = req.body.newPassword;
        const authValues = new Array()
        authValues.push(username, pw)
        // console.log('Auth values coming')
        // console.log(authValues)
        const query = `SELECT * FROM users WHERE name = '${username}' and password = '${pw}'`
        //console.log(query)
        //query for provided user 
        connection.query(query, (err, response) => {
            if (err) {
                res.status(400).json({ success: false,
                message: 'Error while checking if user already exists' })
                console.log(err.stack)
            } else {
                // check if user exists 
                //console.log("returned rows incoming")
                console.log(response.rows[0])
                if (response.rows[0] == undefined) {
                    // User does not exist... Add to database
                    const text = 'INSERT INTO users(name, password) VALUES($1, $2) RETURNING *';
                    connection.query(text, authValues, (err, response) => {
                        if (err) {
                            console.log(err.stack)
                            console.log('Error while inserting into database');
                            res.status(400).json({ success: false,
                                message: 'Error while inserting into db' })
                        } else {
                            console.log(response.rows[0])
                            console.log('Trainer added successfully!');
                            loggedInUser = username;
                            userAdded = 1;
                            //return res.status(200).json({ success: true,
                                //message: 'User added successfully!'  })
                            let trainerPage = cheerio.load(fs.readFileSync(__dirname + "/Client/Trainers.html", "utf8"))
                            trainerPage(".welcome-h").remove()
                            // get element from trainers page to update
                            let elementToUpdate = trainerPage("#welcome-message")
                            let welcomeH = `<h1 class = "welcome-name">Welcome ${username}!</h1></p>`
                            elementToUpdate.append(welcomeH);
                            fs.writeFileSync(__dirname + "/Client/Trainers.html", trainerPage.html());
                            res.status(200).sendFile(__dirname + "/Client/Trainers.html")
                        }
                    })
                }

                else {
                    console.log("Trainer already exists. Please pick a new Trainer Name!")
                    res.status(400).json({ success: false,
                             message: 'Trainer already exists. Please pick a new Trainer Name!' })

                }

            }
        })

    } catch (err) {
        console.log('Other error while adding user to DB')
        console.log(err)
        res.status(400).json({ success: false,
        message: 'Error while adding user. Please check console log for more information' })
    }
})

function displayPoke(pokeArray) {
        const indexPage = window.open('Client/index.html')
        var pokeDiv = indexPage.getElementById('pokemon')
        console.log(pokeDiv)
}


app.listen(9001, () => console.log("Listening on Port 9001"));



