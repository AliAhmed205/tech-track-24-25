<script>
  import { select, json, geoPath, tsv, geoNaturalEarth1 } from "d3";
  import { onMount } from "svelte";
  import { feature } from "topojson-client";
  import { initKaart, toonGeselecteerdLand } from '../lib/toonLand'; 

  let svgElement, wereldProjectie, kaartPadGenerator, landTooltip;

  function haalHoofdstadOp(landId) {
  fetch('https://raw.githubusercontent.com/samayo/country-json/refs/heads/master/src/country-by-capital-city.json')
    .then(response => response.json())  
    .then(data => {
      const land = data.find(item => item.country === landId);
      if (land) {
        document.querySelector('p').textContent = `📍 ${land.city}`;
      } else {
        document.querySelector('p').textContent = `No capital found for ${landId}`;
      }
    })
    .catch(error => {
      console.error("Er is een fout opgetreden bij het ophalen van de hoofdsteden:", error);
      document.querySelector('p').textContent = "Error fetching capital city.";
    });
}


  function schaalKaartOpnieuw() {
    const bounds = kaartPadGenerator.bounds({ type: 'Sphere' });
    const [x0, y0] = bounds[0];
    const [x1, y1] = bounds[1];
    const width = x1 - x0;
    const height = y1 - y0;

    const padding = 20;

    svgElement
      .attr("viewBox", `${x0 - padding} ${y0 - padding} ${width + padding * 2} ${height + padding * 2}`)
      .attr("width", width)
      .attr("height", height);
  }

  onMount(() => {
    svgElement = select("svg");
    wereldProjectie = geoNaturalEarth1();
    kaartPadGenerator = geoPath().projection(wereldProjectie);

    initKaart(svgElement, kaartPadGenerator);

    landTooltip = select("body").append("div").attr("class", "tooltip");

    Promise.all([
      tsv('https://unpkg.com/world-atlas@1.1.4/world/110m.tsv'),
      json('https://unpkg.com/world-atlas@1.1.4/world/110m.json')
    ])
    .then(([landData, geografischeData]) => {
      const landNamen = {};
      landData.forEach(land => {
        landNamen[land.iso_n3] = land.name;
      });

      const landen = feature(geografischeData, geografischeData.objects.countries).features;

      svgElement
        .append('path')
        .datum({ type: 'Sphere' })
        .attr('d', kaartPadGenerator)
        .attr('class', "Sphere")
        .style("fill", "url(#sphere-gradient)")

      svgElement
        .selectAll("path.land")
        .data(landen)
        .join("path")
        .attr('class', 'land')
        .attr("d", kaartPadGenerator)
        .attr("fill", "lightgreen")
        .attr("stroke", "black")
        .on("mouseover", (event, land) => {
          landTooltip.style("visibility", "visible")
            .text(landNamen[land.id])
            .style("top", (event.pageY + 10) + "px")
            .style("left", (event.pageX + 10) + "px");
        })
        .on("mousemove", (event) => {
          landTooltip.style("top", (event.pageY + 10) + "px")
            .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", () => {
          landTooltip.style("visibility", "hidden");
        })
        .on("click", (event, land) => {
          toonGeselecteerdLand(land); 
          console.log(landNamen[land.id]);
          document.querySelector('h2').textContent = landNamen[land.id]
          haalHoofdstadOp(landNamen[land.id]);
        });

      schaalKaartOpnieuw();
      window.addEventListener("resize", schaalKaartOpnieuw);
    })
    .catch((fout) => {
      console.error("Fout bij het laden of verwerken van data:", fout);
    });
  });
</script>

<section class="kaart">
  <h2></h2>
  <p></p>
  <svg style="max-width: 90%; height: auto; margin: auto; border-radius: 3rem; padding: 2rem;">
    <defs>
      <radialGradient id="sphere-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color: #1f3c8f; stop-opacity: 1" />
        <stop offset="90%" style="stop-color: #4e7ad8; stop-opacity: 1" />
        <stop offset="100%" style="stop-color: #3ba7ff; stop-opacity: 1" />
      </radialGradient>
    </defs>

    <path class="Sphere" />
  </svg>
</section>
