const getDateDetails = (timestamp) => {
  const tz = Temporal.Now.timeZoneId();
  const dt = Temporal.Instant.fromEpochMilliseconds(timestamp)
    .toZonedDateTimeISO(tz)
    .toPlainDateTime();
  const { day, dayOfWeek, hour, minute, month, second, year } = dt;
  return {
    day,
    dayOfWeek,
    hour,
    minute,
    month,
    second,
    strDay: String(day).padStart(2, "0"),
    strDayOfWeek: new Intl.DateTimeFormat("en-us", {
      weekday: "short",
    }).format(dt),
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
