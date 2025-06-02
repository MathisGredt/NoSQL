// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { text } = require('body-parser');

// App
const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect('mongodb://root:Penholder9-Commodore4-Nutshell0-Empower9-Removed7-Sternum6@82.65.159.85:27017/', {

});
mongoose.connect('mongodb://root:Penholder9-Commodore4-Nutshell0-Empower9-Removed7-Sternum6@82.65.159.85:27017/', {
  dbName: 'test'
})
.then(() => console.log("✅ Connecté à MongoDB"))
.catch((err) => console.error("❌ Erreur MongoDB :", err));


const MessageSchema = new mongoose.Schema({
  text: String,
  date: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({

});




const Message = mongoose.model('Message', MessageSchema);
const User = mongoose.model('User',  UserSchema);
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

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Serveur en ligne sur http://localhost:${PORT}`);
});
