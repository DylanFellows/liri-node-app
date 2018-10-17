// Import neccessary packages for use with their functionalities
const dotenv = require('dotenv').config();
const request = require("request");
const moment = require("moment");
const Spotify = require('node-spotify-api');
const fs = require('fs');
const readLine = require('readline');

// Store property values in variables
const bandsKey = process.env.BANDS_API;
const spotifyId = process.env.SPOTIFY_ID;
const spotifySecret = process.env.SPOTIFY_SECRET;
const movieKey = process.env.OMBD_API;

// List of valid commands liri.js can process
const validCommands = ["concert-this", "spotify-this-song", "movie-this", "do-what-it-says"];

const CRLF = "\n";

// Defaults
const defaultMovieName = "Mr. Nobody";
const defaultSongName = "What's My Age Again";

var artistName = '';
var movieName = '';
var songName = '';


if (validArgs()) {

    // Call correct functionality based on command line args 
    if (process.argv[2] === "concert-this") {
        artistName = process.argv[3];
        if(artistName === '') {
            console.log("Please provide an artist/band name");
        }
        displayBandData();
    } else if (process.argv[2] === "spotify-this-song") {
        songName = process.argv[3];
        if(songName === '') {
            console.log("No song entered, defaulting...")
            songName = defaultSongName;
        }
        displaySongData();
    } else if (process.argv[2] === "movie-this") {
        movieName = process.argv[3];
        if(movieName === '') {
            console.log("No movie entered, defaulting...")
            movieName = defaultMovieName;
        }
        displayMovieData();
    } else if (process.argv[2] === "do-what-it-says") {
        readFile('random.txt');
    }
}


// Checks if the arguments passed in the terminal are valid
function validArgs() {
    let retVal = true;

    // There will always be either 4 arguments or 3 arguments in the case of do-what-it-says command. 
    if (process.argv.length != 4 && !(process.argv[2] === 'do-what-it-says')) {
        // Inform user of LIRI usage in the event they enter incorrect arguments
        usage();
        retVal = false;
    }
    else if (!validCommands.includes(process.argv[2])) {
        // If user enters an invalid command, inform them, and show usage
        console.log('You have entered an invalid command.' + CRLF);
        usage();
        retVal = false;
    }
    return retVal;
}

// Displays the band data in the terminal 
function displayBandData() {

    // Requests band data from the BandsInTown API
    let queryUrl = `https://rest.bandsintown.com/artists/${artistName}/events?app_id=${bandsKey}`
    request({
        url: queryUrl,
        json: true
    }, function (error, response, body) {

        // Checks if there are any upcoming events 
        if (!error && response.statusCode === 200) {
            if (!Array.isArray(body) || !body.length) {
                console.log('Either the spelling of the band/artist name is incorrect or there are no upcoming events' + 
                            ` for the artist/band named ${artistName}.`);
            }
            else {
                // For every event, show the event information
                let bandInfo = '';
                console.log(CRLF);
                for (let i = 0; i < body.length; i++) {
                    let venue = body[i].venue;
                    bandInfo += "Event number " + (i + 1) + CRLF;
                    bandInfo += "Name of venue: " + venue.name + CRLF;
                    bandInfo += "Location of event: " + venue.city + ", " + venue.region + " - " + venue.country + CRLF;
                    bandInfo += "Date of event: " + moment(body[i].datetime).format("MM/DD/YYYY") + CRLF;
                    bandInfo += CRLF;
                }
                console.log(bandInfo);
            }
        }
    })
}


// Displays the song data in the terminal
function displaySongData() {
    var spotify = new Spotify({ id: spotifyId, secret: spotifySecret });

    // Searches the spotify API for a given song
    spotify.search({ type: 'track', query: `${songName}` }, function (err, data) {
        if (err) {
            return console.log('Error occurred: ' + err);
        }

        let songResults = "";
        console.log(CRLF);
        try {
            // Display the song information to the terminal
            for (let i = 0; i < data.tracks.items.length; i++) {
                songResults += data.tracks.items[i].album.artists[0].name + CRLF;
                songResults += data.tracks.items[i].name + CRLF;
                songResults += data.tracks.items[i].album.artists[0].external_urls.spotify + CRLF;
                songResults += data.tracks.items[i].album.name + CRLF;
                songResults += CRLF;
            }
            console.log(songResults);
        } catch (e) {
            console.log(`An error occured while attempting to retrieve results for song ${songName}.`);
        }
    });
}

// Displays the movie data in terminal
function displayMovieData() {

    // Request the movie data from OMDB API
    let queryUrl = `http://www.omdbapi.com/?t=${movieName}&apikey=${movieKey}&`
    request({
        url: queryUrl,
        json: true
    }, function (err, res, body) {
        let movieResults = '';
        console.log(CRLF);
        try {

            // Display movie results in the terminal
            if (!err && res.statusCode === 200) {
                movieResults += "Title: " + body.Title + CRLF;
                movieResults += "Year: " + body.Year + CRLF;
                movieResults += "IMDB Raing: " + body.imdbRating + CRLF;

                let arr = body.Ratings;
                let rottenTomatoesRating;

                // Find the value of the movie rating for the entry in the array 
                // having a source key equal to 'Rotten Tomatoes'
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].Source === "Rotten Tomatoes") {
                        rottenTomatoesRating = arr[i].Value;
                        break;
                    }
                }
                movieResults += "Rotten Tomatoes rating: " + rottenTomatoesRating + CRLF;
                movieResults += "Country: " + body.Country + CRLF;
                movieResults += "Language: " + body.Language + CRLF;
                movieResults += "Plot: " + body.Plot + CRLF;
                movieResults += "Actors: " + body.Actors + CRLF;
                movieResults += CRLF;
                console.log(movieResults);
            }
            else {
                console.log(err);
            }
        } catch (e) {
            console.log(`An error occured while attempting to retrieve movie results for ${movieName}. 
                        Please check your spelling of the movie name`);
        }
    })
}

// Read input file parse each line and spawn child process
function readFile(fileName) {

    // Read next line from file
    var lineReader = readLine.createInterface({
        input: fs.createReadStream(fileName)
    });

    // For each line in input file call node js using input from file
    lineReader.on('line', function (line) {
        let cmd = 'node liri.js ' + line;
        execChild(cmd);
    });
}

// Execute a given node LIRI command
function execChild(cmd) {
    const { exec } = require('child_process');
    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            return;
        }
        else {
            console.log(stdout);
        }
    });
}

// Inform the user of the correct usage of LIRI
function usage() {
    console.log(CRLF);
    console.log("Usage is:");
    console.log('node liri.js concert-this "band/artist name" ');
    console.log('node liri.js spotify-this-song "song name"');
    console.log('node liri.js movie-this "movie name"');
    console.log("node liri.js do-what-it-says");
}