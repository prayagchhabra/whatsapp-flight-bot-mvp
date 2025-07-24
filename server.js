require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const { getCheapestFlight } = require('./flightAPI');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/whatsapp', async (req, res) => {
  const msg = req.body.Body.trim();
  const twiml = new twilio.twiml.MessagingResponse();

  const regex = /cheapest (.*?) to (.*?) flight on (\d{1,2} \w+) return (\d{1,2} \w+)/i;
  const match = msg.match(regex);

  let reply = "👋 Send: *Find me cheapest Toronto to Delhi flight on 25 August return 10 September*";

  if (match) {
    const [, origCity, destCity, departRaw, returnRaw] = match;
    const parseDate = str => {
      const [d, m] = str.split(' ');
      const months = { january:'01', february:'02', march:'03', april:'04',
      may:'05', june:'06', july:'07', august:'08', september:'09',
      october:'10', november:'11', december:'12' };
      return `2025-${months[m.toLowerCase()]}-${d.padStart(2,'0')}`;
    };

    const origin = { toronto:'YYZ', delhi:'DEL' }[origCity.toLowerCase()];
    const destination = { toronto:'YYZ', delhi:'DEL' }[destCity.toLowerCase()];

    if (!origin || !destination) {
      reply = "❌ Couldn't find airport codes for those cities.";
    } else {
      try {
        const flight = await getCheapestFlight(origin, destination, parseDate(departRaw), parseDate(returnRaw));
        reply = [
          `✈️ Cheapest flight found:`,
          `*${flight.airline}*`,
          `${origCity} ➡️ ${destCity}`,
          `📅 ${departRaw} - ${returnRaw}`,
          `🕒 Depart: ${flight.depart}`,
          `💵 *CAD ${flight.price}*`,
          `\nReply *yes* to book.`
        ].join('\n');
      } catch (e) {
        console.error(e.response?.data || e);
        reply = "⚠️ Couldn't fetch flight offers right now.";
      }
    }
  }

  twiml.message(reply);
  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
