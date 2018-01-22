/*!
 * reldate.js
 * LICENSE: http://hail2u.mit-license.org/2016
 */
const divisorDay = 24;
const divisorHour = 60;
const divisorMinute = 60;
const divisorMonth = 30;
const divisorSecond = 1000;
const divisorYear = 12;
const now = performance.timing.navigationStart + performance.now();
const suffix = "前";
const unitDay = "日";
const unitHour = "時間";
const unitMinute = "分";
const unitMonth = "ヶ月";
const unitNow = "たった今";
const unitSecond = "秒";
const unitYear = "年";

const toRelativeDate = (from, to) => {
  if (!Number.isInteger(to)) {
    return;
  }

  let diff = Math.round((from - to) / divisorSecond);

  if (!Number.isInteger(diff) || diff < 0) {
    return;
  }

  if (diff < divisorMinute / 2) {
    return unitNow;
  }

  if (diff < divisorMinute) {
    return `${diff}${unitSecond}${suffix}`;
  }

  diff = Math.round(diff / divisorMinute);

  if (diff < divisorHour) {
    return `${diff}${unitMinute}${suffix}`;
  }

  diff = Math.round(diff / divisorHour);

  if (diff < divisorDay) {
    return `${diff}${unitHour}${suffix}`;
  }

  diff = Math.round(diff / divisorDay);

  if (diff < divisorMonth) {
    return `${diff}${unitDay}${suffix}`;
  }

  diff = Math.round(diff / divisorMonth);

  if (diff < divisorYear) {
    return `${diff}${unitMonth}${suffix}`;
  }

  return `${Math.round(diff / divisorYear)}${unitYear}${suffix}`;
};

for (const time of document.querySelectorAll("time.js-reldate[datetime]")) {
  const absolute = time.getAttribute("datetime");
  const relative = toRelativeDate(now, Date.parse(absolute));

  if (relative) {
    time.setAttribute("title", absolute);
    time.textContent = relative;
  }
}
