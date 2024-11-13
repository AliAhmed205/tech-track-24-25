<script>
  import { select, geoPath, geoNaturalEarth1, json } from "d3";
  import { feature } from "topojson-client";
  import { onMount } from "svelte";

  let svgElement;
  let wereldProjectie;
  let kaartPadGenerator;
  let landData;  

  onMount(() => {
    svgElement = select("svg");
    wereldProjectie = geoNaturalEarth1();
    kaartPadGenerator = geoPath().projection(wereldProjectie);

    json('https://unpkg.com/world-atlas@1.1.4/world/110m.json')
      .then((geografischeData) => {
        landData = feature(geografischeData, geografischeData.objects.countries).features;

        svgElement
          .selectAll("path.land")
          .data(landData)
          .join("path")
          .attr("class", "land")
          .attr("d", kaartPadGenerator)
          .attr("fill", "lightgreen")
          .attr("stroke", "black");
      })
      .catch((error) => {
        console.error("Fout bij het laden van de geografische data:", error);
      });
  });
</script>

<section class="kaart">
  <svg style="margin: auto;">
  </svg>
  </section>