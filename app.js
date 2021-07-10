const express = require('express');
const app = express();

app.use(express.static(__dirname + '/dapp'));

app.get("/", function(req, res) {
    res.sendFile(__dirname + '/dapp/index.html');
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});