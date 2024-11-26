<script>
  import { select, json, geoPath, tsv, geoNaturalEarth1, geoCircle } from "d3";
  import { onMount, onDestroy } from "svelte";
  import { feature } from "topojson-client";
  import { initMap, showSelectedCountry } from "../lib/toonLand";
  import * as solar from "solar-calculator";
  import { startTimeUpdater, stopTimeUpdater } from "../lib/updateTijd";
  import SunInfo from "./sunInfo.svelte";
  import TimeButtons from "./TimeButtons.svelte";
  import TimeAndDate from "./TimeAndDate.svelte";

  let svgElement, WorldProjection, cardPathGenerator;
  let timezone = "";
  let sunrise;
  let sunset;
  let localTime = "";
  let selectedCountry = "";
  let selectedCity = "";
  let selectedDate = new Date();
  let selectedTime = selectedDate.toTimeString().slice(0, 5);

  function updateToCurrentTime(now) {
    selectedDate = now.toISOString().slice(0, 10);
    selectedTime = now.toTimeString().slice(0, 5);
    updateSunAndNight();
  }

  const SUNRISE_SUNSET_API_URL = "https://api.sunrisesunset.io/json";

  function updateSelectedDate(event) {
    const newDate = new Date(event.target.value);
    selectedDate = newDate.toISOString().slice(0, 10);
    stopTimeUpdater();
    updateSunAndNight();
  }

  function updateSelectedTime(event) {
    selectedTime = event.target.value;

    stopTimeUpdater();

    updateSunAndNight();
  }
  function combineDateTime(date, time) {
    const [hours, minutes] = time.split(":");
    const newDate = new Date(date);
    newDate.setHours(hours, minutes);
    return newDate;
  }

  function resetToCurrentTime() {
    const now = new Date();
    selectedDate = now.toISOString().slice(0, 10);
    selectedTime = now.toTimeString().slice(0, 5);

    updateSunAndNight();
    stopTimeUpdater();
    startTimeUpdater(updateToCurrentTime);
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
        await fetchTimeZone(latitude, longitude);
        const sunriseUTC = parseTimeToUTC(data.results.sunrise);
        const sunsetUTC = parseTimeToUTC(data.results.sunset);

        try {
          const localSunrise = new Date(
            sunriseUTC.toLocaleString("en-US", { timeZone: timezone })
          );
          const localSunset = new Date(
            sunsetUTC.toLocaleString("en-US", { timeZone: timezone })
          );

          sunrise = localSunrise.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          sunset = localSunset.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
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

  function advanceTimeByHours(hours) {
  const step = hours > 0 ? 1 : -1; // Bepaalt of de tijd vooruit of achteruit gaat
  const steps = Math.abs(hours); // Hoeveel stappen er nodig zijn
  
  let currentDateTime = combineDateTime(selectedDate, selectedTime);

  function updateTimeStep(stepCount) {
    if (stepCount > steps) return; // Stop als alle stappen zijn uitgevoerd

    // Pas de huidige tijd aan
    currentDateTime = new Date(currentDateTime.getTime() + step * 60 * 60 * 1000);
    selectedDate = currentDateTime.toISOString().slice(0, 10);
    selectedTime = currentDateTime.toTimeString().slice(0, 5);

    updateSunAndNight(); // Update de zon- en nachtzone

    // Roep deze functie opnieuw aan na een korte vertraging
    setTimeout(() => updateTimeStep(stepCount + 1), 100); // 500 ms vertraging tussen stappen
  }

  stopTimeUpdater(); // Zorg ervoor dat automatische updates worden gepauzeerd
  updateTimeStep(1); // Start de update-loop
}


  function haalHoofdstadOp(landId) {
    fetch(
      "https://raw.githubusercontent.com/samayo/country-json/refs/heads/master/src/country-by-capital-city.json"
    )
      .then((response) => response.json())
      .then((data) => {
        const land = data.find((item) => item.country === landId);
        if (land) {
          selectedCity = land.city;
          fetchCoordinates(land.city);
        } else {
          selectedCity = `No capital found for ${landId}`;
        }
      })
      .catch((error) => {
        console.error(
          "Er is een fout opgetreden bij het ophalen van de hoofdsteden:",
          error
        );
        selectedCity = "Error fetching capital city."; //
      });
  }

  function schaalKaartOpnieuw() {
    const bounds = cardPathGenerator.bounds({ type: "Sphere" });
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

  function calculateSunPosition(date) {
    const now = new Date(date);
    const day = new Date(+now).setUTCHours(0, 0, 0, 0);
    const t = solar.century(now);
    const longitude = ((day - now) / 864e5) * 360 - 180;
    return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
  }

  function createNightCircle(sun) {
    const radius = 90; 
    const center = antipode(sun);
    return geoCircle().radius(radius).center(center)();
  }

  function updateSunAndNight() {
  const sunPosition = calculateSunPosition(
    combineDateTime(selectedDate, selectedTime)
  );
  const nightZone = createNightCircle(sunPosition);

  const nightZonePath = svgElement.selectAll(".night-zone");

  if (nightZonePath.empty()) {
    svgElement
      .append("path")
      .datum(nightZone)
      .attr("class", "night-zone")
      .attr("d", cardPathGenerator)
      .style("stroke", "rgba(0, 0, 48, 0.9)")
      .attr("fill", "rgba(0, 0, 48, 0.9)");
  } else {
    nightZonePath
      .datum(nightZone)
      .attr("d", cardPathGenerator);
  }
}


  onMount(() => {
    startTimeUpdater(updateToCurrentTime);

    svgElement = select(".kaart svg");
    WorldProjection = geoNaturalEarth1();
    cardPathGenerator = geoPath().projection(WorldProjection);

    initMap(svgElement, cardPathGenerator);

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
          .attr("d", cardPathGenerator)
          .attr("class", "Sphere")
          .style("fill", "url(#sphere-gradient)");

        svgElement
          .selectAll("path.land")
          .data(landen)
          .join("path")
          .attr("class", "land")
          .attr("d", cardPathGenerator)
          .attr("fill", "lightgreen")
          .attr("stroke", "black")
          .on("click", (event, land) => {
            sunrise = null;
            showSelectedCountry(land);
            selectedCountry = landNamen[land.id];
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

    onDestroy(() => {
      stopTimeUpdater();
    });
  });
</script>

<TimeAndDate
{selectedDate}
{selectedTime}
onDateChange={updateSelectedDate}
onTimeChange={updateSelectedTime}
onResetTime={resetToCurrentTime}
/>

<section class="kaart">
  
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


<TimeButtons  onAdvanceTime={advanceTimeByHours} />

<SunInfo
  {sunrise}
  {sunset}
  {localTime}
  {selectedCountry}
  {selectedCity}
/>