import fetch from 'node-fetch';

export default async (req, res) => {
  // Enable CORS
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
    
    // Check environment variables
    const appId = process.env.TRANSPORT_API_APP_ID;
    const appKey = process.env.TRANSPORT_API_APP_KEY;
    
    if (!appId || !appKey) {
      console.error('Missing environment variables:', { appId: !!appId, appKey: !!appKey });
      return res.status(500).json({ error: 'API configuration error - missing credentials' });
    }
    
    // 1. Geocode postcode
    const geoRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    const geoData = await geoRes.json();
    
    console.log('Geocoding response status:', geoRes.status);
    
    if (!geoData.result) {
      return res.status(400).json({ error: 'Invalid postcode' });
    }

    const { latitude, longitude } = geoData.result;
    console.log('Coordinates:', { latitude, longitude });

    // 2. Fetch nearby transport stops using TransportAPI
    const transportUrl = `https://transportapi.com/v3/uk/places.json?lat=${latitude}&lon=${longitude}&radius=2000&type=bus_stop,train_station&limit=10&app_id=${appId}&app_key=${appKey}`;
    
    console.log('Fetching transport from:', transportUrl);
    
    const transportRes = await fetch(transportUrl);
    const transportData = await transportRes.json();

    console.log('TransportAPI response status:', transportRes.status);

    if (transportData.error) {
      console.error('TransportAPI error:', transportData.error);
      return res.status(500).json({ error: `Transport API error: ${transportData.error}` });
    }

    if (!transportData.member || !Array.isArray(transportData.member) || transportData.member.length === 0) {
      return res.status(404).json({ error: 'No transport stops found' });
    }

    // Transform the TransportAPI data to match frontend expectations
    const stops = transportData.member.map(stop => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [stop.longitude, stop.latitude]
      },
      properties: {
        name: stop.name,
        type: stop.type,
        distance: stop.distance ? `${(stop.distance / 1000).toFixed(1)} km` : "Unknown",
        services: stop.atcocode ? [stop.atcocode] : []
      }
    }));

    console.log('Returning', stops.length, 'stops');
    return res.status(200).json({ transportStops: stops });

  } catch (error) {
    console.error('Error fetching transport stops:', error);
    return res.status(500).json({ error: 'An error occurred while fetching transport stops: ' + error.message });
  }
} 