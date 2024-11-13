<script>
  import { select, json, geoPath, tsv, geoNaturalEarth1 } from "d3";
  import { onMount } from "svelte";
  import { feature } from "topojson-client";

  let svgElement, wereldProjectie, kaartPadGenerator, landTooltip;
  let geselecteerdeLand = null; 

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

  function toonGeselecteerdLand(d) {
    if (geselecteerdeLand === d) {
      svgElement.selectAll("path.land").style("opacity", 1);
      svgElement.transition().duration(500).attr("viewBox", `${0} ${0} ${svgElement.attr("width")} ${svgElement.attr("height")}`);
      geselecteerdeLand = null; 
    } else {
      svgElement.selectAll("path.land").style("opacity", (land) => (land === d ? 1 : 0));

      const [[x0, y0], [x1, y1]] = kaartPadGenerator.bounds(d);
      const landBreedte = x1 - x0;
      const landHoogte = y1 - y0;

      const scaleFactor = 1.5; // Bepaal de schaalfactor voor vergroting
      const viewBoxX = x0 - (landBreedte * (scaleFactor - 1)) / 2;
      const viewBoxY = y0 - (landHoogte * (scaleFactor - 1)) / 2;

      svgElement
        .transition()
        .duration(500) 
        .attr("viewBox", `${viewBoxX} ${viewBoxY} ${landBreedte * scaleFactor} ${landHoogte * scaleFactor}`);
      
      geselecteerdeLand = d; // Zet het geselecteerde land
    }
  }

  onMount(() => {
    svgElement = select("svg");
    wereldProjectie = geoNaturalEarth1();
    kaartPadGenerator = geoPath().projection(wereldProjectie);

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
        .attr('class', "Sphere");

      svgElement
        .selectAll("path.land")
        .data(landen)
        .join("path")
        .attr('class', 'land')
        .attr("d", kaartPadGenerator)
        .attr("fill", "lightgreen")
        .attr("stroke", "black")
        .style("filter", "drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5))")
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
          toonGeselecteerdLand(land);  // Roep de toggle-functie aan
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
  <svg style="max-width: 100%; height: auto;"></svg>
</section>
