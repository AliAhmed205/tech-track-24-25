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
  const SUNRISE_SUNSET_API_URL = "https://api.sunrisesunset.io/json";

  //////////////////////////////////// 
  // Kaart Initialiseren en Tekenen //
  //////////////////////////////////// 


  ///////////////////////////////////////// 
  // Geografische Gegevens en Interactie //
  ///////////////////////////////////////// 

  // Deze functie haalt de hoofdstad op voor een opgegeven land via een externe JSON API.
  // Het ontvangt de land-id als parameter en maakt een fetch-aanroep naar een openbare API met een lijst van landen en hoofdsteden.
  // Als de hoofdstad voor het opgegeven land wordt gevonden, wordt de geselecteerde stad (selectedCity) bijgewerkt en worden de coördinaten
  // van de hoofdstad opgehaald via de functie fetchCoordinates. Als geen hoofdstad wordt gevonden voor het land, wordt een foutmelding weergegeven.
  // In geval van een fetch-fout wordt er een foutmelding gelogd en wordt de geselecteerde stad ingesteld op "Error fetching capital city."
  function fetchCountryCapital(countryId) {
    fetch(
      "https://raw.githubusercontent.com/samayo/country-json/refs/heads/master/src/country-by-capital-city.json"
    )
      .then((response) => response.json())
      .then((data) => {
        const country = data.find((item) => item.country === countryId);
        if (country) {
          selectedCity = country.city;
          fetchCoordinates(country.city);
        } else {
          selectedCity = `No capital found for ${countryId}`;
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

  // Deze asynchrone functie haalt de geografische coördinaten (latitude en longitude) op voor een opgegeven stad.
  // Het ontvangt de naam van een stad als parameter en maakt een verzoek naar de OpenStreetMap Nominatim API
  // om de coördinaten van de stad te verkrijgen. Als de stad succesvol wordt gevonden, worden de coördinaten
  // gebruikt om de functie fetchSunriseSunset aan te roepen met de opgehaalde breedte- en lengtegraad.
  // Bij een mislukte zoekopdracht wordt er een foutmelding weergegeven.
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

  // Deze asynchrone functie haalt de tijdzone-informatie op op basis van geografische coördinaten (latitude, longitude).
  // Het ontvangt de breedte- en lengtegraad als parameters en maakt een verzoek naar de TimeZoneDB API
  // om de tijdzone en lokale tijd te verkrijgen. Als de API-aanroep succesvol is, wordt de tijdzone en
  // lokale tijd geretourneerd. Bij fouten wordt er een foutmelding weergegeven en retourneert de functie null.
  async function fetchTimeZone(latitude, longitude) {
    const apiKey = process.env.TIMEZONE_API_KEY;
    try {
      const response = await fetch(
        `https://api.timezonedb.com/v2.1/get-time-zone?key=${apiKey}&format=json&by=position&lat=${latitude}&lng=${longitude}`
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

  // Deze asynchrone functie haalt de tijden van zonsopgang en zonsondergang op voor opgegeven geografische coördinaten (latitude, longitude).
  // Het maakt een verzoek naar een API voor zonsopgang en zonsondergang (SUNRISE_SUNSET_API_URL) met de opgegeven coördinaten en tijdzone.
  // Bij een succesvolle API-respons worden de tijden voor zonsopgang en zonsondergang in UTC opgehaald en omgezet naar de lokale tijdzone.
  // De functie maakt vervolgens gebruik van de fetchTimeZone functie om de tijdzone van de locatie op te halen,
  // en converteert de tijden naar de lokale tijd, die vervolgens wordt geformatteerd en opgeslagen in de variabelen `sunrise` en `sunset`.
  // Bij fouten worden er foutmeldingen weergegeven.
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

  /////////////////////////////////
  // Datum- en Tijdinstellingen //
  ///////////////////////////////

  // Deze functie ontvangt de huidige datum en tijd (nu) als parameter,
  // en werkt de geselecteerde datum en tijd bij op basis van de opgegeven waarde.
  // Daarna wordt de functie updateSunAndNight() aangeroepen om de zon- en nachtstatus bij te werken.
  function updateToCurrentTime(now) {
    selectedDate = now.toISOString().slice(0, 10);
    selectedTime = now.toTimeString().slice(0, 5);
    updateSunAndNight();
  }

  // Deze functie wordt aangeroepen wanneer de geselecteerde datum wordt gewijzigd.
  // Het ontvangt een event als parameter, haalt de nieuwe datum op uit het event,
  // en werkt de geselecteerde datum bij. Vervolgens stopt het de tijdupdate en
  // roept de functie updateSunAndNight() aan om de zon- en nachtstatus bij te werken.
  function updateSelectedDate(event) {
    const newDate = new Date(event.target.value);
    selectedDate = newDate.toISOString().slice(0, 10);
    stopTimeUpdater();
    updateSunAndNight();
  }

  // Deze functie wordt aangeroepen wanneer de geselecteerde tijd wordt gewijzigd.
  // Het ontvangt een event als parameter, haalt de nieuwe tijd op uit het event,
  // en werkt de geselecteerde tijd bij. Vervolgens stopt het de tijdupdate en
  // roept de functie updateSunAndNight() aan om de zon- en nachtstatus bij te werken.
  function updateSelectedTime(event) {
    selectedTime = event.target.value;
    stopTimeUpdater();
    updateSunAndNight();
  }

  // Deze functie combineert een datum en tijd tot één Date-object.
  // Het ontvangt twee parameters: een datum (date) en een tijd (time).
  // De tijd wordt opgesplitst in uren en minuten, en deze waarden worden ingesteld
  // voor de opgegeven datum. Het resultaat is een nieuw Date-object met zowel
  // de datum als de tijd gecombineerd.
  function combineDateTime(date, time) {
    const [hours, minutes] = time.split(":");
    const newDate = new Date(date);
    newDate.setHours(hours, minutes);
    return newDate;
  }

  // Deze functie reset de geselecteerde datum en tijd naar de huidige datum en tijd.
  // Het maakt een nieuw Date-object aan voor de huidige tijd, werkt de geselecteerde
  // datum en tijd bij, en roept de functie updateSunAndNight() aan om de zon- en nachtstatus bij te werken.
  // Daarna stopt het de tijdupdate, en start het een nieuwe tijdupdate met de functie updateToCurrentTime.
  function resetToCurrentTime() {
    const now = new Date();
    selectedDate = now.toISOString().slice(0, 10);
    selectedTime = now.toTimeString().slice(0, 5);

    updateSunAndNight();
    stopTimeUpdater();
    startTimeUpdater(updateToCurrentTime);
  }

  // Deze functie verschaft een manier om de geselecteerde tijd met een bepaald aantal uren vooruit of achteruit te verplaatsen.
  // Het ontvangt een parameter 'hours' die aangeeft hoeveel uren de tijd moet worden aangepast. De functie bepaalt of de tijd vooruit
  // (positief aantal uren) of achteruit (negatief aantal uren) moet worden verplaatst. Vervolgens wordt de tijd in kleine stappen
  // (van 1 uur) aangepast totdat het doel is bereikt. De functie maakt gebruik van setTimeout om de tijdstappen met een kleine vertraging
  // (100ms) uit te voeren, en werkt de datum en tijd bij na elke stap. Bij elke stap wordt ook de functie updateSunAndNight() aangeroepen
  // om de zon- en nachtstatus bij te werken.
  function advanceTimeByHours(hours) {
    const step = hours > 0 ? 1 : -1;
    const steps = Math.abs(hours);

    let currentDateTime = combineDateTime(selectedDate, selectedTime);

    function updateTimeStep(stepCount) {
      if (stepCount > steps) return;

      currentDateTime = new Date(
        currentDateTime.getTime() + step * 60 * 60 * 1000
      );
      selectedDate = currentDateTime.toISOString().slice(0, 10);
      selectedTime = currentDateTime.toTimeString().slice(0, 5);

      updateSunAndNight();

      setTimeout(() => updateTimeStep(stepCount + 1), 100);
    }

    stopTimeUpdater();
    updateTimeStep(1);
  }

  ///////////////////////////////////////////////////
  // Helpen met de Berekeningen voor Zon en Nacht //
  /////////////////////////////////////////////////

  // Deze functie zet een tijdstring in 12-uurs formaat (met AM/PM) om naar een UTC Date-object.
  // Het ontvangt een timeString als parameter in het formaat "HH:MM:SS AM/PM".
  // De functie splitst de tijd en de AM/PM-modifier, past de uren aan afhankelijk van of het AM of PM is,
  // en zet de resulterende tijd om naar een UTC Date-object. Het retourneert het Date-object in UTC.
  function parseTimeToUTC(timeString) {
    const [time, modifier] = timeString.split(" ");
    let [hours, minutes, seconds] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    const date = new Date();
    date.setUTCHours(hours, minutes, seconds || 0, 0);
    return date;
  }

  // Deze functie berekent de antipode (tegenovergestelde punt) van een opgegeven geografisch coördinaat.
  // Het ontvangt een array van coördinaten [longitude, latitude] als parameter.
  // De functie berekent de antipodale lengtegraad door 180 graden toe te voegen aan de opgegeven lengtegraad.
  // De antipodale breedtegraad wordt berekend door de opgegeven breedtegraad negatief te maken.
  // Het resultaat is een array van de antipodale coördinaten [antipodeLongitude, antipodeLatitude].
  function antipode(coordinates) {
    const [longitude, latitude] = coordinates;
    const antipodeLongitude = longitude + 180;
    const antipodeLatitude = -latitude;
    return [antipodeLongitude, antipodeLatitude];
  }

  // Deze functie berekent de positie van de zon op een gegeven datum.
  // Het ontvangt een datum (date) als parameter en gebruikt de SolarCalc bibliotheek om de zonshoogte en de declinatie van de zon te berekenen.
  // De functie zet de opgegeven datum om naar UTC-middernacht en berekent vervolgens het tijdstip (t) in de zonne-eeuw.
  // De lengtegraad van de zon wordt berekend op basis van het verschil tussen de opgegeven datum en UTC-middernacht, en wordt aangepast voor de equatie van de tijd.
  // De functie retourneert een array met de aangepaste lengtegraad van de zon en de declinatie van de zon.
  function calculateSunPosition(date) {
    const now = new Date(date);
    const day = new Date(+now).setUTCHours(0, 0, 0, 0);
    const t = solar.century(now);
    const longitude = ((day - now) / 864e5) * 360 - 180;
    return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
  }


  // Deze functie schaalt een SVG-kaart opnieuw op basis van de bounds van een geografische kaart.
  // Het berekent de huidige grenzen van de kaart (bounds), waarbij de kaart wordt behandeld als een bol (Sphere).
  // Vervolgens wordt de grootte van de kaart berekend door het verschil tussen de x- en y-coördinaten van de grenzen.
  // De viewBox van het SVG-element wordt aangepast om de kaart met een extra padding te tonen, zodat de kaart goed zichtbaar is.
  // De breedte en hoogte van het SVG-element worden ook aangepast om de nieuwe schaal en het aangepaste viewBox goed weer te geven.
  function rescaleMapRender() {
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

  // Deze functie maakt een cirkel die het nachtgebied vertegenwoordigt op basis van de zonpositie.
  // Het ontvangt de zonpositie (sun) als parameter, die een array van coördinaten [longitude, latitude] is.
  // De functie berekent de antipode (het tegenovergestelde punt) van de zonpositie met behulp van de antipode functie,
  // en gebruikt deze coördinaten als het middelpunt van de cirkel.
  // De cirkel wordt gemaakt met een straal van 90 graden, wat meestal overeenkomt met een groot deel van de nachtelijke hemisfeer.
  // De functie retourneert de gemaakte cirkel als een geoCircle object.
  function createNightCircle(sun) {
    const radius = 90;
    const center = antipode(sun);
    return geoCircle().radius(radius).center(center)();
  }

  // Deze functie werkt de weergave van de zon- en nachtzone bij op basis van de geselecteerde datum en tijd.
  // Eerst berekent de functie de zonpositie door de geselecteerde datum en tijd te combineren met de functie calculateSunPosition.
  // Vervolgens maakt de functie een nachtzone (de antipodale regio van de zon) door de functie createNightCircle aan te roepen.
  // Het zoekt vervolgens naar een bestaand pad met de klasse ".night-zone" in de SVG. Als zo'n pad nog niet bestaat,
  // wordt er een nieuw pad toegevoegd met de juiste vorm (d) en stijlen voor de nachtzone.
  // Als het pad al bestaat, wordt het bijgewerkt met de nieuwe nachtzone gegevens.
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
      nightZonePath.datum(nightZone).attr("d", cardPathGenerator);
    }
  }

    // De onMount functie wordt uitgevoerd zodra de component wordt geladen en gemonteerd.
  // Het start de tijdsupdate en configureert de kaart en de geografische projectie.
  onMount(() => {
    startTimeUpdater(updateToCurrentTime); // Start het bijwerken van de tijd op de huidige tijd

    svgElement = select(".kaart svg"); // Selecteer het SVG-element in de DOM
    WorldProjection = geoNaturalEarth1(); // Stel de geografische projectie in (Natural Earth 1)
    cardPathGenerator = geoPath().projection(WorldProjection); // Maak een path generator met de gekozen projectie

    initMap(svgElement, cardPathGenerator); // Initialiseert de kaart met de geselecteerde SVG en path generator

    // Laadt geografische data en landgegevens van externe bronnen (via tsv en json bestanden)
    Promise.all([
      tsv("https://unpkg.com/world-atlas@1.1.4/world/110m.tsv"), // Laadt landnamen
      json("https://unpkg.com/world-atlas@1.1.4/world/110m.json"), // Laadt geografische gegevens
    ])
      .then(([countryData, geografischeData]) => {
        const countryNames = {}; // Object om landnamen op te slaan, geïdentificeerd door hun ISO-codes
        countryData.forEach((country) => {
          countryNames[country.iso_n3] = country.name; // Voeg elk land toe aan het landNamen object
        });

        // Converteer geografische data naar een array van landen
        const countries = feature(
          geografischeData,
          geografischeData.objects.countries
        ).features;

        // Voeg een pad toe aan de SVG voor de hele wereld als een bol
        svgElement
          .append("path")
          .datum({ type: "Sphere" }) // Zet het geometrische type als 'Sphere'
          .attr("d", cardPathGenerator) // Genereer het pad op basis van de projectie
          .attr("class", "Sphere") // Voeg een CSS-klasse toe
          .style("fill", "url(#sphere-gradient)"); // Vul het pad met een verloopkleur

        // Voeg paden toe voor elk land op basis van de geografische data
        svgElement
          .selectAll("path.country") // Selecteer alle bestaande paden met de klasse 'land'
          .data(countries) // Bind de landdata aan de paden
          .join("path") // Voeg nieuwe paden toe als ze nog niet bestaan
          .attr("class", "country") // Voeg de klasse 'land' toe aan de paden
          .attr("d", cardPathGenerator) // Genereer het pad voor elk land
          .attr("fill", "lightgreen") // Stel de kleur van elk land in
          .attr("stroke", "black") // Stel de randkleur van elk land in
          .on("click", (event, country) => {
            sunrise = null; // Reset de zonsopgang bij een nieuwe klik
            showSelectedCountry(country); // Toon de geselecteerde landinformatie
            selectedCountry = countryNames[country.id]; // Bewaar de naam van het geselecteerde land
            fetchCountryCapital(countryNames[country.id]); // Haal de hoofdstad van het land op
          });

        rescaleMapRender(); // Pas de schaal van de kaart opnieuw aan op basis van de container
        window.addEventListener("resize", rescaleMapRender); // Voeg een resize eventlistener toe om de schaal opnieuw aan te passen bij het wijzigen van de grootte van het venster

        updateSunAndNight(); // Update de zon- en nachtzone op de kaart
        setInterval(() => updateSunAndNight(), 60000); // Stel een interval in om de zon- en nachtzone elke minuut bij te werken
      })

      .catch((fout) => {
        console.error("Fout bij het laden of verwerken van data:", fout); // Log een fout als de data niet geladen of verwerkt kan worden
      });

    // De onDestroy functie wordt uitgevoerd wanneer de component wordt verwijderd of vernietigd.
    onDestroy(() => {
      stopTimeUpdater(); // Stop de tijdsupdate wanneer de component wordt vernietigd
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
  <svg>
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

<TimeButtons onAdvanceTime={advanceTimeByHours} />

<SunInfo {sunrise} {sunset} {localTime} {selectedCountry} {selectedCity} />
