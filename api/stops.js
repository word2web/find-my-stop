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
    const transportUrl = `https://transportapi.com/v3/uk/places.json?lat=${latitude}&lon=${longitude}&radius=2000&type=bus_stop,train_station&limit=10&app_id=YOUR_APP_ID&app_key=YOUR_APP_KEY`;
    
    console.log('Fetching transport from:', transportUrl);
    
    // For now, let's use a mock response since we need API keys
    // TODO: Get proper API keys for transportapi.com or use alternative
    const mockTransportStops = [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [longitude + 0.001, latitude + 0.001]
        },
        properties: {
          name: "Wishaw Bus Station",
          type: "bus_stop",
          distance: "0.1 km",
          services: ["1", "2", "3", "240", "241"]
        }
      },
      {
        type: "Feature", 
        geometry: {
          type: "Point",
          coordinates: [longitude - 0.002, latitude - 0.001]
        },
        properties: {
          name: "Wishaw Railway Station",
          type: "train_station",
          distance: "0.3 km",
          services: ["Glasgow Central", "Edinburgh Waverley"]
        }
      },
      {
        type: "Feature",
        geometry: {
          type: "Point", 
          coordinates: [longitude + 0.003, latitude]
        },
        properties: {
          name: "Main Street Bus Stop",
          type: "bus_stop",
          distance: "0.5 km",
          services: ["1", "2", "4"]
        }
      },
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [longitude - 0.001, latitude + 0.002]
        },
        properties: {
          name: "Station Road Bus Stop",
          type: "bus_stop", 
          distance: "0.7 km",
          services: ["240", "241", "242"]
        }
      },
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [longitude + 0.004, latitude - 0.001]
        },
        properties: {
          name: "High Street Bus Stop",
          type: "bus_stop",
          distance: "1.2 km", 
          services: ["1", "3", "5"]
        }
      }
    ];

    // 3. Return the transport stops data
    res.status(200).json({
      transportStops: mockTransportStops,
      location: geoData.result
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
} 