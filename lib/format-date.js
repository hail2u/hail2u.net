const pad = number => {
  if (number >= 10) {
    return number;
  }

  return `0${number}`;
};
const toHTML5Date = (day, date, month, year, hour, minute, second) =>
  `${year}-${pad(month)}-${pad(date)}T${pad(hour)}:${pad(minute)}:${pad(
    second
  )}+09:00`;
const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
const toRFC822Date = (day, date, month, year, hour, minute, second) =>
  `${dow[day]}, ${date} ${monthNames[month - 1]} ${year} ${pad(hour)}:${pad(
    minute
  )}:${pad(second)} +0900`;

exports.html5 = toHTML5Date;
exports.pad = pad;
exports.rfc822 = toRFC822Date;
