<script>
  let city = "";  // Hier vult de gebruiker de stad in
  let timezone = "";
  let sunrise;
  let sunset;

  const SUNRISE_SUNSET_API_URL = 'https://api.sunrisesunset.io/json';

  // GeoNames gebruikersnaam (vervang dit met je eigen gebruikersnaam)
  const GEO_NAMES_USERNAME = 'aliahmed205';

  // Functie om AM/PM tijdsnotatie om te zetten naar een Date-object
  function parseTimeToUTC(timeString) {
      const [time, modifier] = timeString.split(' ');
      let [hours, minutes, seconds] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      const date = new Date();
      date.setUTCHours(hours, minutes, seconds || 0, 0);
      return date;
  }

  // Functie om de tijdzone van een stad op te halen via GeoNames API
  async function fetchTimeZone(latitude, longitude) {
      const response = await fetch(`http://api.geonames.org/timezoneJSON?lat=${latitude}&lng=${longitude}&username=${GEO_NAMES_USERNAME}`);
      const data = await response.json();
      console.log("GeoNames Timezone Data:", data);  // Voeg deze regel toe voor debugging
      if (data && data.timezoneId) {
          timezone = data.timezoneId;  // Haal de tijdzone op (bijv. Europe/Amsterdam)
          console.log("Tijdzone:", timezone);  // Voeg deze regel toe voor debugging
          return timezone;
      } else {
          console.error("Kon de tijdzone niet ophalen.");
      }
  }

  // Haal de coördinaten op voor een gegeven stad met OpenStreetMap Nominatim
  async function fetchCoordinates(city) {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${city}&format=json&addressdetails=1`);
      const data = await response.json();
      if (data && data.length > 0) {
          const { lat, lon } = data[0];  // Haal de eerste match op
          fetchSunriseSunset(lat, lon);
      } else {
          console.error("Kon geen locatie vinden voor de ingevoerde stad.");
      }
  }

  // Haal sunrise en sunset gegevens op met de Sunrise Sunset API
  async function fetchSunriseSunset(latitude, longitude) {
      try {
          const response = await fetch(`${SUNRISE_SUNSET_API_URL}?lat=${latitude}&lng=${longitude}&timezone=UTC`);
          const data = await response.json();
          if (data.status === 'OK') {
              // Haal de tijdzone voor de opgezochte stad op
              await fetchTimeZone(latitude, longitude);

              // Zet de tijden om naar UTC en pas de tijdzone van de stad toe
              sunrise = parseTimeToUTC(data.results.sunrise);
              sunset = parseTimeToUTC(data.results.sunset);
              
              // Zet de tijden om naar de lokale tijd op basis van de tijdzone
              try {
                const localSunrise = new Date(sunrise.toLocaleString('en-US', { timeZone: timezone }));
                const localSunset = new Date(sunset.toLocaleString('en-US', { timeZone: timezone }));

                sunrise = localSunrise.toLocaleTimeString();
                sunset = localSunset.toLocaleTimeString();
              } catch (error) {
                console.error("Fout bij omzetten van tijd:", error);  // Voeg deze regel toe voor debugging
              }
          } else {
              console.error("Kon zonsopgang/zonsondergang gegevens niet ophalen:", data);
          }
      } catch (error) {
          console.error("Er ging iets mis:", error);
      }
  }

  // Zoek naar de locatie en update sunrise/sunset tijden
  function searchCity() {
      if (city) {
          fetchCoordinates(city);
      }
  }
</script>

<style>
  .sun-info {
      font-size: 1.2em;
      margin-top: 10px;
  }
</style>

<!-- HTML voor de invoer en resultaten -->
<div>
  <input type="text" bind:value={city} placeholder="Voer een stad in" />
  <button on:click={searchCity}>Zoek</button>
</div>

<div class="sun-info">
  {#if sunrise && sunset}
    <p>Tijdzone: {timezone}</p>
    <p>Zonsopgang: {sunrise}</p>
    <p>Zonsondergang: {sunset}</p>
  {:else}
    <p>Voer een stad in om zonsopgang en zonsondergang te zien.</p>
  {/if}
</div>
