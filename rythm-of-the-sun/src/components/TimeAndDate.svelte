<script>
  export let selectedDate;
  export let selectedTime;
  export let onDateChange;
  export let onTimeChange;
  export let onResetTime;
</script>

<div class="date-time-input">
  <label for="date">Select a date:</label>
  <input
    type="date"
    id="date"
    bind:value={selectedDate}
    on:change={onDateChange}
  />

  <label for="time">Select a time:</label>
  <input
    type="time"
    id="time"
    bind:value={selectedTime}
    on:change={onTimeChange}
  />

  <button on:click={onResetTime}>Reset to today</button>
</div>