# 🚌 Find My Stop

A wee React application that helps you find your nearest bus stops and train stations by entering a UK postcode.

## Features

- **Postcode Search**: Enter any valid UK postcode to find nearby transport stops
- **Transport Types**: Shows both bus stops (🚌) and train stations (🚆)
- **Distance Information**: Displays how far each stop is from your location
- **Service Information**: Lists the bus routes or train services available
- **Google Maps Integration**: Direct links to view each stop on Google Maps
- **Responsive Design**: Works on desktop and mobile devices

## How to Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Start the API server** (in a separate terminal):
   ```bash
   node server.js
   ```

4. **Open your browser** and go to `http://localhost:5173`

## How It Works

1. **Postcode Geocoding**: Uses the [postcodes.io](https://postcodes.io/) API to convert postcodes to coordinates
2. **Transport Data**: Currently uses mock data for transport stops (see TODO below)
3. **Frontend**: React app with modern, responsive UI
4. **Backend**: Express server handling API requests

## TODO (MAYBE)

- [ ] Include more transport types, if applicable (trams, underground, etc.)
- [ ] Add filtering by transport type
- [ ] Implement distance-based sorting
- [ ] Add optional automatic geolocation feature
- [ ] Filter results to include at least one train station

## Technologies Used

- **Frontend**: React 19, Vite
- **Backend**: Express.js, Node.js
- **APIs**: postcodes.io (geocoding), transportapi.com (UK public transport information)
- **Styling**: CSS3 with responsive design

## API Endpoints

- `GET /api/stops?postcode={postcode}` - Returns nearby transport stops

## License

MIT License

## Tools
Built with the help of Cursor (powered by OpenAI GPT-4).
