const express = require("express");
const bodyParser = require("body-parser");
const https = require('https');
const helper = require("./helper.js");

const app = express();
app.use(bodyParser.json());

function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({ "error": message });
}

module.exports = () => {

    /*var server = app.listen(process.env.API_PORT, function () {
        var port = server.address().port;
        console.log("App now running on port", port);
    });*/

    app.post("/api/reminder", (req, res) => {

        if (!req.body || Object.entries(req.body).length === 0) {
            handleError(res, "Empty request body", "Body must not be empty", 400);
        } 
        else {
            const reminder = req.body;
            console.log(reminder);

            res.sendStatus(200);
        }
    });

    const server = https.createServer(app);
    const {API_PORT} = process.env;

    server.listen(API_PORT, ()=>{
        console.log("App now running on port", API_PORT);
    });
}