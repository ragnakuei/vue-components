const vue_range_date_picker = {
  template: `
<div
  class="vue-date-range-picker-calendar"
  v-bind:class="divClass"
>
  <input
    v-bind:id="id"
    v-bind:value="inputValue"
    v-on:focus="focusInput"
    v-on:blur="blurInput"
    v-on:keydown="keydownNav"
    readonly
  />

  <div
    class="calendar-wrapper"
    v-if="showCalendar"
  >
    <div>
      <div class="calendar">
        <div
          class="calendar-header"
          v-on:keydown="keydownNav"
        >
          <div class="calendar-nav-wrapper-left">
            <button
              type="button"
              ref="prevMonth"
              class="calendar-nav"
              v-on:click="toViewOffsetMonth(-1)"
            >
              &lt;
            </button>
          </div>
          <div class="year">{{ calendarObj.left.currentYear }}</div>
          <div class="month">{{ ('0' + calendarObj.left.currentMonth).slice(-2) }}</div>
        </div>
        <div class="week">
          <div v-for="weekLabel in weekLabels">{{ weekLabel }}</div>
        </div>
        <div class="days">
          <template v-for="dayObj in calendarObj.left.calendarDays">
            <div
              class="day allow"
              v-if="allowSelectDay(dayObj)"
              v-bind:class="dayClass(dayObj)"
              v-on:click="clickCalendarDay(dayObj.dayInDayjs)"
            >
              {{ dayObj.day }}
            </div>
            <div
              v-else
              class="day disallow"
              v-bind:class="dayClass(dayObj)"
            >
              <span>{{ dayObj.day }}</span>
              <span></span>
            </div>
          </template>
        </div>
      </div>
      <div class="calendar">
        <div
          class="calendar-header"
          v-on:keydown="keydownNav"
        >
          <div class="year">{{ calendarObj.right.currentYear }}</div>
          <div class="month">{{ ('0' + calendarObj.right.currentMonth).slice(-2) }}</div>
          <div class="calendar-nav-wrapper-right">
            <button
              type="button"
              ref="nextMonth"
              class="calendar-nav"
              v-on:click="toViewOffsetMonth(1)"
            >
              &gt;
            </button>
          </div>
        </div>
        <div class="week">
          <div v-for="weekLabel in weekLabels">{{ weekLabel }}</div>
        </div>
        <div class="days">
          <template v-for="dayObj in calendarObj.right.calendarDays">
            <div
              class="day allow"
              v-if="allowSelectDay(dayObj)"
              v-bind:class="dayClass(dayObj)"
              v-on:click="clickCalendarDay(dayObj.dayInDayjs)"
            >
              {{ dayObj.day }}
            </div>
            <div
              v-else
              class="day disallow"
              v-bind:class="dayClass(dayObj)"
            >
              <span>{{ dayObj.day }}</span>
              <span></span>
            </div>
          </template>
        </div>
      </div>
      <div
        class="tool-bar"
        v-if="showCalendar"
      >
        <button type="button" v-on:click="selectToday()" > Today </button>
        <button type="button" v-on:click="selectThisWeek()" > This Week </button>
        <button type="button" v-on:click="selectNextWeek()" > Next Week </button>
        <button type="button" v-on:click="selectThisMonth()" > This Month </button>
        <button type="button" v-on:click="selectNextMonth()" > Next Month </button>
      </div>
    </div>

    <hr />

    <div class="calendar-footer">

      <input
        type="text"
        v-model="edit_startDate"
        v-on:blur="correctDate($event, 'edit_startDate')"
      />
      <label>{{ delimiter }}</label>
      <input
        type="text"
        v-model="edit_endDate"
        v-on:blur="correctDate($event, 'edit_endDate')"
      />

      <div class="buttons">
        <button
          type="button"
          class="clear"
          v-on:click="edit_startDate = ''; edit_endDate = '';"
        >
          Clear
        </button>
        <button
          type="button"
          v-bind:class="{ apply: true, disabled : !can_apply() }"
          v-bind:disabled="!can_apply()"
          v-on:click="applyToInput()"
        >
          Apply
        </button>
      </div>
    </div>

  </div>

  <div
    v-if="showCalendar"
    class="wrapper-overlay"
    v-on:click="closeCalendar()"
  >
    <!-- 全畫面蓋版 -->
  </div>
  <span class="invalid-feedback"> </span>
</div>
        `,
  props: {
    divClass: String,
    label: String,
    format: String,
    delimiter: String,
    id: String,
    startDate: String,
    endDate: String,
    minDate: String,
    maxDate: String,
    required: Boolean,
  },
  setup(props, { emit }) {

    const edit_startDate = ref(toDayjs(props.startDate)?.format(props.format));
    const edit_endDate = ref(toDayjs(props.endDate)?.format(props.format));

    const startDateInDayjs = computed({
      get: () => {
        if(!edit_startDate.value) {
          return null;            
        }

        const inDayjs = dayjs(edit_startDate.value);
        if(!inDayjs.isValid()) {
          return null;
        }

        return toDayjs(edit_startDate.value);
      },
      set: (v) => {
        edit_startDate.value = v?.format(props.format);
      },
    });

    const endDateInDayjs = computed({
      get: () => {
        if(!edit_endDate.value) {
          return null;            
        }

        const inDayjs = dayjs(edit_endDate.value);
        if(!inDayjs.isValid()) {
          return null;
        }

        return toDayjs(edit_endDate.value);
      },
      set: (v) => {
        edit_endDate.value = v?.format(props.format);
      },
    });

    // 起迄選擇是否完畢
    const finish_select = ref(true);

    // 類型：字串，要經過 dayjs 的轉換
    const inputValue = ref( edit_startDate.value + props.delimiter + edit_endDate.value );

    const minDateInDayjs = ref(null);
    if (props.minDate) {
      minDateInDayjs.value = toDayjs(props.minDate);
    }

    const maxDateInDayjs = ref(null);
    if (props.maxDate) {
      maxDateInDayjs.value = toDayjs(props.maxDate);
    }

    // 整個日曆物件，以 dayjs 為基礎
    const calendarObj = ref({
      left : null,
      right : null,
    });

    const update_calendarObj = function (dayInDayjs) {

      console.log('update_calendarObj', dayInDayjs.format(props.format));

      calendarObj.value.left = getCalendarByDayjs(dayInDayjs);
      calendarObj.value.right = getCalendarByDayjs(dayInDayjs.add(1, "Month"));

      console.log('calendarObj', calendarObj.value); 
    };
    
    const initialCalendar = function () {
      update_calendarObj( calendarObj.value.left?.currentDate || startDateInDayjs.value || dayjs() );
    };

    const focusInput = function () {
      edit_startDate.value = toDayjs(props.startDate)?.format(props.format);
      edit_endDate.value = toDayjs(props.endDate)?.format(props.format);
      finish_select.value = true;

      initialCalendar();
      openCalendar();
    };

    const blurInput = function () {
    //   console.log("blurInput");
      initialCalendar();
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
      calendarObj.value = {};
    };

    const dayClass = function (dayObj) {
      const classObj = {
        "in-month": dayObj.isViewMonth,

        "not-in-month": !dayObj.isViewMonth,

        "is-today": allowSelectDay(dayObj) 
                    && dayObj.dayInDayjs.isSame(dayjs(), "day"),

        "ranged-date": dayObj.isViewMonth      // 顯示同月的
                    && finish_select.value     // 起迄選擇完畢
                    && startDateInDayjs.value                              // 起日都有值
                    && !dayObj.dayInDayjs.isSame(startDateInDayjs.value)   // 不含起日
                    && endDateInDayjs.value                                // 迄日都有值   
                    && !dayObj.dayInDayjs.isSame(endDateInDayjs.value)     // 不含迄日
                    && dayObj.dayInDayjs.isBetween(startDateInDayjs.value, endDateInDayjs.value, null, "[]"), // 在範圍內

        "start-date": dayObj.isViewMonth      // 顯示同月的
                   && dayObj.dayInDayjs.isSame(startDateInDayjs.value),

        "end-date": dayObj.isViewMonth      // 顯示同月的
                 && dayObj.dayInDayjs.isSame(endDateInDayjs.value),
      };

      return classObj;
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

    const clickCalendarDay = function (dayInDayjs) {
      if(finish_select.value) {
        startDateInDayjs.value = dayInDayjs;
        endDateInDayjs.value = null;
        initialCalendar();
        finish_select.value = false;
        return;
      }

      if(dayInDayjs.isBefore(startDateInDayjs.value)) {
        endDateInDayjs.value = startDateInDayjs.value;
        startDateInDayjs.value = dayInDayjs;
        initialCalendar();
        finish_select.value = true;
        return;
      }

      endDateInDayjs.value = dayInDayjs;
      finish_select.value = true;
      initialCalendar();
    };

    const prevMonth = ref(null);
    const nextMonth = ref(null);

    // 上/下一月
    const toViewOffsetMonth = function (v) {
      update_calendarObj( calendarObj.value.left.currentDate.add(v, "Month") );
    };

    // 選擇今天
    const selectToday = function () {
      clickCalendarDay(dayjs());      
    };

    // 選擇此周
    const selectThisWeek = function () {
      // 這周的第一天
      const firstDayOfWeek = dayjs().startOf("week");
      clickCalendarDay(firstDayOfWeek);
      // 這周的最後一天
      const lastDayOfWeek = dayjs().endOf("week");
      clickCalendarDay(lastDayOfWeek);

      update_calendarObj( firstDayOfWeek );
    };

    // 選擇下周
    const selectNextWeek = function () {
      // 下周的第一天
      const firstDayOfWeek = dayjs().add(1, "week").startOf("week");
      clickCalendarDay(firstDayOfWeek);
      // 下周的最後一天
      const lastDayOfWeek = dayjs().add(1, "week").endOf("week");
      clickCalendarDay(lastDayOfWeek);

      update_calendarObj( firstDayOfWeek );
    };

    // 選擇這個月
    const selectThisMonth = function () {
      // 這個月的第一天
      const firstDayOfMonth = dayjs().startOf("month");
      clickCalendarDay(firstDayOfMonth);
      // 這個月的最後一天
      const lastDayOfMonth = dayjs().endOf("month");
      clickCalendarDay(lastDayOfMonth);

      update_calendarObj( firstDayOfMonth );
    };

    // 選擇下個月
    const selectNextMonth = function () {
      // 下個月的第一天
      const firstDayOfMonth = dayjs().add(1, "month").startOf("month");
      clickCalendarDay(firstDayOfMonth);
      // 下個月的最後一天
      const lastDayOfMonth = dayjs().add(1, "month").endOf("month");
      clickCalendarDay(lastDayOfMonth);

      update_calendarObj( firstDayOfMonth );
    };
    

    // 校正日期，當輸入的值不正確，就會清空
    const correctDate = function (e, target_name) {

      const inputValue = e.target.value;
      const inputValueInDayjs = dayjs(inputValue);
      if (inputValueInDayjs.isValid()) {
        this[target_name] = inputValueInDayjs.format(props.format);
      } else {
        this[target_name] = '';
      }
      
    };

    const can_apply = function() {
      return props.required 
          && finish_select.value 
          && startDateInDayjs.value 
          && endDateInDayjs.value;
    }

    const applyToInput = function () {
      emit("update:startDate", startDateInDayjs.value.format(props.format));
      emit("update:endDate", endDateInDayjs.value.format(props.format));
      inputValue.value = `${startDateInDayjs.value?.format(props.format) || '' }${props.delimiter}${endDateInDayjs.value?.format(props.format) || '' }`;
      closeCalendar();
    }

    onMounted(() => {});

    return {
      edit_startDate,
      edit_endDate,
      startDateInDayjs,
      endDateInDayjs,
      finish_select,
      inputValue,
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
      prevMonth,
      nextMonth,
      toViewOffsetMonth,
      selectToday,
      selectThisWeek,
      selectNextWeek,
      selectThisMonth,
      selectNextMonth,
      correctDate,
      can_apply,
      applyToInput
    };
  },
};
