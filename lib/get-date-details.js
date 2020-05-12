const dowNames = [
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat"
];
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

export default (dt) => {
	const date = dt.getDate();
	const day = dt.getDay();
	const hour = dt.getHours();
	const minute = dt.getMinutes();
	const month = dt.getMonth() + 1;
	const second = dt.getSeconds();
	const year = dt.getFullYear();
	return {
		"date": date,
		"day": day,
		"hour": hour,
		"minute": minute,
		"month": month,
		"second": second,
		"strDate": String(date).padStart(2, "0"),
		"strDowName": dowNames[day],
		"strHour": String(hour).padStart(2, "0"),
		"strMinute": String(minute).padStart(2, "0"),
		"strMonth": String(month).padStart(2, "0"),
		"strMonthName": monthNames[month - 1],
		"strSecond": String(second).padStart(2, "0"),
		"strYear": String(year).padStart(2, "0"),
		"year": year
	};
};
