const express = require('express');
const moment = require('moment');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const calculateCappedTotalHours = require('./utils/calculate');
const { PORT, TOTAL_INTERN_HOURS, INTERN_FILE, GUEST_FILE } = require('./config');

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));


//ROUTES
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// BARCODE SCANNER
app.get('/confirm', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/internlogin/scanner.html'));
});

// GET ALL INTERNS
app.get('/api/internList', (req, res) => {
  fs.readFile(INTERN_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).json({
        error: "Failed to read the file",
      });
    }
    
    try {
      const internList = JSON.parse(data);

      const enrichedInterns = Object.entries(internList).reduce((acc, [name, intern]) => {
        const logs = Array.isArray(intern.logs) ? intern.logs : [];
        const totalHours = calculateCappedTotalHours(logs);
        acc[name] = { ...intern, totalHours: parseFloat(totalHours.toFixed(2)) };
        return acc;
      }, {});

      res.json(enrichedInterns);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      res.status(500).send('Internal Server Error');
    }

  });
});


// ADD NEW INTERN && TIME-IN/OUT USERS
app.post('/api/internList', (req, res) => {
  const newIntern = req.body;
  const fullName = newIntern['full name'];
  const barcode = newIntern['barcode'];

  if (!fullName || !barcode) {
    return res.status(400).json({ error: 'Missing full name or barcode in data' });
  }

  fs.readFile(INTERN_FILE, 'utf8', (err, fileData) => {
    if (err) return res.status(500).json({ error: 'Failed to read file' });

    let internList = {};
    try {
      internList = JSON.parse(fileData);
    } catch {
      return res.status(500).json({ error: 'Invalid JSON format' });
    }

    if (internList[barcode]) {
      return res.status(409).json({ error: `Intern '${barcode}' already exists. Use PATCH to edit.` });
    }

    const today = moment().format("YYYY-MM-DD");
    const timeNow = moment().format('hh:mm a');

    const logs = [{
      date: today,
      timeIn: timeNow,
      timeOut: ""
    }];

    const { barcode: _, ...internDataWithoutBarcode } = newIntern;

    internList[barcode] = {
      ...internDataWithoutBarcode,
      logs,
      status: "Time-In",
      totalHours: calculateCappedTotalHours(logs)
    };

    fs.writeFile(INTERN_FILE, JSON.stringify(internList, null, 2), 'utf8', err => {
      if (err) return res.status(500).json({ error: 'Failed to write file' });

      res.status(201).json({
        message: `Intern '${fullName}' added`,
        data: internList[barcode]
      });
    });
  });
});



// DELETE INTERN
app.delete('/deleteIntern/:name', (req, res) => {
  const internName = req.params.name;

  fs.readFile(INTERN_FILE, 'utf8', (err, fileData) => {
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

    fs.writeFile(INTERN_FILE, JSON.stringify(internList, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return res.status(500).json({ error: 'Failed to write file' });
      }

      res.status(200).json({ message: `Intern ${internName} deleted successfully` });
    })
  });

});


// UPDATE INTERN INFORMATION
app.patch('/editIntern/:id', (req, res) => {
  const internId = decodeURIComponent(req.params.id).trim(); // it's an ID now
  const updates = req.body;

  fs.readFile(INTERN_FILE, 'utf8', (err, fileData) => {
    if (err) return res.status(500).json({ error: 'Failed to read file' });

    let internList = {};
    try {
      internList = JSON.parse(fileData);
    } catch {
      return res.status(500).json({ error: 'Invalid JSON format' });
    }

    const existing = internList[internId];
    if (!existing) return res.status(404).json({ error: `Intern ID '${internId}' not found` });

    if (!Array.isArray(existing.logs)) existing.logs = [];

    const today = moment().format("YYYY-MM-DD");
    let currentLog = existing.logs.find(log => log.date === today);

    if (!currentLog) {
      currentLog = { date: today };
      existing.logs.push(currentLog);
    }

    if (updates.status === "Time-In" && updates.timeIn) {
      currentLog.timeIn = updates.timeIn;
    }

    if (updates.status === "Time-Out" && updates.timeOut) {
      currentLog.timeOut = updates.timeOut;
    }

    const { logs, timeIn, timeOut, ...rest } = updates;

    const merged = {
      ...existing,
      ...rest,
      logs: existing.logs,
    };

    merged.totalHours = calculateCappedTotalHours(merged.logs);

    internList[internId] = merged;

    fs.writeFile(INTERN_FILE, JSON.stringify(internList, null, 2), 'utf8', err => {
      if (err) return res.status(500).json({ error: 'Failed to write file' });
      res.json({ message: `Updated intern ID '${internId}'`, data: internList[internId] });
    });
  });
});


// GET INTERN HOURS
app.get('/api/hours/:name', (req, res) => {
  const name = decodeURIComponent(req.params.name).trim();

  fs.readFile(INTERN_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read file' });

    let interns = JSON.parse(data || '{}');
    const intern = interns[name];

    if (!intern) return res.status(404).json({ error: `Intern '${name}' not found` });

    const logs = intern.logs || [];
    const totalHours = calculateCappedTotalHours(logs);

    res.status(200).json({
      name,
      totalHours: parseFloat(totalHours.toFixed(2)),
      logs,
      remainingHours: Math.max(0, TOTAL_INTERN_HOURS - totalHours)
    });
  });
});


app.get('/api/guestList', (req, res) => {
  fs.readFile(GUEST_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).json({
        error: "Failed to read the file",
      });
    }
    
    try {
      const guestList = JSON.parse(data);
      res.json(guestList)
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      res.status(500).send('Internal Server Error');
    }

  });
});

app.post('/api/guestList', (req, res) => {
  const newGuest = req.body;
  const fullName = newGuest['full name'];

  if (!fullName) {
    return res.status(400).json({ error: "Missing full name in data." });
  }

  fs.readFile(GUEST_FILE, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Failed to read file." });
    }

    let guestList = {};
    try {
      guestList = JSON.parse(data);
    } catch (err) {
      return res.status(500).json({ error: 'Invalid JSON format' });
    }

    const today = moment().format("YYYY-MM-DD");
    const timeNow = moment().format('hh:mm a');

    const logs = [{
      date: today,
      timeIn: timeNow,
      timeOut: ""
    }];

    guestList[fullName] = {
      ...newGuest,
      logs
    };

    fs.writeFile(GUEST_FILE, JSON.stringify(guestList, null, 2), 'utf8', err => {
      if (err) return res.status(500).json({ error: 'Failed to write file' });

      res.status(200).json({
        message: `Guest ${fullName} added.`,
        data: guestList[fullName]
      });
    });

  });
});


// EXPORT startServer FUNCTION
module.exports = function startServer(callback) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Listening on http://localhost:${PORT}`);
    callback?.();
  });
};