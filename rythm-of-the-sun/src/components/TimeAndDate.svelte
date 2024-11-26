<script>
  export let selectedDate;
  export let selectedTime;
  export let onDateChange;
  export let onTimeChange;
  export let onResetTime;
</script>

<div class="date-time-input">
  <h1 class="title"><i class="fa-solid fa-sun"></i> Rythm of The Sun</h1>
  <div class="input-container">
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

  <button on:click={onResetTime}><i class="fa-solid fa-rotate-right"></i>Reset to today</button>
</div>
</div>