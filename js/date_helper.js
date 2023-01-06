function getCalendarByDayjs(currentDate) {
  const currentYear = currentDate.get("year");
  const currentMonth = currentDate.get("month") + 1;

  // 該月第一天
  const firstDayOfMonth = currentDate.startOf("month");
  // 該月最後一天
  const lastDayOfMonth = currentDate.endOf("month");

  // 日曆上的第一天，可能會是上個月的
  const firstDayOfCalendar = firstDayOfMonth.subtract(firstDayOfMonth.get("day"), "day");

  // 橫跨週數，要加上該週上月的天數再除以 7
  const weeks = Math.ceil((currentDate.daysInMonth() + firstDayOfMonth.get("day")) / 7);
  const calenderTotalDays = weeks * 7;

  // 日曆上的最後一天，可能會是下個月的
  const lastDayOfCalendar = firstDayOfCalendar.add(weeks * 7 - 1, "day");

  // 產生日曆上的日期，以 7 * weeks 的陣列表示
  const calendarWeeks = Array.from({ length: weeks }, (_, w) => {
    const firstDayOfWeek = firstDayOfCalendar.add(w, "week");
    return Array.from({ length: 7 }, (_, d) => {
      const day = firstDayOfWeek.add(d, "day");

      return {
        // 該日以 dayjs 表示
        dayInDayjs: day,

        // 該日的年、月、日
        year: day.get("year"),
        month: day.get("month") + 1,
        day: day.get("date"),

        // 該日是星期幾
        week: day.get("day"),

        // 該日是否為顯示的月份
        isViewMonth: currentDate.get("month") === day.get("month"),
      };
    });
  });

  // 把 7 * weeks 的陣列展開(攤平)成一個陣列
  const calendarDays = calendarWeeks.reduce((prev, current) => {
    prev.push(...current);
    return prev;
  }, []);

  return {
    currentDate,
    currentYear,
    currentMonth,
    firstDayOfMonth,
    lastDayOfMonth,
    weeks,
    calenderTotalDays,
    firstDayOfCalendar,
    lastDayOfCalendar,
    calendarWeeks,
    calendarDays,
  };
}

// 如果 v 是有效的，則回傳 dayjs，否則回傳 null
function toDayjs(v) {
  return dayjs(v).isValid() ? dayjs(v) : null;
}