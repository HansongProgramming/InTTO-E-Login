const moment = require('moment');

module.exports = function calculateCappedTotalHours(logs){
  return logs.reduce((total, log) => {
      if (!log.timeIn || !log.timeOut) return total;
  
      const inTime = moment(log.timeIn, "hh:mm a");
      let outTime = moment(log.timeOut, "hh:mm a");
  
      if (outTime.isBefore(inTime)) {
        outTime.add(1, 'day');
      }
  
      const hours = Math.min(
        moment.duration(
          outTime.diff(inTime)
        ).asHours(), 8
      )
  
      return total + hours;
    }, 0);
}