<script>
  import { select, json, geoPath, tsv, geoNaturalEarth1, geoCircle } from "d3";
  import { onMount } from "svelte";
  import { feature } from "topojson-client";
  import { initKaart, toonGeselecteerdLand } from "../lib/toonLand";
  import * as solar from "solar-calculator";

  let svgElement, wereldProjectie, kaartPadGenerator;
  let city = "";
  let timezone = "";
  let sunrise;
  let sunset;
  let localTime = "";


  let selectedDate = new Date(); 
  let selectedTime = selectedDate.toTimeString().slice(0, 5); 
  let userLocation = { latitude: 0, longitude: 0 };

  const SUNRISE_SUNSET_API_URL = "https://api.sunrisesunset.io/json";

  function getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        userLocation.latitude = position.coords.latitude;
        userLocation.longitude = position.coords.longitude;
        resetToCurrentTime(); 
      });
    }
  }

  function updateSelectedDate(event) {
    selectedDate = new Date(event.target.value);
  
    updateSunAndNight();
  }

  // Functie om geselecteerde tijd bij te werken
  function updateSelectedTime(event) {
    selectedTime = event.target.value;
    updateSunAndNight();
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

  updateSunAndNight();
}

  function parseTimeToUTC(timeString) {
    const [time, modifier] = timeString.split(" ");
    let [hours, minutes, seconds] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    const date = new Date();
    date.setUTCHours(hours, minutes, seconds || 0, 0);
    return date;
  }

  async function fetchTimeZone(latitude, longitude) {
  const apiKey = process.env.TIMEZONE_API_KEY;
  try {
    const response = await fetch(
      `http://api.timezonedb.com/v2.1/get-time-zone?key=${apiKey}&format=json&by=position&lat=${latitude}&lng=${longitude}`
    );
    const data = await response.json();

    if (data.status === "OK") {
      timezone = data.zoneName;
      localTime = new Date(data.formatted).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return { timezone, localTime };
    } else {
      console.error("Kon tijdzonegegevens niet ophalen:", data.message);
      return null;
    }
  } catch (error) {
    console.error("Fout bij ophalen van tijdzone:", error);
    return null;
  }
}



  async function fetchCoordinates(city) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${city}&format=json&addressdetails=1`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      fetchSunriseSunset(lat, lon);
    } else {
      console.error("Kon geen locatie vinden voor de ingevoerde stad.");
    }
  }

  async function fetchSunriseSunset(latitude, longitude) {
  try {
    const response = await fetch(
      `${SUNRISE_SUNSET_API_URL}?lat=${latitude}&lng=${longitude}&timezone=UTC`
    );
    const data = await response.json();

    if (data.status === "OK") {
      await fetchTimeZone(latitude, longitude); // Update timezone en localTime
      sunrise = parseTimeToUTC(data.results.sunrise);
      sunset = parseTimeToUTC(data.results.sunset);

      try {
        const localSunrise = new Date(
          sunrise.toLocaleString("en-US", { timeZone: timezone })
        );
        const localSunset = new Date(
          sunset.toLocaleString("en-US", { timeZone: timezone })
        );

        sunrise = localSunrise.toLocaleTimeString();
        sunset = localSunset.toLocaleTimeString();
      } catch (error) {
        console.error("Fout bij omzetten van tijd:", error);
      }
    } else {
      console.error(
        "Kon zonsopgang/zonsondergang gegevens niet ophalen:",
        data
      );
    }
  } catch (error) {
    console.error("Er ging iets mis:", error);
  }
}



  function haalHoofdstadOp(landId) {
    fetch(
      "https://raw.githubusercontent.com/samayo/country-json/refs/heads/master/src/country-by-capital-city.json"
    )
      .then((response) => response.json())
      .then((data) => {
        const land = data.find((item) => item.country === landId);
        if (land) {
          city = land.city;
          fetchCoordinates(city);
          document.querySelector("p").textContent = `📍 ${land.city}`;
        } else {
          document.querySelector("p").textContent =
            `No capital found for ${landId}`;
        }
      })
      .catch((error) => {
        console.error(
          "Er is een fout opgetreden bij het ophalen van de hoofdsteden:",
          error
        );
        document.querySelector("p").textContent =
          "Error fetching capital city.";
      });
  }

  function schaalKaartOpnieuw() {
    const bounds = kaartPadGenerator.bounds({ type: "Sphere" });
    const [x0, y0] = bounds[0];
    const [x1, y1] = bounds[1];
    const width = x1 - x0;
    const height = y1 - y0;

    const padding = 20;

    svgElement
      .attr(
        "viewBox",
        `${x0 - padding} ${y0 - padding} ${width + padding * 2} ${height + padding * 2}`
      )
      .attr("width", width)
      .attr("height", height);
  }

  function antipode(coordinates) {
    const [longitude, latitude] = coordinates;
    const antipodeLongitude = longitude + 180;
    const antipodeLatitude = -latitude;
    return [antipodeLongitude, antipodeLatitude];
  }

  // Functies voor zonpositie en nachtzone
  function calculateSunPosition(date) {
    const now = new Date(date);
    const day = new Date(+now).setUTCHours(0, 0, 0, 0);
    const t = solar.century(now);
    const longitude = ((day - now) / 864e5) * 360 - 180;
    return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
  }

  function createNightCircle(sun) {
    const radius = 90; // in graden
    const center = antipode(sun);
    return geoCircle().radius(radius).center(center)();
  }

  function updateSunAndNight() {
    const sunPosition = calculateSunPosition(combineDateTime(selectedDate, selectedTime));
    const nightZone = createNightCircle(sunPosition);

    svgElement.selectAll(".night-zone").remove();
    svgElement
      .append("path")
      .datum(nightZone)
      .attr("class", "night-zone")
      .attr("d", kaartPadGenerator)

      .style("stroke", "rgba(0, 0, 48, 0.9)")
      .attr("fill", "rgba(0, 0, 48, 0.9)");
  }

  onMount(() => {
    const calendarInput = document.querySelector('#date')
    svgElement = select(".kaart svg");
    wereldProjectie = geoNaturalEarth1();
    kaartPadGenerator = geoPath().projection(wereldProjectie);

    initKaart(svgElement, kaartPadGenerator);

    Promise.all([
      tsv("https://unpkg.com/world-atlas@1.1.4/world/110m.tsv"),
      json("https://unpkg.com/world-atlas@1.1.4/world/110m.json"),
    ])
      .then(([landData, geografischeData]) => {
        const landNamen = {};
        landData.forEach((land) => {
          landNamen[land.iso_n3] = land.name;
        });

        const landen = feature(
          geografischeData,
          geografischeData.objects.countries
        ).features;

        svgElement
          .append("path")
          .datum({ type: "Sphere" })
          .attr("d", kaartPadGenerator)
          .attr("class", "Sphere")
          .style("fill", "url(#sphere-gradient)");

        svgElement
          .selectAll("path.land")
          .data(landen)
          .join("path")
          .attr("class", "land")
          .attr("d", kaartPadGenerator)
          .attr("fill", "lightgreen")
          .attr("stroke", "black")
          .on("click", (event, land) => {
            sunrise = null
            toonGeselecteerdLand(land);
            console.log(sunrise)
            console.log(landNamen[land.id]);
            document.querySelector("h2").textContent = landNamen[land.id];
            haalHoofdstadOp(landNamen[land.id]);
          });

        schaalKaartOpnieuw();
        window.addEventListener("resize", schaalKaartOpnieuw);

        updateSunAndNight();
        setInterval(() => updateSunAndNight(), 60000);
      })

      .catch((fout) => {
        console.error("Fout bij het laden of verwerken van data:", fout);
      });
  });
</script>

<section class="kaart">

  <div class="date-time-input">
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
      bind:value={selectedTime}
      on:change={updateSelectedTime}
    />
  
    <button on:click={resetToCurrentTime}>Reset naar huidige tijd</button>
    
    <h2></h2>
  <p></p>
  <svg
    style="max-width: 90%; height: auto; margin: auto; border-radius: 3rem; padding: 2rem;"
  >
    <defs>
      <radialGradient
        id="sphere-gradient"
        cx="50%"
        cy="50%"
        r="50%"
        fx="50%"
        fy="50%"
      >
        <stop offset="0%" style="stop-color: #1f3c8f; stop-opacity: 1" />
        <stop offset="90%" style="stop-color: #4e7ad8; stop-opacity: 1" />
        <stop offset="100%" style="stop-color: #3ba7ff; stop-opacity: 1" />
      </radialGradient>
    </defs>
    <path class="Sphere" />
  </svg>
</section>

<div class="sun-info">
  {#if sunrise && sunset}
    <p>Zonsopgang: {sunrise}</p>
    <p>Zonsondergang: {sunset}</p>
    <p>Lokale Tijd: {localTime}</p>
  {:else}
    <p>Klik op een land om zonsopgang, zonsondergang en lokale tijd te zien.</p>
  {/if}
</div>
