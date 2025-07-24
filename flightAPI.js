const axios = require('axios');
require('dotenv').config();

let accessToken = null;

async function authenticate() {
  const res = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', null, {
    params: {
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_API_KEY,
      client_secret: process.env.AMADEUS_API_SECRET
    }
  });
  accessToken = res.data.access_token;
  return accessToken;
}

async function getCheapestFlight(origin, destination, departDate, returnDate) {
  if (!accessToken) await authenticate();
  const res = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departDate,
      returnDate: returnDate,
      adults: 1,
      max: 1,
      currencyCode: 'CAD'
    }
  });

  const offer = res.data.data[0];
  const itin = offer.itineraries;
  const price = offer.price.total;

  return {
    airline: offer.validatingAirlineCodes[0],
    price,
    depart: itin[0].segments[0].departure.at,
    return: itin[1].segments[0].departure.at
  };
}

module.exports = { getCheapestFlight };
