const path = require('path');

module.exports = {
  PORT: 3000,
  TOTAL_INTERN_HOURS: 450,
  INTERN_FILE: path.join(__dirname, '../db/interns.json'),
  GUEST_FILE: path.join(__dirname, '../db/guest.json'),
};