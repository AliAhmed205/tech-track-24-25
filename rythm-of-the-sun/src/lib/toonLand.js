import { select } from "d3";

let geselecteerdeLand = null;
let svgElement, kaartPadGenerator;

export function initKaart(svg, pathGenerator) {
  svgElement = svg;
  kaartPadGenerator = pathGenerator;
}

export function toonGeselecteerdLand(d) {
  if (geselecteerdeLand === d) {

    svgElement.selectAll("path.land")
              .style("opacity", 1);

    svgElement.transition().duration(500).attr("viewBox", `${0} ${0} ${svgElement.attr("width")} ${svgElement.attr("height")}`);
    geselecteerdeLand = null;
    console.log(d.properties);
    
  } else {
    svgElement.selectAll("path.land").style("opacity", (land) => (land === d ? 1 : 0)).style("display", (land) => d ? "block" : 'none');

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
    
    geselecteerdeLand = d;
  }
}
