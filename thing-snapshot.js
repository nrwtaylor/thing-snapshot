#!/usr/bin/env node

require("dotenv").config();

net = require("net");
const fs = require("fs");

const axios = require("axios");

const datagrams = [{}];

const var_dump = require("var_dump");

var sys = require("sys");
var exec = require("child_process").exec;

// 26 September 2021
console.log("thing-snapshot 1.0.0 15 July 2022");

//const client = gearmanode.client();
//
/*
Standard stack stuff above.
*/
//var ping = require('ping');
//var Ping = require('ping-wrapper')
//Ping.configure();

var hosts = process.env.STATIONS.split(" ");
var channel = process.env.CHANNEL;
var transport = process.env.TRANSPORT;
var interval_milliseconds = process.env.INTERVAL;
var http_transport = process.env.HTTP_TRANSPORT;
var station = process.env.STATION;
var from = process.env.FROM;

//var minutes = 1,
the_interval = interval_milliseconds;

setInterval(function () {
  //exec("ping -c 3 localhost", puts);

  //  console.log("I am doing my 1 minute check again");
  // do your stuff here
  console.log("hosts", hosts);
  hosts.map((h) => {
    var host = h;
    handleLine(null);
  });
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
  //  var from = "ping";

  var to = "snapshot";
  //  var from = channel;

  const subject = line;
  var agent_input = "ping";

  //  match = false;

  console.log(subject);

  // Otherwise this is a different datagram.
  // Save it in local memory cache.

  //console.log("SUBJECT", subject);
  const timestamp = new Date();
  const utc = timestamp.toUTCString();

  fs.readFile("/var/www/kplex-thing/snapshot.json", "utf8", (err, data) => {
    if (err) {
      agent_input = `Error reading file from disk: ${err}`;
    } else {
      agent_input = data;

      var arr = {
        from: from,
        to: to,
        subject: subject,
        agent_input: JSON.parse(agent_input),
        precedence: "routine",
      };
      console.log(arr);
      var datagram = JSON.stringify(arr);

      if (transport === "apache") {
        axios
          .post(http_transport, datagram, {
            headers: {
              "Content-Type": "application/json",
            },
          })
          .then((result) => {
            const thing_report = result.data.thingReport;

            console.log("thing_report", thing_report);

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
            console.log(error);
          });
      }
    }
  });
}
