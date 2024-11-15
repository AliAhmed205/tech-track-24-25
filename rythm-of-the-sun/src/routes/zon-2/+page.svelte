<script>
  import { onMount } from "svelte";
  import * as d3 from "d3-geo";
  import * as topojson from "topojson-client";
  import * as solar from "solar-calculator";

  let canvas;
  let width;
  let height = 750;
  let projection, path, landFeatures;
  let selectedDate = new Date(); 
  let selectedTime = selectedDate.toTimeString().slice(0, 5); 
  let userLocation = { latitude: 0, longitude: 0 };

  // Functie voor het verkrijgen van de gebruiker locatie
  function getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        userLocation.latitude = position.coords.latitude;
        userLocation.longitude = position.coords.longitude;
        resetToCurrentTime(); // Reset de tijd bij het verkrijgen van locatie
      });
    }
  }

  // Bij laden van de component
  onMount(async () => {
    width = window.innerWidth;

    const world = await fetch(
      "https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json"
    ).then((response) => response.json());
    landFeatures = topojson.feature(world, world.objects.land);

    getUserLocation();
    drawSolarTerminator(); 

  });

  function drawSolarTerminator() {
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, width, height); 

    // Standaard projectie en pad instellen
    projection = d3.geoNaturalEarth1().fitSize([width, height], { type: "Sphere" });
    path = d3.geoPath(projection, context);

    const sun = calculateSunPosition(combineDateTime(selectedDate, selectedTime)); 
    const night = createNightCircle(sun);

    const graticule = d3.geoGraticule10();

    // Graticule tekenen
    context.beginPath();
    path(graticule);
    context.strokeStyle = "#ccc";
    context.stroke();

    // Land tekenen
    context.beginPath();
    path(landFeatures);
    context.fillStyle = "green";
    context.fill();

    // Nacht gedeelte tekenen met zachte randen (feather-effect)
    context.save(); 
    context.filter = 'blur(5px)'; 
    context.beginPath();
    path(night);
    context.fillStyle = "rgba(0, 0, 255, 0.3)"; 
    context.fill();
    context.restore(); 

    // Sphere tekenen
    const sphere = { type: "Sphere" };
    context.beginPath();
    path(sphere);
    context.strokeStyle = "black";
    context.stroke();
}


  // Functie om zonpositie te berekenen voor een specifieke datum/tijd
  function calculateSunPosition(date) {
    const now = new Date(date);
    const day = new Date(+now).setUTCHours(0, 0, 0, 0);
    const t = solar.century(now);
    const longitude = ((day - now) / 864e5) * 360 - 180;
    return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
  }

  // Functie om de nachtelijke regio te tekenen
  function createNightCircle(sun) {
    const radius = 90; // in graden
    const center = antipode(sun);
    return d3.geoCircle().radius(radius).center(center)();
  }

  function antipode([longitude, latitude]) {
    return [longitude + 180, -latitude];
  }


  // Functie om geselecteerde datum bij te werken
  function updateSelectedDate(event) {
    selectedDate = new Date(event.target.value);
    drawSolarTerminator(); 
  }

  // Functie om geselecteerde tijd bij te werken
  function updateSelectedTime(event) {
    selectedTime = event.target.value;
    drawSolarTerminator(); 
  }

  // Functie om datum en tijd te combineren tot een volledig Date-object
  function combineDateTime(date, time) {
    const [hours, minutes] = time.split(":");
    const newDate = new Date(date);
    newDate.setHours(hours, minutes);
    return newDate;
  }

  // Functie om de tijd te resetten naar de huidige tijd en locatie
  function resetToCurrentTime() {
    const now = new Date();
    selectedDate = now.toISOString().slice(0, 10); 
    selectedTime = now.toTimeString().slice(0, 5); 
    drawSolarTerminator();
  }
</script>

<div>
  <label for="date">Selecteer een datum:</label>
  <input
    type="date"
    id="date"
    value={selectedDate.toISOString().slice(0, 10)}
    on:change={updateSelectedDate}
  />

  <label for="time">Selecteer een tijd:</label>
  <input
    type="time"
    id="time"
    value={selectedTime}
    on:change={updateSelectedTime}
  />

  <button on:click={resetToCurrentTime}>Reset naar huidige tijd</button>
</div>

<section class="canvas-container">
<canvas bind:this={canvas} {width} {height}>
</canvas>
  <!-- <button class="country">Egypt</button> -->
</section>

<style>
  canvas {
    display: block;
    position: relative;
  }

  div {
    display: flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    margin: .5rem auto;
  }

  section {
    position: relative;
  }

  .country {
    position: absolute;
    top: 15rem;
    right: 38.5rem;
    font-size: .5rem;
  }

  label {
    font-size: 14px;
  }

  input {
    margin-right: 10px;
  }

  button {
    padding: 5px 10px;
    background-color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
  }

  button:hover {
    background-color: #0056b3;
  }
</style>
