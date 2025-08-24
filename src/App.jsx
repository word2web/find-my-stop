import { useState } from 'react'
import './App.css'

function App() {
  const [postcode, setPostcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busStops, setBusStops] = useState([])
  const [trainStation, setTrainStation] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusStops([])
    setTrainStation(null)
    setLoading(true)
    
    try {
      // Call our serverless function
      const res = await fetch(`/api/stops?postcode=${encodeURIComponent(postcode)}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong')
      }
      
      setBusStops(data.busStops || [])
      setTrainStation(data.trainStation || null)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGeolocation = async () => {
    setError('')
    setLoading(true)
    
    try {
      // Get current position
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })
      
      const { latitude, longitude } = position.coords
      
      // Use coordinates directly to find nearby stops
      const stopsResponse = await fetch(`/api/stops?lat=${latitude}&lon=${longitude}`)
      const stopsData = await stopsResponse.json()
      
      if (!stopsResponse.ok) {
        throw new Error(stopsData.error || 'Something went wrong')
      }
      
      setBusStops(stopsData.busStops || [])
      setTrainStation(stopsData.trainStation || null)
      
      // Optionally get the postcode for display purposes
    // Optionally get the postcode for display purposes
try {
  const postcodeResponse = await fetch(`https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}`)
  const postcodeData = await postcodeResponse.json()
  if (postcodeData.result && postcodeData.result.length > 0) {
    setPostcode(postcodeData.result[0].postcode)
  } else {
    setPostcode(`📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
  }
} catch {
  // If we can't get the postcode, just show coordinates
  setPostcode(`📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
}
      
    } catch (err) {
      if (err.code === 1) {
        setError('Location access denied. Please enable location services.')
      } else if (err.code === 2) {
        setError('Location unavailable. Please try again.')
      } else if (err.code === 3) {
        setError('Location request timed out. Please try again.')
      } else {
        setError(err.message || 'Failed to get your location. Please try entering a postcode manually.')
      }
    } finally {
      setLoading(false)
    }
  }

  const getTransportIcon = (type) => {
    return type === 'train_station' ? '🚆' : '🚌'
  }

  const getTransportType = (type) => {
    return type === 'train_station' ? 'Train Station' : 'Bus Stop'
  }

const renderTransportItem = (stop, idx) => {
  const coords = stop.geometry.coordinates
  const props = stop.properties
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords[1]},${coords[0]}`
  
  return (
    <div key={idx} className="transport-item">
      <div className="transport-header">
        <span className="transport-icon">{getTransportIcon(props.type)}</span>
        <div className="transport-info">
          <h3>{props.name}</h3>
          <p className="transport-type">{getTransportType(props.type)} • {props.distance}</p>
        </div>
      </div>
      
      <a 
        href={mapsUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="maps-link"
      >
        📍 View on Google Maps
      </a>
    </div>
  )
}

// Render spinner while loading
const Spinner = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="spinner"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="3"
      opacity="0.3"
    />
    <path
      d="M12 3a9 9 0 0 1 9 9"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
)
  return (
    <div className="container">
      <h1>🚌 UK Public Transport Finder</h1>
      <p className="subtitle">Enter your postcode or press x to get your location<br /> to find your nearest bus stops and train station.</p>
      
      <form onSubmit={handleSubmit} className="postcode-form">
        <div className="input-group">
          <input
            type="text"
            value={postcode}
            onChange={e => setPostcode(e.target.value)}
            placeholder="Enter UK postcode"
            required
          />
          <button 
  type="button" 
  onClick={handleGeolocation} 
  disabled={loading}
  className="icon-only-btn"
  title={loading ? "Getting your location..." : "Get my current location"}
  aria-label={loading ? "Getting your location..." : "Get my current location"}
>
  {loading ? <Spinner /> : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  )}
</button>
        </div>
        <button type="submit" disabled={loading}>Find my stop!</button>
      </form>
      
      {loading && <p className="loading">🔍 Searching for transport stops...</p>}
      {error && <p className="error">{error}</p>}
      
      {(busStops.length > 0 || trainStation) && (
        <div className="transport-list">
          {/* Bus Stops Section */}
          {busStops.length > 0 && (
            <div className="transport-section">
              <h2>🚌 Nearest Bus Stops</h2>
              <div className="transport-items">
                {busStops.map((stop, idx) => renderTransportItem(stop, idx, 'bus'))}
              </div>
            </div>
          )}
          
          {/* Train Station Section */}
          {trainStation && (
            <div className="transport-section">
              <h2>🚆 Nearest Railway Station</h2>
              <div className="transport-items">
                {renderTransportItem(trainStation, 'train', 'train')}
              </div>
            </div>
          )}
        </div>
      )}
      
      {(busStops.length > 0 || trainStation) && (
        <div className="results-info">
          <p>
            Found {busStops.length} bus stop{busStops.length !== 1 ? 's' : ''} 
            {trainStation && busStops.length > 0 ? ' and ' : ''}
            {trainStation ? '1 railway station' : ''} near {postcode}
          </p>
        </div>
      )}
    </div>
  )
}



export default App
