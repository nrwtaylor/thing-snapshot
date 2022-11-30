#!/usr/bin/env node

require("dotenv").config();

const fs = require("fs");
const {
  promises: { readFile },
} = require("fs");

const axios = require("axios");

const datagrams = [{}];

// 26 September 2021
console.log("thing-snapshot 1.0.3 15 November 2022");

console.log = function() {}

/*
Standard stack stuff above.
*/

var hosts = process.env.STATIONS.split(" ");
var channel = process.env.CHANNEL;
var transport = process.env.TRANSPORT;
var interval_milliseconds = process.env.INTERVAL;
var http_transport = process.env.HTTP_TRANSPORT;
var station = process.env.STATION;
var from = process.env.FROM;
var snapshotPath = process.env.SNAPSHOT;

//var minutes = 1,
the_interval = interval_milliseconds;

interval = setInterval(function () {
  // do your stuff here
  console.log("hosts", hosts);

  const promises = [];

  hosts.map((h) => {
    console.log("Interval: Process host " + host);
    var host = h;

    //    handleLine(null);

    const q = handleLine(null);
    promises.push(q);

    Promise.all(promises).then((values, index) => {
      console.log(">>>>>>>>>>>>>>>>>.promises");
      console.log(values);
    });

    //});
  });
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
    //    fs.readFile(snapshotPath, "utf8", (err, data) => {
    Promise.all([readFile(snapshotPath), readFile("/tmp/snapshot-ping.json")])
      .then((promises) => {
        const data = promises[0];
        const data2 = promises[1];
        console.log("data2", data2);

        console.log("thing-snapshot Reading file at " + snapshotPath + ".");

        //      if (err) {
        //        agent_input = `Error reading file from disk: ${err}`;
        //        console.log(agent_input);
        //      } else {
        //      if (true) {
        agent_input = data;

        try {
          parsed = JSON.parse(agent_input);
          parsed2 = JSON.parse(data2);
        } catch (e) {
          parsed = { error: "JSON parse error" };
        }

        //parsed = {...parsed, {snapshot:{refreshedAt:0}}};
        parsed = { ...parsed, ...parsed2, refreshedAt: timestamp };

        console.log(parsed);
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

        const snapshotFile = "/tmp/snapshot.json";

        fs.writeFile("/tmp/snapshot.json", snapshot, "utf8", function (err) {
          if (err) return console.error(err);
          console.log("thing-snapshot Wrote file to", snapshotFile);
        });


        if (transport === "apache") {
        //if (true === false) {
          axios
            .post(http_transport, datagram, {
              headers: {
                "Content-Type": "application/json",
              },
            })
            .then((result) => {
              //              console.log("result", result);
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
                console.error(e);

                var sms = "quiet";
                var message = "Quietness. Just quietness.";
              }

              // console.log(thing_report);
              // console.log(thing_report.link);
              //    const image_url = thing_report && thing_report.link ? thing_report.link + '.png' : null

              const image_url =
                thing_report && thing_report.image_url
                  ? thing_report.image_url
                  : null;

              // console.log(image_url);
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

if (error && error.code === 'ENOTFOUND') {
console.error("POST ERROR ENOTFOUND", http_transport); 
return Promise.resolve('ignore');
}

if (error && error.code ==='ECONNRESET') {

console.error("POST ERROR ECONNRESET", http_transport); 
return Promise.resolve('ignore');

}

if (error && error.code ==='ETIMEDOUT') {

console.error("POST ERROR ETIMEDOUT", http_transport); 
return Promise.resolve('ignore');

}


              console.error("POST ERROR", error);
Promise.resolve('ignore');
            });
          //        }
        }
      })
      .catch((error) => {
        console.error("Read error", error);

        if (error) {
          agent_input = `Error reading file from disk: ${error}`;
          //        console.log(agent_input);
          //      } else {
        }
Promise.resolve('ignore');


      });
  } catch (err) {
    console.error("Promise all", err);
  }
}

function t() {
  fs.readFile(snapshotPath, "utf8", (err, data) => {
    console.log("thing-snapshot reading file at " + snapshotPath + ".");

    if (err) {
      agent_input = `Error reading file from disk: ${err}`;
      console.error(agent_input);
    } else {
      agent_input = data;

      try {
        parsed = JSON.parse(agent_input);
      } catch (e) {
        parsed = { error: "JSON parse error" };
      }

      //parsed = {...parsed, {snapshot:{refreshedAt:0}}};
      parsed = { ...parsed, refreshedAt: timestamp };
      console.log(parsed);
    }
  });
}
