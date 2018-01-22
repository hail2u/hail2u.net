/*!
 * reldate.js
 * LICENSE: http://hail2u.mit-license.org/2016
 */
const millisecondsInSecond = 1000;
const radix = 10;
const unitNow = "たった今";
const secondsInMinute = 60;
const unitSecond = "秒";
const suffix = "前";
const minutesInHour = 60;
const unitMinute = "分";
const hoursInDay = 24;
const unitHour = "時間";
const daysInMonth = 30;
const unitDay = "日";
const monthsInYear = 12;
const unitMonth = "ヶ月";
const unitYear = "年";

const toRelativeDate = (from, to) => {
  if (!Number.isInteger(to)) {
    return;
  }

  let diff = parseInt((from - to) / millisecondsInSecond, radix);

  if (!Number.isInteger(diff) || diff < 0) {
    return;
  }

  if (diff < secondsInMinute / 2) {
    return unitNow;
  }

  if (diff < secondsInMinute) {
    return `${diff}${unitSecond}${suffix}`;
  }

  diff = parseInt(diff / secondsInMinute, radix);

  if (diff < minutesInHour) {
    return `${diff}${unitMinute}${suffix}`;
  }

  diff = parseInt(diff / minutesInHour, radix);

  if (diff < hoursInDay) {
    return `${diff}${unitHour}${suffix}`;
  }

  diff = parseInt(diff / hoursInDay, radix);

  if (diff < daysInMonth) {
    return `${diff}${unitDay}${suffix}`;
  }

  diff = parseInt(diff / daysInMonth, radix);

  if (diff < monthsInYear) {
    return `${diff}${unitMonth}${suffix}`;
  }

  return `${parseInt(diff / monthsInYear, radix)}${unitYear}${suffix}`;
};
const now = performance.timing.navigationStart + performance.now();

for (const time of document.querySelectorAll("time.js-reldate[datetime]")) {
  const absolute = time.getAttribute("datetime");
  const relative = toRelativeDate(now, Date.parse(absolute));

  if (relative) {
    time.setAttribute("title", absolute);
    time.textContent = relative;
  }
}
