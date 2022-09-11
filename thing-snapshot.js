#!/usr/bin/env node

require("dotenv").config();

const fs = require("fs");
const {
  promises: { readFile },
} = require("fs");

const axios = require("axios");

const datagrams = [{}];
const ignoreRemotePollInterval = false;
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

the_interval = interval_milliseconds;

interval = setInterval(function () {
  const q = handleLine(null);

  currentPollInterval = the_interval;
}, the_interval);

function handleLine(line) {
  /*
        REFERENCE
        $datagram = [
            "to" => "null" . $this->mail_postfix,
            "from" => "job",
            "subject" => "s/ job stack",
        ];
  */

  //  var to = channel;

  var to = "snapshot";
  //  var from = channel;

  const subject = line;
  var agent_input = "snapshot";

  //  match = false;

  console.log(subject);

  // Otherwise this is a different datagram.
  // Save it in local memory cache.

  // https://dev.to/aminnairi/read-files-using-promises-in-node-js-1mg6

  //console.log("SUBJECT", subject);
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

    Promise.all(p)
      .then((promises) => {
        const data2 = promises[0];

        //        agent_input = data;
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

        //const p = JSON.parse(data2);
        const p = c;
        //        parsed = { ...parsed, refreshedAt: timestamp };
        //        parsed = { ...parsed, refreshedAt: timestamp };
        parsed = { ...p, refreshedAt: timestamp };

        console.log("parsed", parsed);

        var arr = {
          from: from,
          to: to,
          subject: subject,
          agent_input: parsed,
          precedence: "routine",
          interval: currentPollInterval,
        };
        console.log("Prepared snapshot datagram");
        console.log(arr);
        var datagram = JSON.stringify(arr);

        var snapshot = JSON.stringify({
          ...arr,
          thingReport: { snapshot: parsed },
        });

        fs.writeFile("/tmp/snapshot.json", snapshot, "utf8", function (err) {
          if (err) return console.log(err);
          console.log("Wrote snapshot file.");
        });

        if (transport === "apache") {
          axios
            .post(http_transport, datagram, {
              headers: {
                "Content-Type": "application/json",
              },
            })
            .then((result) => {
              const thing_report = result.data.thingReport;

              const requestedPollInterval =
                thing_report && thing_report.requested_poll_interval;
              console.log("thing_report", thing_report);
              console.log("requested_poll_interval", requestedPollInterval);

              if (
                parseFloat(requestedPollInterval) !==
                parseFloat(currentPollInterval)
              ) {
                if (requestedPollInterval === "x") {
                } else if (requestedPollInterval === "z") {
                } else {
                  if (ignoreRemotePollInterval) {
                    var i = parseFloat(requestedPollInterval);
                    clearInterval(interval);
                    interval = setInterval(function () {
                      // do your stuff here
                      console.log("hosts", hosts);
                      hosts.map((h) => {
                        var host = h;
                        handleLine(null);
                      });
                      currentPollInterval = i;
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
                console.log(e);

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
                  console.log(sms);
                  //        discordMessage.channel.send(sms);
                } else {
                  console.log(sms);
                  console.log("image(s) available");
                  //        discordMessage.channel.send(sms, { files: [image_url] });
                }
              }
            })
            .catch((error) => {
              console.log("POST ERROR", error);
              Promise.resolve("ignore");
            });
        }
      })
      .catch((error) => {
        console.error("Read error", error);

        if (error) {
          agent_input = `Error reading file from disk: ${error}`;
        }
        Promise.resolve("ignore");
      });
  } catch (err) {
    console.log("Promise all", err);
  }
}
