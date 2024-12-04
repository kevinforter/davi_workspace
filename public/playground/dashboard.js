// Track loading states
let mapLoaded = false;
let dataLoaded = false;

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

const margin = {top: 5, right: 0, bottom: 40, left: 30},
    containerWidth = document.querySelector("#lineChart").offsetWidth,
    containerHeight = document.querySelector("#lineChart").offsetHeight,
    widthLineChart = containerWidth - margin.left - margin.right,
    heightLineChart = containerHeight - margin.top - margin.bottom;

const x = d3.scaleLinear().range([margin.left, widthLineChart - margin.right]);
const y = d3.scaleLinear().range([heightLineChart, 0]);

// Map Variables
const mapContainer = document.getElementById("map");
const {width: widthMap, height: heightMap} = mapContainer.getBoundingClientRect();

// Set up the map projection centered on Switzerland
const projection = d3.geoMercator()
    .center([8.3, 46.8])
    .scale(Math.min(widthMap, heightMap) * 17) // Adjust scale dynamically
    .translate([widthMap / 2, heightMap / 2]);

const pathMap = d3.geoPath().projection(projection);

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
const svgMap = d3.select("#map").append("svg")
    .attr("viewBox", `0 0 ${widthMap} ${heightMap}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

// Create a zoom behavior and attach it to the SVG
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

svgMap.call(zoom);

// Append a group for the map shapes
const g = svgMap.append("g");
const gridGroup = svgMap.append("g");
const pointsGroup = svgMap.append("g"); // New group for points

// Load the GeoJSON file and display it on the map
d3.json("https://raw.githubusercontent.com/kevinforter/davi_workspace/refs/heads/dev/public/assets/swissBOUNDARIES3D_1_3_TLM_KANTONSGEBIET.json").then(data => {
    // Draw each canton as a path
    const cantons = g.selectAll("path")
        .data(data.features)
        .join("path")
        .attr("d", pathMap)
        .attr("fill", "#D9D9D9")
        .attr("stroke", "black")
        .attr("cursor", "pointer")
        .attr("class", "canton")
        .on("click", clicked);

    cantons.append("title").text(d => d.properties.NAME);

    mapLoaded = true; // Map loaded
    checkMapLoaded();

    // Click event to zoom into the canton
    function clicked(event, d) {
        const [[x0, y0], [x1, y1]] = pathMap.bounds(d);
        event.stopPropagation();
        cantons.transition().style("fill", "transparent");
        d3.select(this).transition().style("fill", "lightgrey");

        svgMap.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
                .translate(widthMap / 2, heightMap / 2)
                .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / widthMap, (y1 - y0) / heightMap)))
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(event, svgMap.node())
        );
    }

    // Reset function to restore the original view
    function reset() {
        cantons.transition().style("fill", "#D9D9D9");
        svgMap.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(svgMap.node()).invert([widthMap / 2, heightMap / 2])
        );
    }

    // Apply the reset function when clicking outside of cantons
    svgMap.on("click", reset);
}).catch(error => console.error("Error loading map:", error));

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

// Load Data when the page is loaded
document.addEventListener("DOMContentLoaded", function () {
    let selectedCanton = "all";
    let selectedMunicipality = "all";
    let selectedDangerLevels = new Set();
    let fromDate = null;
    let toDate = null;

    /*
    document
        .getElementById("filterButton")
        .addEventListener("click", () => {
            document.getElementById("filterModal").style.display = "block";
        });
    */

    document
        .getElementById("closeFilter")
        .addEventListener("click", () => {
            document.getElementById("filterModal").style.display = "none";
        });

    d3.csv("https://raw.githubusercontent.com/kevinforter/davi_workspace/refs/heads/dev/public/assets/ava36.csv").then((data) => {
        data.forEach((d) => {
            d.date = new Date(d.date);
            d.year = d.date.getFullYear();
            d.buried = Math.max(0, +d.buried);
            d.caught = Math.max(0, +d.caught);
            d.dead = Math.max(0, +d.dead);
        });

        let filteredData = data;

        dataLoaded = true; // Map loaded
        checkDataLoaded();

        const uniqueCantons = [...new Set(data.map((d) => d["canton"]))].sort();
        const uniqueMunicipalities = [
            ...new Set(data.map((d) => d["municipality"])),
        ].sort();
        const uniqueDangerLevels = [
            ...new Set(data.map((d) => d["forecasted.dangerlevel.rating1"])),
        ].sort();

        const cantonFilter = d3.select("#cantonFilter");
        cantonFilter
            .append("option")
            .attr("value", "all")
            .text("All Cantons");

        uniqueCantons.forEach((canton) =>
            cantonFilter
                .append("option")
                .attr("value", canton)
                .text(canton)
        );

        const municipalityFilter = d3.select("#municipalityFilter");
        municipalityFilter
            .append("option")
            .attr("value", "all")
            .text("All Municipalities");

        uniqueMunicipalities.forEach((municipality) =>
            municipalityFilter
                .append("option")
                .attr("value", municipality)
                .text(municipality)
        );

        const dangerLevelContainer = d3.select("#dangerLevelContainer");
        uniqueDangerLevels.forEach((level) => {
            const checkbox = dangerLevelContainer.append("div").append("label");
            checkbox
                .append("input")
                .attr("type", "checkbox")
                .attr("value", level)
                .on("change", function () {
                    if (this.checked) {
                        selectedDangerLevels.add(this.value);
                    } else {
                        selectedDangerLevels.delete(this.value);
                    }
                });

            const levelText = {
                1: "Gering",
                2: "Mässig",
                3: "Erheblich",
                4: "Gross",
                5: "Sehr gross",
            }[+level] || "Empty";

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
                const options = {weekday: 'short', year: 'numeric', month: 'short'};
                const formattedDate = date.toLocaleDateString('de-CH', options);

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
                            .attr("fill", function () {
                                // Check if the dangerLevels array contains 3, 4, or 1
                                if (dangerLevel.includes(3)) {
                                    return "orange"; // Red if dangerLevel array includes 3
                                } else if (dangerLevel.includes(4)) {
                                    return "red"; // Orange if dangerLevel array includes 4
                                } else if (dangerLevel.includes(1)) {
                                    return "#9FFF64"; // Green if dangerLevel array includes 1
                                } else if (dangerLevel.includes(2)) {
                                    return "yellow"; // Green if dangerLevel array includes 2
                                } else if (dangerLevel.includes(5)) {
                                    return "#A11B1B"; // Green if dangerLevel array includes 5
                                } else {
                                    return "grey"; // Default grey if no relevant dangerLevel is present
                                }
                            })
                            .attr("stroke", "black")
                            .attr("stroke-width", 0.5)
                            .on("mouseover", (event) => {
                                tooltip
                                    .style("opacity", 1)
                                    .style("z-index", 100)
                                    .html(`
                                        <strong>Date:</strong> ${formattedDate}<br>
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
        drawPoints(data, projection);

        document.getElementById("applyFilter").addEventListener("click", () => {
            selectedCanton = document.getElementById("cantonFilter").value;
            selectedMunicipality =
                document.getElementById("municipalityFilter").value;
            fromDate = document.getElementById("fromDate").value;
            toDate = document.getElementById("toDate").value;

            filteredData = data.filter((d) => {
                const isCantonMatch =
                    selectedCanton === "all" || d.canton === selectedCanton;
                const isMunicipalityMatch =
                    selectedMunicipality === "all" ||
                    d.municipality === selectedMunicipality;
                const isDangerLevelMatch =
                    selectedDangerLevels.size === 0 ||
                    selectedDangerLevels.has(String(d["forecasted.dangerlevel.rating1"]));
                const isDateMatch =
                    (!fromDate || new Date(d.date) >= new Date(fromDate)) &&
                    (!toDate || new Date(d.date) <= new Date(toDate));
                return (
                    isCantonMatch &&
                    isMunicipalityMatch &&
                    isDangerLevelMatch &&
                    isDateMatch
                );
            });

            drawLineChart(filteredData);
            document.getElementById("filterModal").style.display = "none";
        });

        // Event listener for applying Canton-Filter
        document.getElementById('cantonFilter').addEventListener('change', function () {
            const selectedCanton = this.value;

            // Filter municipalities based on the selected canton
            let filteredMunicipalities;
            if (selectedCanton === 'all') {
                // Show all municipalities if "All Cantons" is selected
                filteredMunicipalities = uniqueMunicipalities;
            } else {
                filteredMunicipalities = data
                    .filter(d => d.canton === selectedCanton)
                    .map(d => d.municipality)
                    .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
                    .sort(); // Sort alphabetically
            }

            // Update the Municipality dropdown
            const municipalityFilter = d3.select("#municipalityFilter");
            municipalityFilter.selectAll("option").remove(); // Clear existing options

            // Add the "all" option
            municipalityFilter.append("option").attr("value", "all").text("All Municipalities");

            // Add filtered municipalities
            filteredMunicipalities.forEach(municipality => {
                municipalityFilter.append("option")
                    .attr("value", municipality)
                    .text(municipality);
            });
        });

        // Draw initial line chart
        drawLineChart(filteredData);

        function drawLineChart(filteredData) {
            d3.select("#lineChart").selectAll("*").remove();
            d3.selectAll("path.area").remove();
            d3.selectAll("path.line").remove();
            d3.selectAll(".title").remove();

            // Group by year and aggregate the data
            const yearlyData = Array.from(
                d3.group(filteredData, d => d.year),
                ([key, values]) => ({
                    year: key,
                    buried: d3.sum(values, v => v.buried),
                    caught: d3.sum(values, v => v.caught),
                    dead: d3.sum(values, v => v.dead)
                })
            );

            const years = yearlyData.map(d => d.year);
            const buried = yearlyData.map(d => ({year: d.year, value: d.buried}));
            const caught = yearlyData.map(d => ({year: d.year, value: d.caught}));
            const dead = yearlyData.map(d => ({year: d.year, value: d.dead}));

            // Smooth the data using cubic spline interpolation
            function smoothData(filteredData) {
                return d3.line()
                    .curve(d3.curveBumpX)
                    .x(d => x(d.year))
                    .y(d => y(d.value))(filteredData);
            }

            // Create SVG container
            const svg = d3.select("#lineChart").append("svg")
                .attr("width", widthLineChart)
                .attr("height", heightLineChart);

            const x = d3.scaleLinear()
                .domain([d3.min(years), d3.max(years)])
                .range([margin.left, widthLineChart - margin.right]);

            const y = d3.scaleLinear()
                .domain([0, d3.max([...buried, ...caught, ...dead], d => d.value)])
                .range([heightLineChart - margin.bottom, margin.top]);

            // Add x-axis
            svg.append("g")
                .attr("transform", `translate(0,${heightLineChart - margin.bottom})`)
                .call(d3.axisBottom(x).tickFormat(d3.format("d")));

            // Add y-axis
            svg.append("g")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(y));

            // Define the area generators
            const areaCaught = d3.area()
                .curve(d3.curveBumpX)
                .x(d => x(d.year))
                .y0(heightLineChart - margin.bottom)
                .y1(d => y(d.value));

            const areaBuried = d3.area()
                .curve(d3.curveBumpX)
                .x(d => x(d.year))
                .y0(heightLineChart - margin.bottom)
                .y1(d => y(d.value));

            const areaDead = d3.area()
                .curve(d3.curveBumpX)
                .x(d => x(d.year))
                .y0(heightLineChart - margin.bottom)
                .y1(d => y(d.value));

            // Add the smoothed lines
            const lineCaught = svg
                .append("path")
                .datum(caught)
                .attr("class", "line caught")
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .attr("opacity", 1)
                .attr("d", smoothData(caught));

            const lineBuried = svg
                .append("path")
                .datum(buried)
                .attr("class", "line buried")
                .attr("fill", "none")
                .attr("stroke", "blue")
                .attr("stroke-width", 2)
                .attr("opacity", 1)
                .attr("d", smoothData(buried));

            const lineDead = svg
                .append("path")
                .datum(dead)
                .attr("class", "line dead")
                .attr("fill", "none")
                .attr("stroke", "#CB9DF0")
                .attr("stroke-width", 2)
                .attr("opacity", 1)
                .attr("d", smoothData(dead));

            // Add animation for the lineCaught
            const caughtLength = lineCaught.node().getTotalLength();
            lineCaught
                .attr("stroke-dasharray", caughtLength)
                .attr("stroke-dashoffset", caughtLength)
                .transition()
                .duration(1500)
                .attr("stroke-dashoffset", 0);

            // Add animation for the lineBuried
            const buriedLength = lineBuried.node().getTotalLength();
            lineBuried
                .attr("stroke-dasharray", buriedLength)
                .attr("stroke-dashoffset", buriedLength)
                .transition()
                .duration(1500)
                .attr("stroke-dashoffset", 0);

            // Add animation for the lineDead
            const deadLength = lineDead.node().getTotalLength();
            lineDead
                .attr("stroke-dasharray", deadLength)
                .attr("stroke-dashoffset", deadLength)
                .transition()
                .duration(1500)
                .attr("stroke-dashoffset", 0);

            // Add the areas for Caught
            svg.append("path")
                .datum(caught)
                .attr("class", "area caught")
                .attr("fill", "transparent")
                .attr("d", areaCaught);

            // Add the areas for Buried
            svg.append("path")
                .datum(buried)
                .attr("class", "area buried")
                .attr("fill", "blue")
                .attr("opacity", 0.0)
                .attr("d", areaBuried);

            // Add the areas for Dead
            svg.append("path")
                .datum(dead)
                .attr("class", "area dead")
                .attr("fill", "#CB9DF0")
                .attr("opacity", 0.0)
                .attr("d", areaDead);

            svg.selectAll(".line, .area")
                .on("mouseover", function () {
                    // Reset all opacities first
                    //d3.selectAll(".line, .area").attr("opacity", 1);

                    // Handle hover on different areas/lines
                    if (d3.select(this).classed("area dead") || d3.select(this).classed("line dead")) {
                        // When hovering over death area/line
                        d3.selectAll(".line.buried")
                            .attr("opacity", 0.05);
                        d3.select(".area.dead")
                            .attr("opacity", 0.25)
                    } else if (d3.select(this).classed("area caught") || d3.select(this).classed("line caught")) {
                        // When hovering over caught area/line
                        d3.selectAll(".line.buried, .line.dead")
                            .attr("opacity", 0.05);
                    } else if (d3.select(this).classed("area buried") || d3.select(this).classed("line buried")) {
                        // When hovering over buried area/line
                        d3.selectAll(".line.dead")
                            .attr("opacity", 0.05);
                        d3.select(".area.buried")
                            .attr("opacity", 0.25)
                    }

                    // Always keep the hovered element at full opacity
                    // d3.select(this).attr("opacity", 1);
                })
                .on("mouseout", function () {
                    // Reset all opacities to full when mouse leaves
                    d3.selectAll(".line").attr("opacity", 1);
                    d3.selectAll(".area").attr("opacity", 0.0);
                });

            // Add legend
            const legend = svg.append("g")
                .attr("transform", `translate(${widthLineChart / 2 - 80},${heightLineChart - 15})`);

            legend.append("circle")
                .attr("cx", 5)
                .attr("cy", 5)
                .attr("r", 5)
                .attr("fill", "black");

            legend.append("text")
                .attr("x", 20)
                .attr("y", 10)
                .text("Caught")
                .style("font-size", "12px");

            legend.append("circle")
                .attr("cx", 85)
                .attr("cy", 5)
                .attr("r", 5)
                .attr("fill", "blue");

            legend.append("text")
                .attr("x", 100)
                .attr("y", 10)
                .text("Buried")
                .style("font-size", "12px");

            legend.append("circle")
                .attr("cx", 165)
                .attr("cy", 5)
                .attr("r", 5)
                .attr("fill", "#CB9DF0");

            legend.append("text")
                .attr("x", 180)
                .attr("y", 10)
                .text("Dead")
                .style("font-size", "12px");
        }

        drawStackedBar(filteredData);
        function drawStackedBar(filteredData) {
            d3.select("#distDangerLevel").selectAll("*").remove();

            // Set the fixed width for the chart
            const widthStackedBar = (document.querySelector("#distActivity").offsetWidth) - 50; // Fixed width of the stacked bar chart
            const heightStackedBar = 75;

            // Define specific colors for each level
            const colorMapping = {
                "1": "#9FFF64", // Green for Level 1
                "2": "#F2FF00", // Yellow for Level 2
                "3": "#FFC31E", // Orange for Level 3
                "4": "#FF0000", // Red for Level 4
                "5": "#8B0000"  // Dark Red for Level 5
            };

            // Create a tooltip div that is hidden by default
            const tooltip = d3.select("body").append("div")
                .style("position", "absolute")
                .style("background", "rgba(0, 0, 0, 0.75)")
                .style("padding", "8px")
                .style("color", "#fff")
                .style("padding", "10px")
                .style("border-radius", "4px")
                .style("pointer-events", "none")
                .style("display", "none");

            // Calculate total caught and group by danger level, ignoring empty or null cells
            const totalCaughtStack = d3.sum(filteredData, d => +d['caught']);
            const dangerLevels = d3.rollup(
                filteredData.filter(d => d['forecasted.dangerlevel.rating1'] && d['forecasted.dangerlevel.rating1'] !== "NULL"),
                v => d3.sum(v, d => +d['caught']),
                d => d['forecasted.dangerlevel.rating1']
            );

            // Ensure dangerLevels has data before continuing
            if (!dangerLevels || dangerLevels.size === 0) {
                console.error("No valid data for forecasted danger levels.");
                return;
            }

            // Calculate the proportional widths for each segment
            const proportionalWidths = Array.from(dangerLevels, ([level, count]) => ({
                level,
                count,
                width: (count / totalCaughtStack) * widthStackedBar // Initial proportional width based on total count
            }));

            // Calculate the total of proportional widths
            const totalProportionalWidth = proportionalWidths.reduce((sum, d) => sum + d.width, 0);

            // Determine the scaling factor to adjust to exactly 1350px
            const scalingFactor = widthStackedBar / totalProportionalWidth;

            // Apply the scaling factor to each segment to maintain proportionality and fit 1350px
            const stackedData = proportionalWidths.map(d => ({
                ...d,
                width: d.width * scalingFactor
            }));

            // Sort the stackedData by the level (convert level to a number for sorting)
            stackedData.sort((a, b) => +a.level - +b.level);

            // Create the stacked bar
            const svgStackedBar = d3.select("#distDangerLevel")
                .append("svg")
                .attr("width", widthStackedBar) // Set SVG width to 1350px
                .attr("height", heightStackedBar)
                .style("border-radius", "8px");

            let xOffset = 0; // Track the x position for each segment

            svgStackedBar.selectAll("rect")
                .data(stackedData)
                .enter()
                .append("rect")
                .attr("class", d => {
                    // Map levels to CSS class names
                    switch (+d.level) {
                        case 1:
                            return "gering"; // Low danger
                        case 2:
                            return "mässig"; // Moderate danger
                        case 3:
                            return "erheblich"; // Considerable danger
                        case 4:
                            return "gross"; // High danger
                        case 5:
                            return "sehrGross"; // Very high danger
                        default:
                            return "empty"; // Default
                    }
                })
                .attr("x", d => {
                    const x = xOffset;
                    xOffset += d.width;
                    return x;
                })
                .attr("y", 0)
                .attr("width", d => d.width)
                .attr("height", heightStackedBar)
                .attr("fill", d => colorMapping[d.level]) // Use color from mapping based on level
                .on("mouseover", function (event, d) {
                    tooltip
                        .style("display", "block")
                        .text(`Level: ${d.level}`);

                    if (d3.select(this).classed("gering")) {
                        // When hovering over death area/line
                        d3.selectAll("rect")
                            .style("opacity", 0.3);
                        d3.select(this)
                            .style("opacity", 1)
                    } else if (d3.select(this).classed("mässig")) {
                        d3.selectAll("rect")
                            .style("opacity", 0.3);
                        d3.select(this)
                            .style("opacity", 1)
                    } else if (d3.select(this).classed("erheblich")) {
                        d3.selectAll("rect")
                            .style("opacity", 0.3);
                        d3.select(this)
                            .style("opacity", 1)
                    } else if (d3.select(this).classed("gross")) {
                        d3.selectAll("rect")
                            .style("opacity", 0.3);
                        d3.select(this)
                            .style("opacity", 1)
                    } else if (d3.select(this).classed("sehr gross")) {
                        d3.selectAll("rect")
                            .style("opacity", 0.3);
                        d3.select(this)
                            .style("opacity", 1)
                    }
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("top", (event.pageY - 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function () {
                    tooltip
                        .style("display", "none");

                    d3.selectAll("rect").style("opacity", 1);
                });
        }

        drawPieChart(filteredData);
        function drawPieChart(filteredData) {
            d3.selectAll("path.pie").remove();
            d3.selectAll("text.text").remove();
            d3.selectAll("#distBuried > svg").remove();
            d3.selectAll("#distDead > svg").remove();

            // Second Pie Chart (Percentage Fully Buried)
            var width2 = 250;
            var height2 = 250;
            var margin2 = 45;
            var radius2 = Math.min(width2, height2) / 2 - margin2;

            var svg2 = d3.select("#distBuried")
                .append("svg")
                .attr("width", width2)
                .attr("height", height2)
                .append("g")
                .attr("transform", "translate(" + width2 / 2 + "," + height2 / 2 + ")");

            var svg1 = d3.select("#distDead")
                .append("svg")
                .attr("width", width2)
                .attr("height", height2)
                .append("g")
                .attr("transform", "translate(" + width2 / 2 + "," + height2 / 2 + ")");

            var totalCaught = d3.sum(filteredData, function (d) { return +d['caught']; });
            var fullyBuried = d3.sum(filteredData, function (d) { return +d['buried']; });
            var percentageBuried = (fullyBuried / totalCaught) * 100;
            var totalDead = d3.sum(filteredData, function (d) { return +d['dead']; });
            var percentageDead = (totalDead / totalCaught) * 100;

            var pieData2 = { "Fully Buried": percentageBuried, "Not Buried": 100 - percentageBuried };
            var pieData1 = { "Dead": percentageDead, "Not Dead": 100 - percentageDead };

            var color2 = d3.scaleOrdinal()
                .domain(Object.keys(pieData2))
                .range(["#336BFF", "#ffffff"]);

            var color1 = d3.scaleOrdinal()
                .domain(Object.keys(pieData1))
                .range(["#336BFF", "#ffffff"]);

            var pie2 = d3.pie().value(function (d) { return d[1]; });
            var data_ready2 = pie2(Object.entries(pieData2));

            var pie1 = d3.pie().value(function (d) { return d[1]; });
            var data_ready1 = pie1(Object.entries(pieData1));

            var arc = d3.arc().innerRadius(115).outerRadius(radius2);

            svg2.selectAll('whatever')
                .data(data_ready2)
                .enter()
                .append('path')
                .attr('d', arc)
                .attr('fill', function (d) { return color2(d.data[0]); })
                .attr("stroke", "black")
                .attr("class", "pie")
                .style("stroke-width", "2px")
                .style("opacity", 0.7);

            svg2.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "0.4em")
                .attr("class", "text")
                .style("font-size", "38px")
                .style("font-weight", "bold")
                .style("fill", "#336BFF")
                .text(percentageBuried.toFixed(2) + "%");

            svg1.selectAll('whatever')
                .data(data_ready1)
                .enter()
                .append('path')
                .attr('d', arc)
                .attr('fill', function (d) { return color1(d.data[0]); })
                .attr("stroke", "black")
                .attr("class", "pie")
                .style("stroke-width", "2px")
                .style("opacity", 0.7)

            svg1.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "0.4em")
                .attr("class", "text")
                .style("font-size", "38px")
                .style("font-weight", "bold")
                .style("fill", "#336BFF")
                .text(percentageDead.toFixed(2) + "%");
        }

        writeCaught(filteredData);
        function writeCaught(filteredData) {

            var totalCaught = d3.sum(filteredData, function (d) {
                return +d['caught'];
            });

            // Display totalCaught in the element with id="total_caught"
            d3.select("#caught").text(totalCaught)
                .style("font-weight", "bold")
                .style("font-size", "8em");
        }

        // Event listener for applying filters
        document.getElementById('applyFilter').addEventListener('click', () => {
            selectedCanton = document.getElementById('cantonFilter').value;
            selectedMunicipality = document.getElementById('municipalityFilter').value;
            fromDate = document.getElementById('fromDate').value;
            toDate = document.getElementById('toDate').value;

            drawPoints(filteredData);
            writeCaught(filteredData);
            drawStackedBar(filteredData);
            drawPieChart(filteredData);
            document.getElementById('filterModal').style.display = 'none';
        });
    }).catch(error => console.error("Error loading data:", error));
});