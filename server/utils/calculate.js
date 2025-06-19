const moment = require('moment');

module.exports = function calculateCappedTotalHours(logs) {
  return logs.reduce((total, log) => {
    if (!log.timeIn || !log.timeOut || !log.date) return total;

    const inTime = moment(`${log.date} ${log.timeIn}`, "YYYY-MM-DD hh:mm a");
    let outTime = moment(`${log.date} ${log.timeOut}`, "YYYY-MM-DD hh:mm a");

    if (outTime.isBefore(inTime)) {
      outTime.add(1, 'day');
    }

    const hours = Math.min(moment.duration(outTime.diff(inTime)).asHours(), 8);

    return total + hours;
  }, 0);
};
