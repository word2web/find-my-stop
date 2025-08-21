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

  const { atcocode, type } = req.query;

  if (!atcocode || !type) {
    return res.status(400).json({ error: 'ATCO code and type are required' });
  }

  try {
    // Check environment variables
    const appId = process.env.TRANSPORT_API_APP_ID;
    const appKey = process.env.TRANSPORT_API_APP_KEY;
    
    if (!appId || !appKey) {
      console.error('Missing environment variables');
      return res.status(500).json({ error: 'API configuration error - missing credentials' });
    }

    let services = [];

    if (type === 'bus_stop') {
      // Fetch bus stop timetable
      const busUrl = `https://transportapi.com/v3/uk/bus/stop/${atcocode}/live.json?app_id=${appId}&app_key=${appKey}&group=route&limit=10`;
      
      console.log('Fetching bus services from:', busUrl);
      
      const busRes = await fetch(busUrl);
      const busData = await busRes.json();

      console.log('Bus API response status:', busRes.status);
      console.log('Bus API response:', JSON.stringify(busData, null, 2));

      if (busData.error) {
        console.error('Bus services API error:', busData.error);
        return res.status(500).json({ error: `Bus services API error: ${busData.error}` });
      }

      // Extract unique route names
      if (busData.departures && busData.departures.all) {
        const routes = new Set();
        
        // Handle the actual data structure
        if (Array.isArray(busData.departures.all)) {
          // If it's an array, process each departure
          busData.departures.all.forEach(departure => {
            if (departure.line_name) {
              routes.add(departure.line_name);
            }
          });
        } else {
          // If it's an object with route keys
          Object.values(busData.departures.all).forEach(departure => {
            if (Array.isArray(departure)) {
              departure.forEach(service => {
                if (service.line_name) {
                  routes.add(service.line_name);
                }
              });
            } else if (departure.line_name) {
              routes.add(departure.line_name);
            }
          });
        }
        
        services = Array.from(routes).slice(0, 5); // Limit to 5 routes
        console.log('Extracted bus routes:', services);
      } else {
        console.log('No departures data found in bus response');
      }
    } else if (type === 'train_station') {
      // Fetch train station timetable
      const trainUrl = `https://transportapi.com/v3/uk/train/station/${atcocode}/live.json?app_id=${appId}&app_key=${appKey}&darwin=true&train_status=passenger&limit=10`;
      
      console.log('Fetching train services from:', trainUrl);
      
      const trainRes = await fetch(trainUrl);
      const trainData = await trainRes.json();

      console.log('Train API response status:', trainRes.status);
      console.log('Train API response:', JSON.stringify(trainData, null, 2));

      if (trainData.error) {
        console.error('Train services API error:', trainData.error);
        return res.status(500).json({ error: `Train services API error: ${trainData.error}` });
      }

      // Extract unique train operators and destinations
      if (trainData.departures && trainData.departures.all) {
        const trainServices = new Set();
        trainData.departures.all.forEach(departure => {
          if (departure.operator_name && departure.destination_name) {
            trainServices.add(`${departure.operator_name} to ${departure.destination_name}`);
          }
        });
        services = Array.from(trainServices).slice(0, 5); // Limit to 5 services
        console.log('Extracted train services:', services);
      } else {
        console.log('No departures data found in train response');
      }
    }

    console.log('Found services:', services);
    
    return res.status(200).json({ 
      services: services,
      type: type
    });

  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({ error: 'An error occurred while fetching services: ' + error.message });
  }
}
