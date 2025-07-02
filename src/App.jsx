import { useState } from 'react'
import './App.css'

function App() {
  const [postcode, setPostcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [transportStops, setTransportStops] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setTransportStops([])
    setLoading(true)
    
    try {
      // Call our serverless function
      const res = await fetch(`/api/stops?postcode=${encodeURIComponent(postcode)}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong')
      }
      
      setTransportStops(data.transportStops)
    } catch (err) {
      setError(err.message || 'Something went wrong')
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

  return (
    <div className="container">
      <h1>🚌 UK Public Transport Finder</h1>
      <p className="subtitle">Find nearestbus stops and train stations</p>
      
      <form onSubmit={handleSubmit} className="postcode-form">
        <input
          type="text"
          value={postcode}
          onChange={e => setPostcode(e.target.value)}
          placeholder="Enter UK postcode"
          required
        />
        <button type="submit" disabled={loading}>Find my stop!</button>
      </form>
      
      {loading && <p className="loading">🔍 Searching for transport stops...</p>}
      {error && <p className="error">{error}</p>}
      
      <div className="transport-list">
        {transportStops.map((stop, idx) => {
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
              
              <div className="transport-services">
                <strong>Services:</strong> {props.services.join(', ')}
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
        })}
      </div>
      
      {transportStops.length > 0 && (
        <div className="results-info">
          <p>Found {transportStops.length} transport stops near {postcode}</p>
        </div>
      )}
    </div>
  )
}

export default App
