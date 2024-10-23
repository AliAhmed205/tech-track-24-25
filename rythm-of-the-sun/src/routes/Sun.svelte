<script>
  import * as d3 from 'd3';
  import { onMount } from 'svelte';

  let width;
  let height;
  let projection;
  let path;
  let countries = [];
  let selectedCountry = null; // Houd het geselecteerde land bij
  let sunData = ''; // Houd de zoninformatie bij

  onMount(async () => {
    if (typeof window !== 'undefined') {
      width = window.innerWidth;
      height = window.innerHeight;

      // Laad de werelddata
      const data = await d3.json('https://raw.githubusercontent.com/latentflip/d3/refs/heads/master/data/world-countries.json');
      countries = data.features || [];

      // Maak een Mercator-projectie aan
      projection = d3.geoMercator()
        .scale(150)
        .translate([width / 2, height / 2]);

      path = d3.geoPath().projection(projection);

      // Selecteer de SVG en voeg paden toe
      const svg = d3.select('#map')
        .attr('width', width)
        .attr('height', height)
        .style('border', '1px solid #ccc');

      // Functie om de zonpositie te berekenen
      const calculateSunPosition = () => {
        const now = new Date();
        const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const t = (now - day) / 86400000 * 360; // Huidige tijd in dagen in graden
        const longitude = (t - 180) % 360; // Verplaatsing van de zon langs de longituden
        return longitude;
      };

      // Bepaal de nacht overlay
      const updateNightOverlay = () => {
        const longitude = calculateSunPosition();
        const nightCircle = d3.geoCircle()
          .radius(90) // Straal van de nachtzone
          .center([longitude + 180, 0])(); // Centraal op de antipode van de zon

        // Teken de nacht overlay
        svg.selectAll('path.night')
          .data([nightCircle])
          .join('path')
          .attr('class', 'night')
          .attr('d', path)
          .attr('fill', 'rgba(0, 0, 255, 0.3)') // Lichte blauwe kleur voor de nacht
          .attr('stroke', 'none');
      };

      // Functie om de kaart te renderen
      const render = () => {
        svg.selectAll('path.country')
          .data(countries)
          .join('path')
          .attr('class', 'country')
          .attr('d', path)
          .attr('fill', d => (d.properties.name === selectedCountry ? 'red' : '#ccc')) // Markeer het geselecteerde land in het rood
          .attr('stroke', '#333')
          .on('click', (event, d) => {
            console.log('Clicked on:', d.properties.name); // Debugging log

            // Controleer of het land al geselecteerd is
            if (selectedCountry === d.properties.name) {
              selectedCountry = null; // Deselecteer het land als het opnieuw is geklikt
            } else {
              selectedCountry = d.properties.name; // Selecteer het nieuwe land
            }

            // Herteken de paden met de nieuwe geselecteerde status met transitie
            svg.selectAll('path.country')
              .transition() // Start een transitie
              .duration(220) // Duur van de transitie in milliseconden
              .attr('fill', (country) => 
                country.properties.name === selectedCountry ? 'red' : '#ccc'
              );

            // Update zoninformatie
            updateSunData(d.properties.name);
          });

        console.log('Aantal landen:', countries.length);
      };

      // Update zoninformatie bij het klikken op een land
      const updateSunData = (countryName) => {
        const now = new Date();
        const utcHours = now.getUTCHours();
        
        // Bepaal de tijdzone van het geselecteerde land
        const timezoneOffset = timezones[countryName] || 0; // UTC-offset
        const localHours = (utcHours + timezoneOffset + 24) % 24; // Locale tijd in uren
        const localMinutes = now.getUTCMinutes(); // Blijf met de minuten van UTC

        const sunInfo = `Huidige tijd in ${countryName}: ${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')} UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}, Zonpositie (longitude): ${calculateSunPosition().toFixed(2)}°`;
        sunData = sunInfo; // Update zoninformatie
        console.log(sunInfo); // Log naar console
      };

      // Initiale render aanroepen
      render();
      updateNightOverlay(); // Voeg de nacht overlay toe

      // Update de nacht overlay elke minuut
      setInterval(() => {
        updateNightOverlay();
        updateSunData(selectedCountry); // Update zoninformatie elke minuut
      }, 60000); // Update elke minuut
    }
  });
</script>

<svg id="map"></svg>

<!-- Voeg een div toe om zoninformatie weer te geven -->
<div id="sun-info" style="position: absolute; top: 10px; left: 10px; background: rgba(255, 255, 255, 0.8); padding: 10px; border-radius: 5px;">
  {sunData}
</div>

<style>
  *, body {
    padding: 0;
    margin: 0;
  }
  svg {
    width: 100vw;   /* Volledige breedte van het viewport */
    height: 100vh;  /* Volledige hoogte van het viewport */
    z-index: 1; 
    position: relative; 
  }
</style>
