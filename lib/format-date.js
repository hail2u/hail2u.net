const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
  "Sep", "Oct", "Nov", "Dec"];

function pad(number) {
  if (number >= 10) {
    return number;
  }

  return `0${number}`;
}

exports.html5 = function (day, date, month, year, hour, minute, second) {
  return `${year}-${pad(month)}-${pad(date)}T${pad(hour)}:${pad(minute)}:${pad(second)}+09:00`;
};

exports.pad = pad;

exports.rfc822 = function (day, date, month, year, hour, minute, second) {
  return `${dow[day]}, ${date} ${monthNames[month - 1]} ${year} ${pad(hour)}:${pad(minute)}:${pad(second)} +0900`;
};
