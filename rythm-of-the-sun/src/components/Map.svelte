<script>
  import * as solar from "solar-calculator";
  import { select, json, geoPath, tsv, geoNaturalEarth1, geoCircle } from "d3";
  import { fetchSunriseSunset } from "../lib/sunrise.js";
  import { updateSelectedDate } from "../lib/datumTijd";
  import { combineDateTime } from "../lib/combiTijd.js";
  import { updateSelectedTime } from "../lib/datumTijd";
  import { fetchTimeZone } from "../lib/tijdZone.js";
  import { onMount } from "svelte";
  import { feature } from "topojson-client";
  import { initKaart, toonGeselecteerdLand } from "../lib/toonLand";

  let svgElement, wereldProjectie, kaartPadGenerator, landTooltip;
  let city = "";
  let timezone = "";
  let sunrise;
  let sunset;
  let selectedDate = new Date();
  let selectedTime = selectedDate.toTimeString().slice(0, 5);

  const GEO_NAMES_USERNAME = "aliahmed205";

  function handleDateChange(event) {
    updateSelectedDate(event, updateSunAndNight);
  }

  function handleTimeChange(event) {
    updateSelectedTime(event, updateSunAndNight);
  }

  function resetToCurrentTime() {
    const now = new Date();

    selectedDate = now.toISOString().slice(0, 10);
    selectedTime = now.toTimeString().slice(0, 5);

    updateSunAndNight();
  }

  async function fetchCoordinates(city) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${city}&format=json&addressdetails=1`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      const sunriseSunset = await fetchSunriseSunset(lat, lon);

      if (sunriseSunset) {
        sunrise = sunriseSunset.sunrise;
        sunset = sunriseSunset.sunset;
      }
      console.log(sunriseSunset);
    } else {
      console.error("Kon geen locatie vinden voor de ingevoerde stad.");
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
    const sunPosition = calculateSunPosition(
      combineDateTime(selectedDate, selectedTime)
    );
    const nightZone = createNightCircle(sunPosition);

    // Update the map with the new sun and night zone
    svgElement.selectAll(".night-zone").remove();
    svgElement
      .append("path")
      .datum(nightZone)
      .attr("class", "night-zone")
      .attr("d", kaartPadGenerator)
      // .attr("pointer-events", "none")
      .style("stroke", "rgba(0, 0, 48, 0.9)")
      .attr("fill", "rgba(0, 0, 48, 0.9)");
  }

  onMount(() => {
    svgElement = select(".kaart svg");
    wereldProjectie = geoNaturalEarth1();
    kaartPadGenerator = geoPath().projection(wereldProjectie);

    initKaart(svgElement, kaartPadGenerator);

    landTooltip = select("body").append("div").attr("class", "tooltip");

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
          .on("mouseover", async (event, land) => {
            landTooltip.style("visibility", "visible").text("Laden...");

            const landNaam = landNamen[land.id];
            const coords = land.geometry.coordinates[0][0]; // Neem een coördinaat van het land
            const tijdzoneData = await fetchTimeZone(coords[1], coords[0], GEO_NAMES_USERNAME);

            if (tijdzoneData) {
              const { timezone, localTime } = tijdzoneData;
              landTooltip
                .text(`${landNaam}\nLokale tijd: ${localTime} (${timezone})`)
                .style("top", event.pageY + 10 + "px")
                .style("left", event.pageX + 10 + "px");
            } else {
              landTooltip
                .text(`${landNaam}\nLokale tijd: Niet beschikbaar`)
                .style("top", event.pageY + 10 + "px")
                .style("left", event.pageX + 10 + "px");
            }
          })
          .on("mousemove", (event) => {
            landTooltip
              .style("top", event.pageY + 10 + "px")
              .style("left", event.pageX + 10 + "px");
          })
          .on("mouseout", () => {
            landTooltip.style("visibility", "hidden");
          })
          .on("click", (event, land) => {
            toonGeselecteerdLand(land);
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
      on:change={handleDateChange}
    />

    <label for="time">Selecteer een tijd:</label>
    <input
      type="time"
      id="time"
      bind:value={selectedTime}
      on:change={handleTimeChange}
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
  </div>
</section>

<div class="sun-info">
  {#if sunrise && sunset}
    <p>Tijdzone: {timezone}</p>
    <p>Zonsopgang: {sunrise}</p>
    <p>Zonsondergang: {sunset}</p>
  {:else}
    <p>Klik op een land om zonsopgang en zonsondergang te zien.</p>
  {/if}
</div>
