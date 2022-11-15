#!/usr/bin/env node

require("dotenv").config();

const fs = require("fs");
const {
  promises: { readFile },
} = require("fs");

const axios = require("axios");

const datagrams = [{}];

// 14 November 2022
console.log("thing-history 1.0.1 15 November 2022");

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

var historyWindowSize = process.env.HISTORY_WINDOW_SIZE; //8;

var to = "history";

const keyPathname = process.env.KEY_PATHNAME;
const snapshotPathnames = process.env.SNAPSHOT_PATHNAMES.split(",");

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
  var agent_input = "snapshot";

  const timestamp = new Date();
  const utc = timestamp.toISOString();
  try {
    const promiseArray = snapshotPathnames.map((snapshotPathname) => {
      return readFile(snapshotPathname);
    });

    const readStartTime = new Date();
    Promise.all(promiseArray).then((promises) => {
      const readRunTime = new Date() - readStartTime;
      console.log("Read file in", readRunTime, "ms.");

      const data = promises[0];
      const data2 = promises[1];
      console.log("data2", data2);

      agent_input = data;

      try {
        parsed = JSON.parse(agent_input);
        parsed2 = JSON.parse(data2);
      } catch (e) {
        parsed = { error: "JSON parse error" };
      }

      //parsed = {...parsed, {snapshot:{refreshedAt:0}}};
      parsed = { ...parsed, ...parsed2, refreshedAt: utc };

      Object.keys(parsed).forEach((name) => {
        if (["ping", "transducers"].includes(name)) {
          const elements = parsed[name];

          Object.keys(elements).forEach((elementText) => {
            const startTime = new Date();

            const slug = (name + "-" + elementText).toLowerCase();
            const key = slug;

            const value = elements[elementText];

            // Do Mongo write here
            getHistory(slug)
              .then((result) => {
                const isValidHistory = Array.isArray(result.agent_input);

                const event = { event: value, eventAt: getTimestamp() };
                var items = [event];

                if (isValidHistory) {
                  items = result.agent_input;
                  items.push(event);
                }
                const slicedItems = items.slice(-1 * historyWindowSize);

                setHistory(slug, slicedItems);

                const runTime = new Date() - startTime;
                console.log(
                  slug,
                  "processed in",
                  runTime,
                  "ms",
                  "has",
                  slicedItems.length,
                  "items."
                );

                //                setHistory(slug, slicedItems);
              })
              .catch((error) => {
                console.log("did not get history", slug);
                console.log(error);
                setHistory(slug, value);
              });
          });
        }
      });

      const totalRunTime = new Date() - readStartTime;
      console.log("totalRunTime", totalRunTime, "ms");
    });
  } catch (err) {
    console.log("Promise all erro", err);
  }
}

function getTimestamp() {
  const timestamp = new Date();
  const utc = timestamp.toISOString();
  return utc;
}

function getHistory(slug) {
  var parsed = "";
  //const snapshotPath = "/tmp/" + slug + ".json";
  const snapshotPath = keyPathname + slug + ".json";
  console.log("snapshotPath", snapshotPath);

  const p = new Promise((resolve, reject) => {
    fs.readFile(snapshotPath, "utf8", (err, data) => {
      //console.log("Reading file at " + snapshotPath + ".");

      if (err) {
        agent_input = `Error reading file from disk: ${err}`;
        console.log(agent_input);
        reject({ error: agent_input });
      } else {
        agent_input = data;

        try {
          parsed = JSON.parse(agent_input);
        } catch (e) {
          parsed = { error: "JSON parse error" };
          reject(parsed);
        }

        const timestamp = new Date();
        const utc = timestamp.toUTCString();

        parsed = { ...parsed, refreshedAt: utc };

        //console.log("getHistory slug parsed", slug, parsed);
        resolve(parsed);
      }
    });
  });
  return p;
}

function setHistory(slug, history) {
  //return true;

  var arr = {
    from: from,
    to: to,
    subject: slug,
    agent_input: history,
    precedence: "routine",
    interval: currentPollInterval,
  };
  var datagram = JSON.stringify(arr);

  var snapshot = JSON.stringify({
    ...arr,
    //    thingReport: { snapshot: parsed },
  });

  fs.writeFile(keyPathname + slug + ".json", snapshot, "utf8", function (err) {
    if (err) return console.log(err);
    //console.log("Write file", slug, snapshot);
    //console.log("Hello World > helloworld.txt");
  });

  if (transport === "apache") {
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
        //console.log("thing_report", thing_report);
        // console.log("requested_poll_interval", requestedPollInterval);

        if (
          parseFloat(requestedPollInterval) !== parseFloat(currentPollInterval)
        ) {
          if (requestedPollInterval === "x") {
          } else if (requestedPollInterval === "z") {
          } else {
            var i = parseFloat(requestedPollInterval);
            clearInterval(interval);
            interval = setInterval(function () {
              // do your stuff here
              // console.log("hosts", hosts);
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
          console.log(e);

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
        console.log("POST ERROR", http_transport);
        Promise.resolve("ignore");
      });
  }
}
