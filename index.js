const express = require("express");
const http = require("http");
const fetch = require('node-fetch');

// create new server
const app = express();
const server = http.createServer(app);

const responseType = {
    CHUCK_NORRIS: "chuck_norris_joke",
    KANYE_QUOTE: "kanye_quote",
    NAME_SUM: "name_sum"
}

const surpriseFactories = {
    [responseType.CHUCK_NORRIS]: (name, year) => fetch("https://api.chucknorris.io/jokes/random").then(res => res.json()).then(json => json.value),
    [responseType.KANYE_QUOTE]: (name, year) => fetch("https://api.kanye.rest/").then(res => res.json()).then(json => json.quote),
    [responseType.NAME_SUM]: (name, year) => new Promise((resolve) => {
        const charArr = Array.from(name);
        const letters = charArr.filter((l) => /[a-z]/.test(l));
        const nameSum = letters.reduce((sum, letter) => sum + (letter.charCodeAt(0) - 96), 0);
        resolve(nameSum);
    })
}

const getPossibleSurpriseTypes = (name, year) => {
    const surpriseTypes = [];

    if (year <= 2000) {
        surpriseTypes.push(responseType.CHUCK_NORRIS);
    }
    else if ( name[0] !== 'z' && name[0] !== 'a' ) {
        surpriseTypes.push(responseType.KANYE_QUOTE);
    }
    if (name[0] !== 'q') {
        surpriseTypes.push(responseType.NAME_SUM);
    }
    return surpriseTypes;
}

const successes = {};

//get surprise api
app.get('/api/surprise', (req, res) => {
    const {name, birth_year} = req.query;

    if (!name || !birth_year) {
        res.status(400);
        res.send("Please provide name and birth_year to the request parameters");
        return;
    }

    const birthYear = Number(birth_year);
    const lowerName = name.toLowerCase();

    const possibleSurpriseTypes = getPossibleSurpriseTypes(lowerName, birthYear);
    const randomIndex = Math.floor(Math.random() * possibleSurpriseTypes.length); //randomIndex is the largest integer less than or equal to (random number between 0-1) * (number of surprises Types)
    const randomType = possibleSurpriseTypes[randomIndex];

    surpriseFactories[randomType](lowerName).then(result => {
        successes[randomType] = (successes[randomType] || 0) + 1;
        res.status(200);
        res.json({
            type: randomType,
            result: result
        });
    });
});

//get stats api
app.get('/api/stats', (req, res) => {
    const numSuccesses = Object.values(successes).reduce((total, success) => total += success, 0);
    const arrSuccesses = Object.keys(successes).map(success => ({ type: success, count: successes[success]}));
    res.status(200);
    res.json({
        requests: numSuccesses,
        distribution: arrSuccesses
    })
});

server.listen(3000, () => console.log(`Server is listening on port ${3000}`));