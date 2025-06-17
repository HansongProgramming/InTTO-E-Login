const express = require('express');
const moment = require('moment');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const internFilePath = path.join(__dirname, '../db/interns.json');

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!');
});


// GET ALL INTERNS
app.get('/api/internList', (req, res) => {
  fs.readFile(internFilePath, 'utf8', (err, data) => {
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


// ADD NEW INTERN && TIME-IN/OUT USERS
app.post('/api/internList', (req, res) => {
  const newIntern = req.body;

  fs.readFile(internFilePath, 'utf8', (err, fileData) => {
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

    if (internList[fullName]) {
      return res.status(409).json({ error: `Intern '${fullName}' already exists. Use PATCH to edit.` });
    }

    internList[fullName] = newIntern;

    fs.writeFile(internFilePath, JSON.stringify(internList, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return res.status(500).json({ error: 'Failed to write file' });
      }

      res.status(201).json({ 
        message: `Intern '${fullName}' added`, 
        data: internList[fullName]
      });
      
    });
  });
});

// DELETE INTERN
app.delete('/deleteIntern/:name', (req, res) => {
  const internName = req.params.name;

  fs.readFile(internFilePath, 'utf8', (err, fileData) => {
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

    if (!internList[internName]) {
      return res.status(404).json({ error: `Intern '${internName}' not found` });
    }

    delete internList[internName];

    fs.writeFile(internFilePath, JSON.stringify(internList, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return res.status(500).json({ error: 'Failed to write file' });
      }

      res.status(200).json({ message: `Intern ${internName} deleted successfully` });
    })
  });

});

// UPDATE INTERN INFORMATION
app.patch('/editIntern/:name', (req, res) => {
  const internName = decodeURIComponent(req.params.name).trim();
  const updates = req.body;

  fs.readFile(internFilePath, 'utf8', (err, fileData) => {
    if (err) return res.status(500).json({ error: 'Failed to read file' });

    let internList = {};
    try {
      internList = JSON.parse(fileData);
    } catch {
      return res.status(500).json({ error: 'Invalid JSON format' });
    }

    const intern = internList[internName];
    if (!intern) return res.status(404).json({ error: `Intern '${internName}' not found` });

    internList[internName] = { ...intern, ...updates };

    fs.writeFile(internFilePath, JSON.stringify(internList, null, 2), 'utf8', (err) => {
      if (err) return res.status(500).json({ error: 'Failed to write file' });
      res.status(200).json({
        message: `Intern '${internName}' updated`,
        data: internList[internName]
      });
    });
  });
});

// EXPORT startServer FUNCTION
module.exports = function startServer() {
  app.listen(PORT, "0.0.0.0",() => {
    console.log(`Listening to requests on http://${"192.168.0.87" || "localhost"}:${PORT}`);
  });
};

