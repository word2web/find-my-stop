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

        // 2. Fetch nearby bus stops (5km radius)
        const busUrl = `https://transportapi.com/v3/uk/places.json?lat=${latitude}&lon=${longitude}&radius=5000&type=bus_stop&limit=20&app_id=${appId}&app_key=${appKey}`;
    
        console.log('Fetching bus stops from:', busUrl);
        
        const busRes = await fetch(busUrl);
        const busData = await busRes.json();
    
        console.log('Bus API response status:', busRes.status);
    
        if (busData.error) {
          console.error('Bus API error:', busData.error);
          return res.status(500).json({ error: `Bus API error: ${busData.error}` });
        }
    
        // 3. Fetch train stations with much wider radius (50km)
        const trainUrl = `https://transportapi.com/v3/uk/places.json?lat=${latitude}&lon=${longitude}&radius=50000&type=train_station&limit=10&app_id=${appId}&app_key=${appKey}`;
        
        console.log('Fetching train stations from:', trainUrl);
        
        const trainRes = await fetch(trainUrl);
        const trainData = await trainRes.json();
    
        console.log('Train API response status:', trainRes.status);
    
        if (trainData.error) {
          console.error('Train API error:', trainData.error);
          return res.status(500).json({ error: `Train API error: ${trainData.error}` });
        }
    
        // Check if we have any data
        if ((!busData.member || busData.member.length === 0) && (!trainData.member || trainData.member.length === 0)) {
          return res.status(404).json({ error: 'No transport stops found' });
        }
    
        // Transform bus stops data
        const busStops = (busData.member || []).map(stop => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [stop.longitude, stop.latitude]
          },
          properties: {
            name: stop.name,
            type: stop.type,
            distance: stop.distance ? `${(stop.distance / 1000).toFixed(1)} km` : "Unknown",
            services: stop.atcocode ? [stop.atcocode] : [],
            distanceMeters: stop.distance || 999999
          }
        }));
    
        // Transform train stations data
        const trainStations = (trainData.member || []).map(stop => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [stop.longitude, stop.latitude]
          },
          properties: {
            name: stop.name,
            type: stop.type,
            distance: stop.distance ? `${(stop.distance / 1000).toFixed(1)} km` : "Unknown",
            services: stop.atcocode ? [stop.atcocode] : [],
            distanceMeters: stop.distance || 999999
          }
        }));
    
        console.log('Found', busStops.length, 'bus stops and', trainStations.length, 'train stations');
        
        if (trainStations.length > 0) {
          console.log('Train stations found:', trainStations.map(stop => ({
            name: stop.properties.name,
            distance: stop.properties.distance,
            type: stop.properties.type
          })));
        }
    
        // Sort by distance and take the 3 nearest bus stops
        const nearestBusStops = busStops
          .sort((a, b) => a.properties.distanceMeters - b.properties.distanceMeters)
          .slice(0, 3);
    
        // Get the nearest train station (if any exist)
        const nearestTrainStation = trainStations
          .sort((a, b) => a.properties.distanceMeters - b.properties.distanceMeters)
          .slice(0, 1);
    
        console.log('Selected', nearestBusStops.length, 'nearest bus stops and', nearestTrainStation.length, 'nearest train station');
    
        // Remove the distanceMeters property before sending to frontend
        const cleanBusStops = nearestBusStops.map(stop => {
          const { distanceMeters, ...cleanStop } = stop;
          return cleanStop;
        });
    
        const cleanTrainStation = nearestTrainStation.map(stop => {
          const { distanceMeters, ...cleanStop } = stop;
          return cleanStop;
        });
    
        console.log('Returning', cleanBusStops.length, 'bus stops and', cleanTrainStation.length, 'train station');
        
        return res.status(200).json({ 
          busStops: cleanBusStops,
          trainStation: cleanTrainStation[0] || null
        });
    
      } catch (error) {
        console.error('Error fetching transport stops:', error);
        return res.status(500).json({ error: 'An error occurred while fetching transport stops: ' + error.message });
      }
    }