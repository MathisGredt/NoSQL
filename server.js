// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// App
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://root:Penholder9-Commodore4-Nutshell0-Empower9-Removed7-Sternum6@82.65.159.85:27017/', {
  // plus besoin de ces options
});
mongoose.connect('mongodb://root:Penholder9-Commodore4-Nutshell0-Empower9-Removed7-Sternum6@82.65.159.85:27017/', {
  dbName: 'test' // <-- précise le nom de la base ici
})
.then(() => console.log("✅ Connecté à MongoDB"))
.catch((err) => console.error("❌ Erreur MongoDB :", err));


// Schema
const MessageSchema = new mongoose.Schema({
  text: String,
  date: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
});

app.get('/api/messages', async (req, res) => {
  const messages = await Message.find().sort({ date: -1 }).limit(5);
  res.json(messages);
});

app.post('/api/messages', async (req, res) => {
  const newMessage = new Message({ text: req.body.text });
  await newMessage.save();
  res.status(201).json(newMessage);
});

// Start server
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Serveur en ligne sur http://localhost:${PORT}`);
});
