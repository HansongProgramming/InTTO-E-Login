const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/api/internList', (req, res) => {
  const filePath = path.join(__dirname, '../db/interns.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).json({
        error: "Failed to read the file",
      });
    }
    
    try {
      const internList = JSON.parse(data);
      res.json(internList);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      res.status(500).send('Internal Server Error');
    }

  });
});


app.post('/api/internList', (req, res) => {
  const filePath = path.join(__dirname, '../db/interns.json');
  const newIntern = req.body;

  fs.readFile(filePath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).json({ error: 'Failed to read file' });
    }

    let internList = {};

    try {
      internList = JSON.parse(fileData);
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
    }

    const fullName = newIntern['full name'];
    if (!fullName) {
      return res.status(400).json({ error: 'Missing full name in data' });
    }

    const existingData = internList[fullName] || {};

    internList[fullName] = {
      ...existingData,
      ...newIntern
    };

    fs.writeFile(filePath, JSON.stringify(internList, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return res.status(500).json({ error: 'Failed to write file' });
      }

      res.status(200).json({ message: 'Intern list updated successfully' });
    });
  });
});


module.exports = function startServer() {
  app.listen(PORT, "0.0.0.0",() => {
    console.log(`Listening to requests on http://${"192.168.0.87" || "localhost"}:${PORT}`);
  });
};

