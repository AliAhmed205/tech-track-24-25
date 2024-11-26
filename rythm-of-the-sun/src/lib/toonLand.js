import { select } from "d3";

let selectedCountry = null;
let svgElement, cardPathGenerator;


export function initMap(svg, pathGenerator) {
  svgElement = svg;
  cardPathGenerator = pathGenerator;
}

export function showSelectedCountry(d) {
  if (selectedCountry === d) {

    // sunrise = null;
    // sunset = null;

    svgElement.selectAll("path.country")
              .style("opacity", 1);

    svgElement.transition().duration(500).attr("viewBox", `${0} ${0} ${svgElement.attr("width")} ${svgElement.attr("height")}`);
    selectedCountry = null;
    console.log(d.properties);
    console.log(sunset)
    
  } else {
    svgElement.selectAll("path.country").style("opacity", (country) => (country === d ? 1 : 0)).style("display", (country) => d ? "block" : 'none');

    const [[x0, y0], [x1, y1]] = cardPathGenerator.bounds(d);
    const countryBreedte = x1 - x0;
    const countryHoogte = y1 - y0;

    const scaleFactor = 1.5; 
    const viewBoxX = x0 - (countryBreedte * (scaleFactor - 1)) / 2;
    const viewBoxY = y0 - (countryHoogte * (scaleFactor - 1)) / 2;

    svgElement
      .transition()
      .duration(500)
      .attr("viewBox", `${viewBoxX} ${viewBoxY} ${countryBreedte * scaleFactor} ${countryHoogte * scaleFactor}`);
    
    selectedCountry = d;
  }
}
