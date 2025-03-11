const dowNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
  "Dec",
];

const getDateDetails = (timestamp) => {
  const dt = new Date(timestamp);
  const date = dt.getDate();
  const day = dt.getDay();
  const hour = dt.getHours();
  const minute = dt.getMinutes();
  const month = dt.getMonth() + 1;
  const second = dt.getSeconds();
  const year = dt.getFullYear();
  return {
    date,
    day,
    hour,
    minute,
    month,
    second,
    strDate: String(date).padStart(2, "0"),
    strDowName: dowNames.at(day),
    strHour: String(hour).padStart(2, "0"),
    strMinute: String(minute).padStart(2, "0"),
    strMonth: String(month).padStart(2, "0"),
    strMonthName: monthNames.at(month - 1),
    strSecond: String(second).padStart(2, "0"),
    strYear: String(year).padStart(2, "0"),
    year,
  };
};

export { getDateDetails };
