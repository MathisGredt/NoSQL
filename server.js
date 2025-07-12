// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const redis = require('redis');

// App
const app = express();
app.use(cors());
app.use(express.json());

// Configuration Redis
const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379,
  password: 'vivelenosql'
});

redisClient.on('connect', () => {
  console.log('✅ Connecté à Redis');
});

redisClient.on('error', (err) => {
  console.error('❌ Erreur Redis:', err);
});

// Connexion Redis
redisClient.connect();

// Statistiques cache
let cacheStats = { hits: 0, misses: 0 };

// MongoDB (garde ton code existant)
mongoose.connect('mongodb://root:Penholder9-Commodore4-Nutshell0-Empower9-Removed7-Sternum6@82.65.159.85:27017/', {
  dbName: 'test'
})
.then(() => console.log("✅ Connecté à MongoDB"))
.catch((err) => console.error("❌ Erreur MongoDB :", err));

const MessageSchema = new mongoose.Schema({
  text: String,
  date: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({});

const Message = mongoose.model('Message', MessageSchema);
const User = mongoose.model('User', UserSchema);

// Fonction Cache-Aside
async function getCachedData(key, fetchFunction, ttlSeconds = 60) {
  try {
    // 1. Chercher dans Redis
    const cached = await redisClient.get(key);
    if (cached) {
      cacheStats.hits++;
      return { 
        data: JSON.parse(cached), 
        fromCache: true, 
        responseTime: '< 10ms',
        timestamp: new Date().toISOString()
      };
    }

    // 2. Cache miss - simuler latence
    cacheStats.misses++;
    const startTime = Date.now();
    
    // Simuler 2 secondes de latence pour base de données lente
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const data = await fetchFunction();
    const responseTime = Date.now() - startTime;

    // 3. Mettre en cache
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));

    return { 
      data, 
      fromCache: false, 
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Cache error:', error);
    return await fetchFunction();
  }
}

// Routes existantes (gardées)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
});

app.get('/api/messages', async (req, res) => {
  const messages = await Message.find().sort({ date: -1 }).limit(5);
  res.json(messages);
});

app.get('/api/users', async (req, res) => {
  const users = await User.find().limit(5);
  res.json(users);
});

// NOUVELLES ROUTES REDIS

// Test de performance cache
app.get('/api/slow-data/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `slow-data:${id}`;
  
  const result = await getCachedData(cacheKey, async () => {
    // Simuler des données lentes à récupérer
    return {
      id: id,
      data: `Données complexes pour l'ID ${id}`,
      timestamp: new Date().toISOString(),
      message: "Données récupérées depuis la base de données lente",
      processingTime: "2000ms"
    };
  });

  res.json(result);
});

// Statistiques du cache
app.get('/api/cache-stats', (req, res) => {
  const total = cacheStats.hits + cacheStats.misses;
  res.json({
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    total: total,
    hitRate: total > 0 ? (cacheStats.hits / total * 100).toFixed(2) : 0
  });
});

// Vider une clé du cache
app.delete('/api/cache/:key', async (req, res) => {
  const { key } = req.params;
  try {
    await redisClient.del(key);
    res.json({ message: `Cache key '${key}' supprimée` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vider tout le cache
app.delete('/api/cache', async (req, res) => {
  try {
    await redisClient.flushAll();
    cacheStats = { hits: 0, misses: 0 };
    res.json({ message: "Cache entièrement vidé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test de messages avec cache
app.get('/api/messages-cached', async (req, res) => {
  const result = await getCachedData('messages:latest', async () => {
    const messages = await Message.find().sort({ date: -1 }).limit(5);
    return messages;
  }, 30); // Cache 30 secondes
  
  res.json(result);
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Serveur en ligne sur http://localhost:${PORT}`);
});
