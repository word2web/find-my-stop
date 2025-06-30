import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Enable CORS for your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { postcode } = req.query;

  if (!postcode) {
    return res.status(400).json({ error: 'Postcode is required' });
  }

  try {
    console.log('Geocoding postcode:', postcode);
    
    // 1. Geocode postcode
    const geoRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    const geoData = await geoRes.json();
    
    console.log('Geocoding response status:', geoRes.status);
    
    if (!geoData.result) {
      return res.status(400).json({ error: 'Invalid postcode' });
    }

    const { latitude, longitude } = geoData.result;
    console.log('Coordinates:', { latitude, longitude });

    // 2. Fetch nearby transport stops using NaPTAN API
    // Using a radius of 2km (2000m) to find nearby stops
    const appId = process.env.TRANSPORT_API_APP_ID;
    const appKey = process.env.TRANSPORT_API_APP_KEY;
    const transportUrl = `https://transportapi.com/v3/uk/places.json?lat=${latitude}&lon=${longitude}&radius=2000&type=bus_stop,train_station&limit=10&app_id=${appId}&app_key=${appKey}`;
    
    console.log('Fetching transport from:', transportUrl);
    
    const transportRes = await fetch(transportUrl);
    const transportData = await transportRes.json();

    if (!transportData.places) {
      return res.status(404).json({ error: 'No transport stops found' });
    }

    // Transform transportData.places into your desired format and return it

  } catch (error) {
    console.error('Error fetching transport stops:', error);
    return res.status(500).json({ error: 'An error occurred while fetching transport stops' });
  }
}
