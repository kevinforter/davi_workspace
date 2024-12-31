let filteredData;
let selectedCanton;
let selectedMunicipality;
let selectedDangerLevels;
let fromDate;
let toDate;

// Responsive Dimensions
const container = d3.select("#map").node().getBoundingClientRect();
const width = container.width;
const height = container.height;

// Set up the map projection centered on Switzerland
const projection = d3.geoMercator()
    .center([8.3, 46.8])
    .scale(Math.min(width, height) * 17) // Adjust scale dynamically
    .translate([width / 2, height / 2]);

const svgMap = d3.select("#map").append("svg")
    .attr("width", "100%") // Breite dynamisch
    .attr("height", height) // Fixierte Höhe
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("id", "swissMap");


// Create a zoom behavior and attach it to the SVG
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

svgMap.call(zoom);

// Append a group for the map shapes
const g = svgMap.append("g");
const gridGroup = svgMap.append("g");
const pointsGroup = svgMap.append("g"); // New group for points

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

document.addEventListener("DOMContentLoaded", function () {
    selectedCanton = "all";
    selectedMunicipality = "all";
    selectedDangerLevels = new Set();
    fromDate = null;
    toDate = null;

    drawfilterButton()

    function drawfilterButton() {
        // Select Map and add div
        const divButton = d3.select("#map")
            .append("div")
            .attr("id", "filterButtonDiv");

        // Select the div and append the SVG element
        const svgButton = d3.select("#filterButtonDiv")
            .append("svg")
            .attr("width", "24px")
            .attr("height", "24px")
            .attr("viewBox", "0 0 24 24")
            .attr("fill", "none")
            .attr("xmlns", "http://www.w3.org/2000/svg");

        // Append the path element with the desired attributes
        svgButton.append("path")
            .attr("d", "M21 6H19M21 12H16M21 18H16M7 20V13.5612C7 13.3532 7 13.2492 6.97958 13.1497C6.96147 13.0615 6.93151 12.9761 6.89052 12.8958C6.84431 12.8054 6.77934 12.7242 6.64939 12.5617L3.35061 8.43826C3.22066 8.27583 3.15569 8.19461 3.10948 8.10417C3.06849 8.02393 3.03853 7.93852 3.02042 7.85026C3 7.75078 3 7.64677 3 7.43875V5.6C3 5.03995 3 4.75992 3.10899 4.54601C3.20487 4.35785 3.35785 4.20487 3.54601 4.10899C3.75992 4 4.03995 4 4.6 4H13.4C13.9601 4 14.2401 4 14.454 4.10899C14.6422 4.20487 14.7951 4.35785 14.891 4.54601C15 4.75992 15 5.03995 15 5.6V7.43875C15 7.64677 15 7.75078 14.9796 7.85026C14.9615 7.93852 14.9315 8.02393 14.8905 8.10417C14.8443 8.19461 14.7793 8.27583 14.6494 8.43826L11.3506 12.5617C11.2207 12.7242 11.1557 12.8054 11.1095 12.8958C11.0685 12.9761 11.0385 13.0615 11.0204 13.1497C11 13.2492 11 13.3532 11 13.5612V17L7 20Z")
            .attr("stroke", "#000000")
            .attr("stroke-width", "1.5")
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round");

        // Add an onclick function
        d3.select("#filterButtonDiv").on("click", function () {
            console.log("Filter button clicked!");
            funFilter(); // Call your custom filter function here
        });
    }

    document
        .getElementById("closeFilter")
        .addEventListener("click", () => {
            console.log("Filter closed!");
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

        dataLoaded = true; // Map loaded
        checkDataLoaded();

        filteredData = data;

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

        const uniqueActivities = [...new Set(data.map((d) => d["activity"]))].sort();
        const activityFilter = d3.select("#activityFilter");
        uniqueActivities.forEach((activity) =>
            activityFilter.append("option").attr("value", activity).text(activity)
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

        document.getElementById("applyFilter").addEventListener("click", () => {
            selectedCanton = document.getElementById("cantonFilter").value;
            selectedMunicipality = document.getElementById("municipalityFilter").value;
            selectedActivity = document.getElementById("activityFilter").value;
            fromDate = document.getElementById("fromDate").value;
            toDate = document.getElementById("toDate").value;

            filteredData = data.filter((d) => {
                const isCantonMatch = selectedCanton === "all" || d.canton === selectedCanton;
                const isMunicipalityMatch =
                    selectedMunicipality === "all" || d.municipality === selectedMunicipality;
                const isActivityMatch = selectedActivity === "all" || d.activity === selectedActivity;
                const isDangerLevelMatch =
                    selectedDangerLevels.size === 0 ||
                    selectedDangerLevels.has(String(d["forecasted.dangerlevel.rating1"]));
                const isDateMatch =
                    (!fromDate || new Date(d.date) >= new Date(fromDate)) &&
                    (!toDate || new Date(d.date) <= new Date(toDate));
                return (
                    isCantonMatch &&
                    isMunicipalityMatch &&
                    isActivityMatch &&
                    isDangerLevelMatch &&
                    isDateMatch
                );
            });

            drawLineChart(filteredData);
            document.getElementById("filterModal").style.display = "none";
        });

        drawStackedBar(filteredData);
        drawChart(filteredData);
        drawList(filteredData);
        writeCaught(filteredData);
        drawPieChart(filteredData);
        drawLineChart(filteredData);
        drawPoints(filteredData, projection);
        drawMap();

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
            drawChart(filteredData);
            drawList(filteredData);
            document.getElementById('filterModal').style.display = 'none';
        });

        document.getElementById("removeFilter").addEventListener("click", () => {
            // Setze alle Filter-Inputs auf ihren Standardwert zurück
            document.getElementById("cantonFilter").value = "all";
            document.getElementById("municipalityFilter").value = "all";
            document.getElementById("activityFilter").value = "all";
            document.getElementById("fromDate").value = "";
            document.getElementById("toDate").value = "";

            // Leere die gesetzten Filtervariablen
            selectedCanton = "all";
            selectedMunicipality = "all";
            selectedActivity = "all";
            fromDate = "";
            toDate = "";
            selectedDangerLevels.clear(); // Leert die gesetzten Gefahrstufen

            // Setze gefilterte Daten auf die Originaldaten zurück
            filteredData = data;

            // Checkboxen im dangerLevelContainer zurücksetzen
            const checkboxes = document.querySelectorAll("#dangerLevelContainer input[type='checkbox']");
            checkboxes.forEach((checkbox) => {
                checkbox.checked = false; // Uncheck all checkboxes
            });

            // Aktualisiere die Municipality-Optionen
            updateMunicipalityOptions();

            console.log("Filter und Checkboxen zurückgesetzt, Diagramme neu gezeichnet.");
        });

        // Funktion zum Aktualisieren der Municipality-Optionen
        function updateMunicipalityOptions() {
            const uniqueMunicipalities = [...new Set(data.map((d) => d.municipality))].sort();

            // Entferne alte Optionen
            const municipalityFilter = document.getElementById("municipalityFilter");
            municipalityFilter.innerHTML = "";

            // Füge die "all"-Option hinzu
            const allOption = document.createElement("option");
            allOption.value = "all";
            allOption.textContent = "All Municipalities";
            municipalityFilter.appendChild(allOption);

            // Füge die gefilterten Municipalities hinzu
            uniqueMunicipalities.forEach((municipality) => {
                const option = document.createElement("option");
                option.value = municipality;
                option.textContent = municipality;
                municipalityFilter.appendChild(option);
            });

            console.log("Municipality-Optionen zurückgesetzt.");
        }

        window.addEventListener("resize", () => {
            drawfilterButton();
            drawStackedBar(filteredData); // Neuzeichnen des Diagramms
            drawChart(filteredData);
            drawList(filteredData);
            writeCaught(filteredData);
            drawPieChart(filteredData);
            drawLineChart(filteredData);
            drawPoints(filteredData, projection);
            drawMap();
        });
    })
})