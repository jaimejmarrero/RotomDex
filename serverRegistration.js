import pg, { Pool } from 'pg';
import bcrypt from 'bcrypt';

const express = require('express');
const bodyParser = require('body-parser');

let pool = new Pool({
    host: '45.79.131.73',
    port: 5432,
    user: 'j_marrero4',
    password: 'j_marrero4',
    database: 'j_marrero4'
});

let router = express.Router();

let app = express();
app.use(bodyParser.json());
app.use(express.static("./Client"));

app.use('/', router);

router.post("/authenticate_v1", (request, response) => {
    let attempted_user = request.body.username;
    let attempted_password = request.body.password;

    if (attempted_user === undefined || attempted_password === undefined) {
        response.status(400);
        response.json({"message": "Invalid request, please supply both a username and password."})
        response.send();
    } else {
        pool.connect().then((client) => {

            client.query(`SELECT id, name, plaintext_password, hashed_password from "Users";`)
                .then((results) => {

                    let authenticated = false;
                    for ( let next_row of results.rows ) {

                        if ( next_row.username === attempted_user && next_row.plaintext_password === attempted_password ) {
                            authenticated = true;
                        }
                        let secret_password = bcrypt.hashSync(attempted_password, next_row.salt);
                        if ( next_row.username === attempted_user && next_row.hashed_password === secret_password ) {
                            authenticated = true;
                        }
                    }

                    if ( authenticated ) {
                        response.status(202);
                        response.send();
                    }else {
                        response.status(403);
                        let ret = {"message": "Username or password incorrect!"};
                        response.json(ret);
                        response.send();
                    }

                }).catch((e) => {
                response.status(500);
                response.json(e);
                response.send();
            })
        })
    }

});

router.post('/createUser', (req, res, next) => {
})


app.listen(9001, () => console.log("Listening on Port 9001"));
module.exports = {
    router,
}