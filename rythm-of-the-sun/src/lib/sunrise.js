export async function fetchSunriseSunset(latitude, longitude) {
  const SUNRISE_SUNSET_API_URL = "https://api.sunrisesunset.io/json";

  try {
    const response = await fetch(
      `${SUNRISE_SUNSET_API_URL}?lat=${latitude}&lng=${longitude}&timezone=auto`
    );
    const data = await response.json();
    if (data.status === "OK") {
      let sunrise = parseTimeToUTC(data.results.sunrise);
      let sunset = parseTimeToUTC(data.results.sunset);

      const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
      
      const localSunrise = new Intl.DateTimeFormat("en-US", options).format(sunrise);
      const localSunset = new Intl.DateTimeFormat("en-US", options).format(sunset);

      return { sunrise: localSunrise, sunset: localSunset };
    } else {
      console.error("Kon zonsopgang/zonsondergang gegevens niet ophalen:", data);
      return null;
    }
  } catch (error) {
    console.error("Er ging iets mis:", error);
    return null;
  }
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
