<script>
  export let onAdvanceTime; 
</script>

<div class="time-buttons">
  <button on:click={() => onAdvanceTime(5)}>+5 uur</button>
  <button on:click={() => onAdvanceTime(-5)}>-5 uur</button>
</div>
