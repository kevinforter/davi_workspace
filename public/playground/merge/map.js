// Function to check if all components are loaded
function checkMapLoaded() {
    if (mapLoaded) {
        document.getElementById('map-loader').style.display = 'none';
    }
}

function checkDataLoaded() {
    if (dataLoaded) {
        /*document.getElementById('charts-loader').style.display = 'none';*/
        document.getElementById('lineChart-loader').style.display = 'none';
    }
}

function drawMap() {

    // Load the GeoJSON file and display it on the map
    d3.json("https://raw.githubusercontent.com/kevinforter/davi_workspace/refs/heads/dev/public/assets/swissBOUNDARIES3D_1_3_TLM_KANTONSGEBIET.json").then(data => {
        d3.selectAll("#map > .smallTitle").remove();

        let clickedCanton = null; // Track the currently clicked canton

        // Draw each canton as a path
        const cantons = g.selectAll("path")
            .data(data.features)
            .join("path")
            .attr("d", pathMap)
            .attr("fill", "#D9D9D9")
            .attr("stroke", "black")
            .attr("cursor", "pointer")
            .attr("class", "canton")
            .on("click", clicked)
            .on("mouseover", function (event, d) {
                // Temporarily change fill on hover if not clicked
                if (clickedCanton !== this) {
                    d3.select(this).style("fill", "#444");
                }
            })
            .on("mouseout", function (event, d) {
                // Restore fill based on whether the canton is clicked
                if (clickedCanton !== this) {
                    d3.select(this).style("fill", clickedCanton ? "transparent" : "#D9D9D9");
                }
            });

        cantons.append("title").text(d => d.properties.NAME);

        mapLoaded = true; // Map loaded
        checkMapLoaded();

        // Click event to zoom into the canton
        function clicked(event, d) {
            clickedCanton = this;
            console.log(clickedCanton);

            const [[x0, y0], [x1, y1]] = pathMap.bounds(d);
            event.stopPropagation();
            cantons.transition().style("fill", function () {
                return this === clickedCanton ? "lightgrey" : "transparent";
            });

            svgMap.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                    .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                d3.pointer(event, svgMap.node())
            );
        }

        // Reset function to restore the original view
        function reset() {
            clickedCanton = null;
            console.log(clickedCanton);

            cantons.transition().style("fill", "#D9D9D9");
            svgMap.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity,
                d3.zoomTransform(svgMap.node()).invert([width / 2, height / 2])
            );
        }

        // Apply the reset function when clicking outside of cantons
        svgMap.on("click", reset);

        // Add legend
        const legend = d3.select("#map").append("div")
            .style("bottom", "10px")
            .style("right", "10px")
            .style("position", "absolute")
            .style("display", "flex")
            .style("gap", "20px")
            .style("align-items", "center");

        // Add legend items
        const legendItems = [
            {color: "#9FFF64", label: "Gering"},
            {color: "#F2FF00", label: "Mässig"},
            {color: "#FFC31E", label: "Erheblich"},
            {color: "#FF0000", label: "Gross"},
            {color: "#8B0000", label: "Sehr Gross"},
            {color: "grey", label: "Empty"}
        ];

        legendItems.forEach(item => {
            const itemDiv = legend.append("div").style("display", "flex").style("gap", "5px").style("align-items", "center");

            itemDiv.append("div")
                .style("width", "10px")
                .style("height", "10px")
                .style("border-radius", "50%")
                .style("background-color", item.color);

            itemDiv.append("span")
                .text(item.label)
                .style("font-size", "12px");
        });

        d3.select("#map").append("div")
            .text("Last Updated")
            .attr("class", "smallTitle")
            .style("position", "absolute")
            .style("width", "100%")
            .style("height", "fit-content")
            .style("top", "10px")
            .style("left", "10px")
            .style("color", "#999")

        const date = new Date();

        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();

        // This arrangement can be altered based on how we want the date's format to appear.
        const currentDate = `${day}-${month}-${year}`;

        d3.select("#map").append("div")
            .text(`${currentDate}`)
            .attr("class", "smallTitle")
            .style("position", "absolute")
            .style("width", "100%")
            .style("height", "fit-content")
            .style("top", "calc(1rem + 15px)")
            .style("left", "10px")
            .style("color", "#d1d1d1")

    }).catch(error => console.error("Error loading map:", error));
}

// Recalculate and redraw the SVG on window resize
window.addEventListener("resize", () => {
    document.getElementById("map").innerHTML = ""; // Clear the current SVG
});

// Create a tooltip div that is hidden by default
const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("box-shadow", "0px 0px 5px #888888")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("text-align", "left");