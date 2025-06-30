export default (req, res) => {
  try {
    res.status(200).json({ message: 'Test API is working!', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
} 