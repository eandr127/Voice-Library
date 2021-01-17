var express = require("express");
var router = express.Router();
const fs = require("fs");
const multer = require("multer");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

router.get("/message", function (req, res) {
  res.json("Welcome To React (backend)");
});

router.get("/split-voices", (req, res) => {
  splitVoices("./server/counting.mp3", [{ word: "hi", start: 2, end: 5 }]);
  res.send("Hello");
});

function splitVoices(allVoiceFile, wordInfo) {
  //Hard coded for testing purposes (allVoiceFile and wordInfo are hard coded)
  allVoiceFile = "./server/counting.mp3";
  wordInfo = [
    { word: "bye", start: 2.5, end: 5.7 },
    { word: "hi", start: 1.2, end: 2.44 },
  ];

  wordInfo.forEach((wordObj) => {
    ffmpeg.ffprobe(allVoiceFile, (err, metaData) => {
      outputFile = `./server/carlafile/${wordObj.word}.mp3`;
      var startingTime = wordObj.start;
      var clipDuration = wordObj.end - wordObj.start;
      console.log(`Start: ${startingTime}, Duration: ${clipDuration}`);
      ffmpeg()
        .input(allVoiceFile)
        .inputOptions([`-ss ${startingTime}`])
        .outputOptions([`-t ${clipDuration}`])
        .output(outputFile)
        .on("end", () => console.log("done"))
        .on("error", (err) => console.error(err))
        .run();
    });
  });
}

/* Must be sent files to be merged in order */

router.get("/combine-voices", (req, res) => {
  const testDir = "./server/ginafile/";
  var files = fs.readdirSync(testDir);
  var voicesToMix = [];
  //should be changed to however we are storing and displaying the stored voices
  var combinedVoice = fs.createWriteStream(testDir + "testFile.mp3");
  var readStream;
  //The next few lines of code should be replaced by a function that takes data
  //from data base and puts it in order of where it should be added
  files.forEach((file) => {
    voicesToMix.push(file.toString());
    console.log("File found!: " + file.toString());
  });

  function combineFiles() {
    if (voicesToMix.length == 0) {
      combinedVoice.end("Done");
      res.send(combinedVoice);
      return;
    }
    var currentFile = testDir + voicesToMix.pop();
    readStream = fs.createReadStream(currentFile);
    readStream.pipe(combinedVoice, { end: false });
    readStream.on("end", function () {
      console.log(currentFile + " has been added");
      combineFiles();
    });
  }
  combineFiles();
});

const upload = multer({ storage: multer.memoryStorage() });

router.post("/uploadaudio", upload.single("audio"), function (req, res, next) {
  const file = req.file;
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }
  res.send(file);
});

module.exports = router;
