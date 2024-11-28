# ☀️ Rythm of The Sun

Rhythm of The Sun is an interactive visualization tool built with Svelte and D3.js that maps the Earth's countries and provides detailed information about the sun's behavior at various locations and times. Users can explore sunrise, sunset times, and night zones dynamically on a beautiful globe visualization.

## ☀️ Features

| Feature | Description |
| :-- | :--- |
| Interactive World Map | Rendered with D3.js using the Natural Earth projection. Click on a country to fetch its capital city and geographic information. |
| Sunrise & Sunset Calculation | Fetches sunrise and sunset times for any location via API. Converts these times to the local timezone for better understanding. |
| Dynamic Date & Time Controls | Users can update the date and time to see how the sun's position changes. Includes "reset to current time" functionality. |
| Night Zone Visualization | Displays the night area on the map dynamically based on the current time.|
| Real-Time Updates| The map updates the sun's position and night zones every minute. |
| Antipodal Calculations | Calculate the exact opposite point on the Earth's surface for any given location.|

Ensure you have the following installed:

- <b>Node.js (v14 or later)</b>
- <b>npm</b>

## ☀️ Clone the repository

```bash
git clone https://github.com/AliAhmed205/tech-track-24-25
```

### Change the directory

```bash
cd ryhtm-of-the-sun
```

### Install the dependencies

```bash
npm install
```

### Run the project

```bash
npm run dev -- --open
```

<hr>

## ☀️ Usage

✨ <b>Explore the Map</b> ✨

Click on any country to view its name and sunrise/sunset times in the capital city.

✨ <b>Change Date and Time</b> ✨

Use the date and time controls to adjust the visualization to a specific moment.

✨ <b>Visualize Night Zones</b> ✨

Observe the dynamically updated night zones based on the sun's position.

✨ <b>Reset to Current Time</b> ✨

Quickly reset the visualization to the current time and date.

## ☀️ Technologies

### <p style="display: flex; gap: .5rem; align-items:center;"><img width="5%" src="https://github.com/user-attachments/assets/40580d89-641f-4b61-b72b-d26e07440ea4" alt="Svelte-icon"/> Svelte</p>

### <p style="display: flex; gap: .5rem; align-items:center;"><img width="5%" src="https://github.com/user-attachments/assets/0d6448f0-3136-4b0e-8a96-96e5c5ff12a3" alt="D3"/> D3</p>

<br>

## ☀️ APIs

<ul>
<li><a style="color: goldenrod;" href="https://sunrisesunset.io/">SunriseSunset API</a></li>
<li><a style="color: goldenrod;" href="https://timezonedb.com//">TimeZoneDB API</a></li>
<li><a style="color: goldenrod;" href="https://www.openstreetmap.org/#map=7/52.154/5.295">OpenStreetMap</a></li>
</ul>

## ☀️ Project Structure

<b>src/components:</b>

`TimeAndDate.svelte`
Date and time picker component.

`SunInfo.svelte`
 Displays calculated sunrise and sunset times.

`TimeButtons.svelte`
 Provides quick adjustments to time.

<b>src/lib</b>

`toonLand.js`
 Functions for map rendering and country interaction.

`updateTijd.js`
 Real-time updater for managing date and time.

 ## ☀️ Environment Variables

The project uses `environment variables` for API keys:

`TIMEZONE_API_KEY:`
 API key for TimeZoneDB.
To set up, create a .env file in the root directory with the following content:
makefile
Code kopiëren


## ☀️ License

This project is licensed under the MIT License.

## ☀️ Author

© It's by Ali 2024