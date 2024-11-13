// script.js

const width = 975;
const height = 610;

const projection = d3.geoMercator().center([8.3, 46.8]).scale(7000).translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

// Function to apply zoom transformations to the SVG group
function zoomed(event) {
    const { transform } = event;
    g.attr("transform", transform);
    g.attr("stroke-width", 1 / transform.k);
}

// Create an SVG element to hold the map
const svg = d3.select("#map").append("svg")
    .attr("viewBox", [0, 0, width, height])  // Keeps the SVG content proportionate
    .attr("preserveAspectRatio", "xMidYMid meet"); // Ensures content scales within the aspect ratio

// Create a zoom behavior and attach it to the SVG
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

svg.call(zoom);

// Append a group to hold the map shapes
const g = svg.append("g");

// Load the GeoJSON file and display it on the map
d3.json("assets/swissBOUNDARIES3D_1_3_TLM_KANTONSGEBIET.json").then(data => {
    // Draw each canton as a path
    const cantons = g.selectAll("path")
        .data(data.features)
        .join("path")
        .attr("d", path)
        .attr("fill", "#444")
        .attr("stroke", "white")
        .attr("cursor", "pointer")
        .on("click", clicked);

    cantons.append("title").text(d => d.properties.NAME);

    // Click event to zoom into the canton
    function clicked(event, d) {
        const [[x0, y0], [x1, y1]] = path.bounds(d);
        event.stopPropagation();
        cantons.transition().style("fill", "#444");
        d3.select(this).transition().style("fill", "red");

        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(event, svg.node())
        );
    }

    // Reset function to restore the original view
    function reset() {
        cantons.transition().style("fill", "#444");
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
        );
    }

    // Apply the reset function when clicking outside of cantons
    svg.on("click", reset);

}).catch(error => console.error(error));
