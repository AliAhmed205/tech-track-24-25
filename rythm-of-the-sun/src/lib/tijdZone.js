export async function fetchTimeZone(latitude, longitude, GEO_NAMES_USERNAME) {
  try {
    const response = await fetch(
      `http://api.geonames.org/timezone?lat=${latitude}&lng=${longitude}&username=${GEO_NAMES_USERNAME}`
    );
    const text = await response.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    const timezoneNode = xmlDoc.querySelector("timezoneId");
    const timeNode = xmlDoc.querySelector("time");

    if (timezoneNode && timeNode) {
      const timezone = timezoneNode.textContent;
      const localTime = new Date(timeNode.textContent).toLocaleTimeString(
        "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
      return { timezone, localTime };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Fout bij ophalen van tijdzone en lokale tijd:", error);
    return null;
  }
}
