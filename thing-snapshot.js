#!/usr/bin/env node

require("dotenv").config();

const fs = require("fs");
const {
  promises: { readFile },
} = require("fs");

const axios = require("axios");

const datagrams = [{}];
const ignoreRemotePollInterval = true;
// 26 September 2021
console.log("thing-snapshot 1.0.3 10 September 2022");

var hosts = process.env.STATIONS.split(" ");
var channel = process.env.CHANNEL;
var transport = process.env.TRANSPORT;
var interval_milliseconds = process.env.INTERVAL;
var http_transport = process.env.HTTP_TRANSPORT;
var station = process.env.STATION;
var from = process.env.FROM;
var snapshotPaths = process.env.SNAPSHOTS.split(" ");

const snapshotFile = "/tmp/snapshot.json";

the_interval = interval_milliseconds;

var currentStackPollInterval = the_interval;

let interval = setInterval(function () {
  const q = handleLine(null).then((arr) => {
    //        var datagram = JSON.stringify(arr);

    var snapshot = JSON.stringify({
      ...arr,
      thingReport: { snapshot: arr.agent_input },
    });

    filePost(snapshot);
  });

  currentPollInterval = the_interval;
  console.log("filePost currentPollInterval", currentPollInterval);
}, the_interval);

the_interval = interval_milliseconds;

let stackInterval = setInterval(function () {
  var p = currentStackPollInterval;
  const q = handleLine(null).then((arr) => {
    var datagram = JSON.stringify(arr);

    stackPost(datagram).then((p) => {
    });
  });
}, currentStackPollInterval);

function handleLine(line) {
  //  var to = channel;

  var to = "snapshot";
  //  var from = channel;

  const subject = line;
  var agent_input = "snapshot";

  // Otherwise this is a different datagram.
  // Save it in local memory cache.

  // https://dev.to/aminnairi/read-files-using-promises-in-node-js-1mg6

  const timestamp = new Date();
  const utc = timestamp.toUTCString();
  try {
    const p = snapshotPaths.map((snapshotPath) => {
      return readFile(snapshotPath)
        .then((result) => {
          return result;
        })
        .catch((error) => {
          return null;
        });
    });

    return Promise.all(p)
      .then((promises) => {
        const data2 = promises[0];

        var c = {};
        var parsed = promises.map((data) => {
          try {
            const x = JSON.parse(data);
            c = { ...c, ...x };
            return JSON.parse(data);
          } catch (e) {
            return { error: "JSON parse error" };
          }
        });

        const p = c;
        parsed = { ...p, refreshedAt: timestamp };

        var arr = {
          from: from,
          to: to,
          subject: subject,
          agent_input: parsed,
          precedence: "routine",
          interval: currentPollInterval,
        };

        return arr;
      })
      .catch((error) => {
        console.error("Read error", error);

        if (error) {
          agent_input = `Error reading file from disk: ${error}`;
        }
        Promise.resolve("ignore");
      });
  } catch (err) {
    console.log("Promise all error", err);
  }
}

function filePost(snapshot) {
  fs.writeFile(snapshotFile, snapshot, "utf8", function (err) {
    if (err) return console.log(err);
    console.log("filePost wrote snapshot " + snapshotFile);
  });
}

function stackPost(datagram) {
  if (transport === "apache") {
    var i = currentStackPollInterval;
    return axios
      .post(http_transport, datagram, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((result) => {
        console.log("stackPost " + http_transport);
        const thing_report = result.data.thingReport;

        const requestedPollInterval =
          thing_report && thing_report.requested_poll_interval;
        console.log("requested_poll_interval", requestedPollInterval);

        if (
          parseFloat(requestedPollInterval) !== parseFloat(currentStackPollInterval)
        ) {
          if (requestedPollInterval === "x") {
          } else if (requestedPollInterval === "z") {
          } else {
            var i = parseFloat(requestedPollInterval);

            if (ignoreRemotePollInterval) {
              //              var i = parseFloat(requestedPollInterval);
              clearInterval(stackInterval);
              console.log("stack set interval i", i);
                  currentStackPollInterval = i;

              stackInterval = setInterval(function () {
                // do your stuff here

                handleLine(null).then((arr) => {
                  var datagram = JSON.stringify(arr);

                  stackPost(datagram).then((p) => {
console.log("stackPost interval ", currentStackPollInterval);
});

                });

              }, i);
            }
          }
        }

        // Create a fallback message.
        // Which says 'sms'.
        sms = "sms";
        message = "sms";

        try {
          //      var thing_report = JSON.parse(job.response);
          var sms = thing_report.sms;
          var message = thing_report.message;
          //var agent = thing_report.agent;
          //var uuid = thing_report.thing.uuid;
        } catch (e) {
          console.error("message and sms not found", e);

          var sms = "quiet";
          var message = "Quietness. Just quietness.";
        }

        //    const image_url = thing_report && thing_report.link ? thing_report.link + '.png' : null

        const image_url =
          thing_report && thing_report.image_url
            ? thing_report.image_url
            : null;

        if (sms !== null) {
          if (image_url === null) {
            console.log("sms", sms);
            //        discordMessage.channel.send(sms);
          } else {
            console.log("sms", sms);
            console.log("image(s) available");
            //        discordMessage.channel.send(sms, { files: [image_url] });
          }
        }

        return i;
      })
      .catch((error) => {
        console.log("POST ERROR", error);
        Promise.resolve("ignore");
      });
  }
}
