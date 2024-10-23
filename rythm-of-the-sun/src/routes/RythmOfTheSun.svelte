<script>
  import { onMount } from "svelte";
  import * as d3 from "d3-geo";
  import * as topojson from "topojson-client";
  import * as solar from "solar-calculator";

  let canvas;
  let width;
  let height = 750;
  let projection, path, landFeatures;
  let selectedDate = new Date(); // Standaard huidige datum en tijd
  let selectedTime = selectedDate.toTimeString().slice(0, 5); // Standaard huidige tijd in "HH:MM" formaat
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
    // Dynamisch de canvas breedte instellen
    width = window.innerWidth;

    // Wereldkaart ophalen en initialiseren
    const world = await fetch(
      "https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json"
    ).then((response) => response.json());
    landFeatures = topojson.feature(world, world.objects.land);

    getUserLocation();
    drawSolarTerminator(); // Teken met huidige tijd

    // Voeg een click event listener toe
    canvas.addEventListener("click", handleClick);
  });

  function drawSolarTerminator() {
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, width, height); // Canvas opschonen voor hertekening

    // Standaard projectie en pad instellen
    projection = d3
      .geoNaturalEarth1()
      .fitSize([width, height], { type: "Sphere" });
    path = d3.geoPath(projection, context);

    const sun = calculateSunPosition(
      combineDateTime(selectedDate, selectedTime)
    ); // Zonpositie op basis van geselecteerde datum en tijd
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
    context.fillStyle = "black";
    context.fill();

    // Nacht gedeelte tekenen
    context.beginPath();
    path(night);
    context.fillStyle = "rgba(0,0,255,0.3)";
    context.fill();

    // Sphere tekenen
    const sphere = { type: "Sphere" };
    context.beginPath();
    path(sphere);
    context.strokeStyle = "transparent";
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

  function handleClick(event) {
    const coords = d3.pointer(event, canvas); // Verkrijg muisklikcoördinaten
    const [longitude, latitude] = projection.invert(coords); // Zet om naar geografische coördinaten

    // Zoek het land dat is aangeklikt
    const clickedLand = landFeatures.features.find((feature) => {
      return d3.geoContains(feature, [longitude, latitude]);
    });

    if (clickedLand) {
      alert(`Je hebt geklikt op: ${clickedLand.properties.name}`);
    }
  }

  // Functie om geselecteerde datum bij te werken
  function updateSelectedDate(event) {
    selectedDate = new Date(event.target.value);
    drawSolarTerminator(); // Update canvas na verandering van datum
  }

  // Functie om geselecteerde tijd bij te werken
  function updateSelectedTime(event) {
    selectedTime = event.target.value;
    drawSolarTerminator(); // Update canvas na verandering van tijd
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
    selectedDate = now.toISOString().slice(0, 10); // Huidige datum
    selectedTime = now.toTimeString().slice(0, 5); // Huidige tijd in "HH:MM" formaat
    drawSolarTerminator();
  }
</script>

<!-- HTML voor de datum- en tijdselectie en resetknop -->
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

<canvas bind:this={canvas} {width} {height}></canvas>

<style>
  canvas {
    display: block;
  }

  div {
    display: flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    margin: .5rem auto;
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
