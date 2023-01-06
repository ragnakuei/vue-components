const vue_date_picker = {
  template: `
<div class="vue-date-picker-calendar"
    v-bind:class="divClass">
    <input v-bind:id="id"
           v-model="domValue"
           v-on:focus="focusInput"
           v-on:blur="blurInput"
           v-on:keydown="keydownNav"
           v-bind:readonly="!showCalendar"
           v-bind:style="{ position: 'relative' , zIndex: showCalendar ? '100' : '0' }"
           placeholder="x"
          />
    
    <div class="calendar-wrapper" v-if="showCalendar">
        <div class="calendar">
            <div class="calendar-header" 
                 v-on:keydown="keydownNav">
                <div class="year">
                    <div class="calendar-nav-wrapper">
                        <button type="button"
                                ref="prevYear"
                                class="calendar-nav"
                                v-on:click="toViewOffsetYear(-1)">
                                &lt;
                        </button>
                    </div>
                        {{ calendarObj.currentYear }}
                    <div class="calendar-nav-wrapper">
                        <button type="button"
                                ref="nextYear"
                                class="calendar-nav"
                                v-on:click="toViewOffsetYear(1)">
                                &gt;
                        </button>
                    </div>
                </div>
                <div class="month">
                    <div class="calendar-nav-wrapper">
                        <button type="button" 
                                ref="prevMonth"    
                                class="calendar-nav"
                                v-on:click="toViewOffsetMonth(-1)">
                                &lt;
                        </button>
                    </div>
                        {{ ('0' + calendarObj.currentMonth).slice(-2) }}
                    <div class="calendar-nav-wrapper">
                        <button type="button"
                                ref="nextMonth"
                                class="calendar-nav"
                                v-on:click="toViewOffsetMonth(1)">
                                &gt;
                        </button>
                    </div>
                </div>
            </div>
            <div class="week">
                <div v-for="weekLabel in weekLabels">
                    {{ weekLabel }}
                </div>
            </div>
            <div class="days">
                <template v-for="dayObj in calendarObj.calendarDays">
                    <div class="day allow"
                        v-if="allowSelectDay(dayObj)"
                        v-bind:class="dayClass(dayObj)"
                        v-on:click="clickCalendarDay(dayObj)"
                        >
                        {{ dayObj.day }}
                    </div>
                    <div v-else
                        class="day disallow"
                        v-bind:class="dayClass(dayObj)"
                        >
                        <span>{{ dayObj.day }}</span>
                        <span></span>
                    </div>
                </template>
            </div>
        </div>
        <div class="tool-bar" v-if="showCalendar">
            <button type="button" v-on:click="selectToday()"> Today </button>
        </div>
    </div>
    <div v-if="showCalendar"
        class="wrapper-overlay"
        v-on:click="closeCalendar()">
        <!-- 全畫面蓋版 -->
    </div>
    <span class="invalid-feedback">
        
    </span>
</div>
        `,
  props: {
    divClass: String,
    label: String,
    format: String,
    id: String,
    modelValue: String,
    minDate: String,
    maxDate: String,
  },
  setup(props, { emit }) {
    const domField = ref({});
    domField.value = (toDayjs(props.modelValue) || dayjs()).format(props.format);

    // 類型：字串，要經過 dayjs 的轉換
    const domValue = computed({
      get: () => {
        return domField.value;
      },
      set: (v) => {
        domField.value = v;
        emit("update:modelValue", v);
      },
    });

    const minDateInDayjs = ref(null);
    if (props.minDate) {
      minDateInDayjs.value = toDayjs(props.minDate);
    }

    const maxDateInDayjs = ref(null);
    if (props.maxDate) {
      maxDateInDayjs.value = toDayjs(props.maxDate);
    }

    // 整個日曆物件，以 dayjs 為基礎
    const calendarObj = ref();

    // 目前顯示日
    const viewDateInDayjs = computed({
      get: () => {
        return calendarObj.value.currentDate;
      },
      set: (v) => {
        calendarObj.value = getCalendarByDayjs(v, props.format, dayjs(domValue.value));
      },
    });

    const initialCalendar = function () {
      viewDateInDayjs.value = toDayjs(domValue.value) || dayjs();
    };
    initialCalendar();

    const focusInput = function () {
      initialCalendar();
      openCalendar();
    };

    const blurInput = function () {
    //   console.log("blurInput");
      initialCalendar();
      syncDomValueWithDayjs();
    };

    const keydownNav = function (e) {
    //   console.log('keydownNav');
      if (e.keyCode === 38) {
        // up
        prevMonth.value?.focus();
        prevMonth.value?.click();
      } else if (e.keyCode === 40) {
        // down
        nextMonth.value?.focus();
        nextMonth.value?.click();
      } else if (e.keyCode === 33) {
        // pageUp
        prevYear.value?.focus();
        prevYear.value?.click();
      } else if (e.keyCode === 34) {
        // pageDown
        nextYear.value?.focus();
        nextYear.value?.click();
      }
    };

    const showCalendar = ref(false);
    const openCalendar = function () {
      showCalendar.value = true;
    };
    const closeCalendar = function () {
      showCalendar.value = false;
      validateInput();
    };

    const dayClass = function (dayObj) {
      return {
        "in-month": dayObj.isViewMonth,
        "not-in-month": !dayObj.isViewMonth,
        "is-today": allowSelectDay(dayObj) && dayObj.dayInDayjs.isSame(dayjs(), "day"),
        "is-selected-day": dayObj.dayInDayjs.isSame(dayjs(domValue.value)),
      };
    };

    const allowSelectDay = function (dayObj) {
      if (minDateInDayjs.value.isValid() && dayObj.dayInDayjs.isBefore(minDateInDayjs.value)) {
        return false;
      }

      if (maxDateInDayjs.value.isValid() && dayObj.dayInDayjs.isAfter(maxDateInDayjs.value)) {
        return false;
      }

      return true;
    };

    const clickCalendarDay = function (dayObj) {
      //   console.log("clickCalendarDay", dayObj);
      domValue.value = dayObj.dayInDayjs.format(props.format);
      closeCalendar();
    };

    const prevYear = ref(null);
    const nextYear = ref(null);
    const prevMonth = ref(null);
    const nextMonth = ref(null);

    // 是否顯示上一年
    const showPrevYear = computed(() => {
      if (minDateInDayjs.value.isValid()) {
        return viewDateInDayjs.value.year() > minDateInDayjs.value.year();
      }

      return true;
    });
    // 是否顯示下一年
    const showNextYear = computed(() => {
      if (maxDateInDayjs.value.isValid()) {
        return viewDateInDayjs.value.year() < maxDateInDayjs.value.year();
      }

      return true;
    });

    // 上/下一年 - 暫時不用，影響鍵盤做 keydownNav
    const toViewOffsetYear = function (v) {
      viewDateInDayjs.value = viewDateInDayjs.value.add(v, "Year");
    };

    // 是否顯示上一月 - 暫時不用，影響鍵盤做 keydownNav
    const showPrevMonth = computed(() => {
      if (minDateInDayjs.value.isValid()) {
        if (viewDateInDayjs.value.year() > minDateInDayjs.value.year()) {
          return true;
        }

        return (
          viewDateInDayjs.value.year() >= minDateInDayjs.value.year() &&
          viewDateInDayjs.value.month() > minDateInDayjs.value.month()
        );
      }

      return true;
    });
    // 是否顯示下一月
    const showNextMonth = computed(() => {
      if (maxDateInDayjs.value.isValid()) {
        if (viewDateInDayjs.value.year() < maxDateInDayjs.value.year()) {
          return true;
        }

        return (
          viewDateInDayjs.value.year() <= maxDateInDayjs.value.year() &&
          viewDateInDayjs.value.month() < maxDateInDayjs.value.month()
        );
      }

      return true;
    });

    // 上/下一月
    const toViewOffsetMonth = function (v) {
      viewDateInDayjs.value = viewDateInDayjs.value.add(v, "Month");
    };
    // 移至 Offset 天
    const toViewOffsetDay = function (v) {
      viewDateInDayjs.value = viewDateInDayjs.value.add(v, "Day");
    };

    // 選擇今天
    const selectToday = function () {
      domValue.value = dayjs().format(props.format);
      initialCalendar();
    };

    // 驗證輸入
    const validateInput = function () {
      const domValueInDayjs = toDayjs(domValue.value);
      if (!domValueInDayjs.isValid() || minDateInDayjs.value > domValueInDayjs || maxDateInDayjs.value < domValueInDayjs) {
        emit("validate-fail", domValue.value);
        console.log("validate-fail");
        return;
      }

      syncDomValueWithDayjs();

      console.log("validate success");
    };

    // 將 domValue 與 dayjs 同步 - 因為 dayjs 會自動補齊日期，例如 2021-02-31 會變成 2021-03-03
    function syncDomValueWithDayjs() {
      domValue.value = dayjs(domValue.value).format(props.format);
    }

    onMounted(() => {});

    return {
      domValue,
      calendarObj,
      weekLabels: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
      focusInput,
      blurInput,
      keydownNav,
      showCalendar,
      openCalendar,
      closeCalendar,
      dayClass,
      allowSelectDay,
      clickCalendarDay,
      prevYear,
      nextYear,
      prevMonth,
      nextMonth,
      showPrevYear,
      showNextYear,
      toViewOffsetYear,
      showPrevMonth,
      showNextMonth,
      toViewOffsetMonth,
      selectToday,
    };
  },
};
