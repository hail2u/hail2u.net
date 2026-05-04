const getDateDetails = (timestamp) => {
  const tz = Temporal.Now.timeZoneId();
  const dt = Temporal.Instant.fromEpochMilliseconds(timestamp)
    .toZonedDateTimeISO(tz)
    .toPlainDateTime();
  const { day, hour, minute, month, second, year } = dt;
  const dow = dt.dayOfWeek - 1;
  return {
    day,
    dow,
    hour,
    minute,
    month,
    second,
    strDOW: new Intl.DateTimeFormat("en-us", {
      weekday: "short",
    }).format(dt),
    strDay: String(day).padStart(2, "0"),
    strHour: String(hour).padStart(2, "0"),
    strMinute: String(minute).padStart(2, "0"),
    strMonth: String(month).padStart(2, "0"),
    strMonthName: new Intl.DateTimeFormat("en-us", {
      month: "short",
    }).format(dt),
    strSecond: String(second).padStart(2, "0"),
    strYear: String(year).padStart(2, "0"),
    year,
  };
};

export { getDateDetails };
