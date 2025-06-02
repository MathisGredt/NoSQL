// index.js
const express = require('express');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    // res.send('val bouge toi le q');
    res.sendFile(__dirname + '/pages/index.html');
});

app.listen(PORT, () => {
    console.log(`Serveur en ligne sur http://localhost:${PORT}`);
});
