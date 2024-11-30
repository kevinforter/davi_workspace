// Set the map width and height
const width = 975;
const height = 610;

// Set up the map projection centered on Switzerland
const projection = d3.geoMercator()
    .center([8.3, 46.8])
    .scale(11000)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Function to apply zoom transformations to the SVG groups
function zoomed(event) {
    const {transform} = event;
    g.attr("transform", transform);
    gridGroup.attr("transform", transform);  // Apply transformation to grid lines
    pointsGroup.attr("transform", transform);  // Apply transformation to points
    g.attr("stroke-width", 1 / transform.k);
    gridGroup.attr("stroke-width", 0.5 / transform.k);  // Adjust grid stroke width on zoom
    pointsGroup.attr("stroke-width", 0.5 / transform.k);  // Adjust points stroke width on zoom
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

// Append groups for the map shapes, grid lines, and points
const g = svg.append("g");
const gridGroup = svg.append("g");
const pointsGroup = svg.append("g"); // New group for points

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
        d3.select(this).transition().style("fill", "lightgrey");

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

/*
// Define longitude and latitude intervals for Switzerland
const longitudes = d3.range(5.5, 10.5, 0.5);  // Adjust as needed
const latitudes = d3.range(45.5, 48.0, 0.5);  // Adjust as needed

// Draw longitude lines and labels
longitudes.forEach(lon => {
    gridGroup.append("path")
        .datum({type: "LineString", coordinates: [[lon, 45], [lon, 48]]})
        .attr("d", path)
        .attr("stroke", "#999")
        .attr("stroke-width", 0.5)
        .attr("fill", "none")
        .attr("stroke-dasharray", "2,2");

    // Add longitude labels
    gridGroup.append("text")
        .attr("x", projection([lon, 48])[0])  // Position at the top of the map
        .attr("y", projection([lon, 48])[1] - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#333")
        .text(`${lon}°E`);
});

// Draw latitude lines and labels
latitudes.forEach(lat => {
    gridGroup.append("path")
        .datum({type: "LineString", coordinates: [[5.5, lat], [10.5, lat]]})
        .attr("d", path)
        .attr("stroke", "#999")
        .attr("stroke-width", 0.5)
        .attr("fill", "none")
        .attr("stroke-dasharray", "2,2");

    // Add latitude labels
    gridGroup.append("text")
        .attr("x", projection([5.5, lat])[0] - 20)  // Position at the left of the map
        .attr("y", projection([5.5, lat])[1])
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#333")
        .text(`${lat}°N`);
});
 */

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

document.addEventListener('DOMContentLoaded', function () {
    // Variables to store selected filter values
    let selectedCanton = 'all';
    let selectedMunicipality = 'all';
    let selectedDangerLevels = new Set();
    let fromDate = null;
    let toDate = null;

    // Event listener to open and close the filter popup
    document.getElementById('filterButton').addEventListener('click', () => {
        document.getElementById('filterModal').style.display = 'block';
    });

    document.getElementById('closeFilter').addEventListener('click', () => {
        document.getElementById('filterModal').style.display = 'none';
    });

    // Load the CSV file, populate filters, and draw points
    d3.csv("assets/avalanche_accidents_fatal_switzerland_since_1936.csv").then(data => {
        // Populate filter dropdowns with unique values
        const uniqueCantons = [...new Set(data.map(d => d['canton']))].sort();
        const uniqueMunicipalities = [...new Set(data.map(d => d['municipality']))].sort();
        const uniqueDangerLevels = [...new Set(data.map(d => d['forecasted.dangerlevel.rating1']))].sort();

        // Populate Canton filter
        const cantonFilter = d3.select("#cantonFilter");
        // Add the "all" option to allow filtering for all cantons
        cantonFilter.append("option").attr("value", "all").text("All Cantons");

        // Populate with unique values
        uniqueCantons.forEach(canton => {
            cantonFilter.append("option").attr("value", canton).text(canton);
        });

        // Populate Municipality filter
        const municipalityFilter = d3.select("#municipalityFilter");
        // Add the "all" option to allow filtering for all municipalities
        municipalityFilter.append("option").attr("value", "all").text("All Municipalities");

        // Populate with unique values
        uniqueMunicipalities.forEach(municipality => {
            municipalityFilter.append("option").attr("value", municipality).text(municipality);
        });


        // Populate Danger Level filter with checkboxes
        const dangerLevelContainer = d3.select("#dangerLevelContainer");
        uniqueDangerLevels.forEach(level => {
            console.log("Level:", level); // Check the value of each level

            const checkbox = dangerLevelContainer.append("div").append("label");
            checkbox.append("input")
                .attr("type", "checkbox")
                .attr("value", level)
                .on("change", function () {
                    if (this.checked) {
                        selectedDangerLevels.add(this.value);
                    } else {
                        selectedDangerLevels.delete(this.value);
                    }
                });

            // Ensure the level is a number
            let levelNumber = Number(level); // Convert level to number

            // Assign text based on the level value
            let levelText;
            switch (levelNumber) {
                case 1:
                    levelText = "Gering";
                    break;
                case 2:
                    levelText = "Mässig";
                    break;
                case 3:
                    levelText = "Erheblich";
                    break;
                case 4:
                    levelText = "Gross";
                    break;
                case 5:
                    levelText = "Sehr gross";
                    break;
                default:
                    levelText = "Empty"; // Default for null or invalid values
            }

            checkbox.append("span").text(levelText);
        });


        // Function to draw points on the map
        function drawPoints(data) {
            // Clear any existing points
            pointsGroup.selectAll("circle").remove();

            data.forEach(row => {
                const latitude = parseFloat(row['start.zone.coordinates.latitude']);
                const longitude = parseFloat(row['start.zone.coordinates.longitude']);
                const date = row['date'];
                const canton = row['canton'];
                const municipality = row['municipality'];
                const dangerLevel = row['forecasted.dangerlevel.rating1'];

                // Convert the date to a JavaScript Date object for filtering
                const rowDate = new Date(date);

                // Check if the data matches the selected filters
                if (
                    (selectedCanton === 'all' || canton === selectedCanton) &&
                    (selectedMunicipality === 'all' || municipality === selectedMunicipality) &&
                    (selectedDangerLevels.size === 0 || selectedDangerLevels.has(dangerLevel)) &&
                    (!fromDate || rowDate >= new Date(fromDate)) &&
                    (!toDate || rowDate <= new Date(toDate))
                ) {
                    // Ensure valid coordinates before plotting
                    if (!isNaN(latitude) && !isNaN(longitude)) {
                        const projectedCoordinates = projection([longitude, latitude]);

                        pointsGroup.append("circle")
                            .attr("cx", projectedCoordinates[0])
                            .attr("cy", projectedCoordinates[1])
                            .attr("r", 2)
                            .attr("fill", "red")
                            .attr("stroke", "black")
                            .attr("stroke-width", 0.5)
                            .on("mouseover", (event) => {
                                tooltip
                                    .style("opacity", 1)
                                    .html(`
                                        <strong>Date:</strong> ${date}<br>
                                        <strong>Canton:</strong> ${canton}<br>
                                        <strong>Municipality:</strong> ${municipality}<br>
                                        <strong>Coordinates:</strong> [${latitude}, ${longitude}]<br>
                                        <strong>Danger Level:</strong> ${dangerLevel}
                                    `)
                                    .style("left", (event.pageX + 10) + "px")
                                    .style("top", (event.pageY - 28) + "px");
                            })
                            .on("mousemove", (event) => {
                                tooltip
                                    .style("left", (event.pageX + 10) + "px")
                                    .style("top", (event.pageY - 28) + "px");
                            })
                            .on("mouseout", () => {
                                tooltip.style("opacity", 0);
                            });
                    }
                }
            });
        }

        // Draw initial points
        drawPoints(data);

        // Event listener for applying filters
        document.getElementById('applyFilter').addEventListener('click', () => {
            selectedCanton = document.getElementById('cantonFilter').value;
            selectedMunicipality = document.getElementById('municipalityFilter').value;
            fromDate = document.getElementById('fromDate').value;
            toDate = document.getElementById('toDate').value;

            drawPoints(data);
            document.getElementById('filterModal').style.display = 'none';
        });
    }).catch(error => console.error("Error loading the CSV file:", error));
});

// JavaScript to handle the modal popup

// Get elements
const filterButton = document.getElementById('filterButton');
const filterModal = document.getElementById('filterModal');
const closeFilter = document.getElementById('closeFilter');
const applyFilterButton = document.getElementById('applyFilter');

// Open the filter modal
filterButton.addEventListener('click', () => {
    filterModal.style.display = 'block';
});

// Close the filter modal
closeFilter.addEventListener('click', () => {
    filterModal.style.display = 'none';
});

// Apply the filter and close the modal
applyFilterButton.addEventListener('click', () => {
    // Call your filter function here if needed
    filterModal.style.display = 'none';
});

// Close modal when clicking outside of the modal content
window.addEventListener('click', (event) => {
    if (event.target === filterModal) {
        filterModal.style.display = 'none';
    }
});
