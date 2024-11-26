<script>
  export let sunrise;
  export let sunset;
  export let localTime = "";
  export let selectedCountry = "";
  export let selectedCity = "";
</script>

<div class="sun-info">
  {#if sunrise && sunset}
  <h2><strong></strong>  📍 {selectedCountry}</h2>
  <h3><strong></strong> {selectedCity}</h3>
  <h4>Local Time: {localTime}</h4>
    <p><img src="/images/sunrise.svg" alt="Sunrise" /> <strong>Sunrise</strong>  {sunrise}</p>
    <p><img src="/images/sunset.svg" alt="Sunset" /> <strong>Sunset</strong>  {sunset}</p>
  {:else}
    <p>
      Click on a country to see its sunrise, sunset, capital and local time.
    </p>
  {/if}
</div>
