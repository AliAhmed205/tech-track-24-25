<script>
  export let sunrise;
  export let sunset;
  export let localTime = "";
  export let selectedCountry = "";
  export let selectedCity = "";
</script>

<div class="sun-info">
  {#if sunrise && sunset}
    <p>{localTime}</p>
    <p><strong></strong> {selectedCountry}</p>
    <p><strong>📍</strong> {selectedCity}</p>
    <p><img src="/images/sunrise.svg" alt="Sunrise" /> {sunrise}</p>
    <p><img src="/images/sunset.svg" alt="Sunset" /> {sunset}</p>
  {:else}
    <p>
      Click on a country to see its sunrise, sunset, capital and local time.
    </p>
  {/if}
</div>