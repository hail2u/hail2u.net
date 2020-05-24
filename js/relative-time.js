const toRelativeTime = (dt) => {
	const divisor = {
		"day": 24,
		"hour": 60,
		"minute": 60,
		"month": 30,
		"second": 1000,
		"year": 12
	};
	const now = performance.timing.navigationStart + performance.now();
	const suffix = "前";
	const unit = {
		"day": "日",
		"hour": "時間",
		"minute": "分",
		"month": "か月",
		"now": "たった今",
		"second": " 秒",
		"year": "年"
	};

	if (!Number.isInteger(dt)) {
		return false;
	}

	let diff = Math.round((now - dt) / divisor.second);

	if (!Number.isInteger(diff) || diff < 0) {
		return false;
	}

	if (diff < divisor.minute / 2) {
		return unit.now;
	}

	if (diff < divisor.minute) {
		return `${diff} ${unit.second}${suffix}`;
	}

	diff = Math.round(diff / divisor.minute);

	if (diff < divisor.hour) {
		return `${diff} ${unit.minute}${suffix}`;
	}

	diff = Math.round(diff / divisor.hour);

	if (diff < divisor.day) {
		return `${diff} ${unit.hour}${suffix}`;
	}

	diff = Math.round(diff / divisor.day);

	if (diff < divisor.month) {
		return `${diff} ${unit.day}${suffix}`;
	}

	diff = Math.round(diff / divisor.month);

	if (diff < divisor.year) {
		return `${diff} ${unit.month}${suffix}`;
	}

	diff = Math.round(diff / divisor.year);

	return `${diff} ${unit.year}${suffix}`;
};

for (const time of document.querySelectorAll("time.js-relative-time[datetime]")) {
	const absolute = time.getAttribute("datetime");
	const relative = toRelativeTime(Date.parse(absolute));

	if (relative) {
		time.setAttribute("title", absolute);
		time.textContent = relative;
	}
}
