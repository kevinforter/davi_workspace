/*-----------------------Client Side Stuff---------------------------*/
let driverExe = 0;

function funFilter() {
    document.getElementById("filterModal").style.display = "block";
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });

        setTimeout(() => {
            if(driverExe < 1) {
                driverObj.drive();
                driverExe++;
            }
        }, 750);
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar_content');
    const sections = document.querySelectorAll('.section_content');

    let observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.target.id === 'section1' && entry.isIntersecting) {
                sidebar.classList.add('hidden');
            } else if (entry.target.id !== 'section1' && entry.isIntersecting) {
                sidebar.classList.remove('hidden');
            }
        });
    }, {
        root: null, // observing in relation to the viewport
        rootMargin: '0px',
        threshold: 0.5 // trigger when 50% of the section is visible
    });

    sections.forEach(section => {
        observer.observe(section); // Observe each section
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.nav_sidebar a');
    const sections = document.querySelectorAll('.section_content');

    let observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                let activeIndex = Array.from(sections).indexOf(entry.target);
                console.log(activeIndex);
                updateNavLinks(activeIndex);
            }
        });
    }, {
        root: null, // observing in relation to the viewport
        rootMargin: '0px',
        threshold: 0.5 // trigger when 50% of the section is visible
    });

    sections.forEach(section => {
        observer.observe(section); // Observe each section
    });

    function updateNavLinks(activeIndex) {
        navLinks.forEach((link, index) => {
            link.style.color = (index === activeIndex) ? 'white' : '#818181';
        });
    }
});

function funNav() {
    const gridContainer = document.getElementById("grid_container");
    const collapsible = document.getElementById("collapsible");
    const main = document.getElementById("main");

    document.getElementById("section2").scrollIntoView({behavior: "smooth"});
    gridContainer.classList.toggle("collapse");
    collapsible.classList.toggle("rotate");

    setTimeout(() => {
        main.classList.toggle("stop-scrolling");
    }, 750);
}

function showImage(imgElement) {
    const overlay = document.getElementById("imageOverlay");
    const fullImage = document.getElementById("fullImage");
    fullImage.src = imgElement.src; // Set full image source to a clicked image source
    overlay.style.display = "flex"; // Show the overlay
}

document.getElementById("closeBtn").onclick = function () {
    document.getElementById("imageOverlay").style.display = "none"; // Hide the overlay
};

const driver = window.driver.js.driver;

const driverObj = driver({
    showProgress: true,
    steps: [
        {
            popover: { title: "Let's start the tour", description: 'Go ahead and start the tour for our DAVI project 🚀.' }
        },
        {
            element: '.cell:nth-child(1)',
            popover: {title: 'Map', description: 'Every dot represents a accident.', side: "bottom", align: 'start'}
        },
        {
            element: '.cell:nth-child(3)',
            popover: {
                title: 'Time chart',
                description: 'The data is smoothed for better visibility.',
                side: "bottom",
                align: 'start'
            }
        },
        {
            element: '.cell:nth-child(2)',
            popover: {
                title: 'Distribution charts',
                description: 'Shows some distribution charts.',
                side: "bottom",
                align: 'start'
            }
        },
        {
            element: '.cell-charts:nth-child(1)',
            popover: {
                title: 'Total caught people',
                description: 'Shows all caught people in the shown accidents on the map.',
                side: "bottom",
                align: 'start'
            }
        },
        {
            element: '.cell-charts:nth-child(2)',
            popover: {
                title: 'Buried people in percentage',
                description: 'Shows the buried people of the caught people in percent.',
                side: "bottom",
                align: 'start'
            }
        },
        {
            element: '.cell-charts:nth-child(3)',
            popover: {
                title: 'Dead people in percentage',
                description: 'Shows the dead people of the caught people in percent.',
                side: "bottom",
                align: 'start'
            }
        },
        {
            element: '.cell-charts:nth-child(4)',
            popover: {
                title: 'Danger level distribution',
                description: 'Shows the distribution of danger level of the shown accidents.',
                side: "bottom",
                align: 'start'
            }
        },
        {
            element: '.cell-cell-charts:nth-child(1)',
            popover: {
                title: 'Activity distribution',
                description: 'Shows the distribution of activity of the shown accidents.',
                side: "bottom",
                align: 'start'
            }
        },
        {
            element: '.cell-cell-charts:nth-child(2)',
            popover: {
                title: 'Top municipalities',
                description: 'Shows the municipalities with the most caught people on the selected filter.',
                side: "bottom",
                align: 'start'
            }
        },
        {
            element: '#divToggle',
            popover: {
                title: 'Toggle',
                description: 'Toggle between single municipalities or the total of municipalities.',
                side: "bottom",
                align: 'start'
            }
        },
        {
            element: '#filterButtonDiv',
            popover: {
                title: 'Filter',
                description: 'Filter button to filter the dataset.',
                side: "bottom",
                align: 'start'
            }
        },
        {
            element: '.collapsible',
            popover: {
                title: 'Collapsible',
                description: 'To make the nav bar collaps in',
                side: "bottom",
                align: 'start'
            }
        }
    ]
});

/*-----------------------LOAD SVGs---------------------------*/
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

/*-----------------------MAP---------------------------*/
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

/*-----------------------POINTS---------------------------*/
// Function to draw points on the map
function drawPoints(data) {
    // Entferne vorhandene Punkte mit einer Transition
    pointsGroup.selectAll("circle")
        .transition()
        .duration(250)
        .attr("r", 0)
        .remove();

    data.forEach(row => {
        const latitude = parseFloat(row['start.zone.coordinates.latitude']);
        const longitude = parseFloat(row['start.zone.coordinates.longitude']);
        const date = row['date'];
        const canton = row['canton'];
        const municipality = row['municipality'];
        const dangerLevel = row['forecasted.dangerlevel.rating1'];
        const caught = row['caught'];
        const buried = row['buried'];
        const dead = row['dead'];
        const activity = row['activity'];

        // Convert the date to a JavaScript Date object for filtering
        const rowDate = new Date(date);
        const options = { weekday: 'short', year: 'numeric', month: 'short' };
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
                    .attr("r", 0) // Start radius for animation
                    .attr("fill", function () {
                        // Check dangerLevel for appropriate color
                        if (dangerLevel.includes(3)) {
                            return "orange";
                        } else if (dangerLevel.includes(4)) {
                            return "red";
                        } else if (dangerLevel.includes(1)) {
                            return "#9FFF64";
                        } else if (dangerLevel.includes(2)) {
                            return "yellow";
                        } else if (dangerLevel.includes(5)) {
                            return "#A11B1B";
                        } else {
                            return "grey";
                        }
                    })
                    .attr("stroke", "black")
                    .attr("stroke-width", 0.25)
                    .transition()
                    .duration(250)
                    .attr("r", 2) // Final radius after animation
                    .on("end", function () {
                        // Add event listeners after the animation ends
                        d3.select(this)
                            .on("mouseover", (event) => {
                                tooltip
                                    .style("opacity", 1)
                                    .style("z-index", 100)
                                    .html(`
                                        <strong>Date:</strong> ${formattedDate}<br>
                                        <strong>Canton:</strong> ${canton}<br>
                                        <strong>Municipality:</strong> ${municipality}<br>
                                        <strong>Coordinates:</strong> [${latitude}, ${longitude}]<br>
                                        <strong>Danger Level:</strong> ${dangerLevel}<br>
                                        <strong>Caught:</strong> ${caught}
                                        <strong>Buried:</strong> ${buried} 
                                        <strong>Dead:</strong> ${dead}<br>
                                        <strong>Activity:</strong> ${activity}
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
                    });
            }
        }
    });
}

/*-----------------------NUMBER---------------------------*/
function writeCaught(filteredData) {
    d3.selectAll("#caught > .smallTitle").remove();

    var totalCaught = d3.sum(filteredData, function (d) {
        return +d['caught'];
    });

    // Display totalCaught in the element with id="total_caught"
    d3.select("#caught")
        .text(totalCaught)
        .style("font-weight", "bold")
        .style("color", "#1B5C85");

    d3.select("#caught").append("div")
        .text("Total Caught People")
        .attr("class", "smallTitle")
        .style("position", "absolute")
        .style("width", "100%")
        .style("height", "fit-content")
        .style("top", "10px")
        .style("left", "10px")
        .style("font-weight", "initial")
        .style("color", "#d1d1d1");
}

/*-----------------------PIECHART---------------------------*/
function checkBuriedLoaded() {
    if (buriedLoaded) {
        /*document.getElementById('charts-loader').style.display = 'none';*/
        document.getElementById('buried-loader').style.display = 'none';
    }
}

function checkDeadLoaded() {
    if (deadLoaded) {
        /*document.getElementById('charts-loader').style.display = 'none';*/
        document.getElementById('dead-loader').style.display = 'none';
    }
}


function drawPieChart(filteredData) {
    const tooltip = d3.select("body").selectAll(".tooltip").data([1]).join("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.75)")
        .style("padding", "8px")
        .style("color", "#fff")
        .style("padding", "10px")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("display", "none");

    const chartDiv = document.getElementById("distDead");
    const {width: divWidth, height: divHeight} = chartDiv.getBoundingClientRect();

    const margin = Math.min(divWidth, divHeight) * 0.1;
    const width = divWidth;
    const height = divHeight;
    const radius = Math.min(width, height) / 2 - margin;

    const arc = d3.arc().innerRadius(45).outerRadius(radius);

    const totalCaught = d3.sum(filteredData, d => +d['caught']);
    const fullyBuried = d3.sum(filteredData, d => +d['buried']);
    const percentageBuried = (fullyBuried / totalCaught) * 100;

    const totalDead = d3.sum(filteredData, d => +d['dead']);
    const percentageDead = (totalDead / totalCaught) * 100;

    buriedLoaded = true;
    deadLoaded = true;
    checkBuriedLoaded();
    checkDeadLoaded();

    function drawChartPie(containerId, percentage, label, totalValue) {

        const svgPie = d3.select(containerId).selectAll("svg").data([1]).join("svg")
            .attr("width", width)
            .attr("height", height);

        const group = svgPie.selectAll("g").data([1]).join("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        group.selectAll(".background-circle").data([1]).join("path")
            .attr("class", "background-circle")
            .attr("d", arc({startAngle: 0, endAngle: 2 * Math.PI}))
            .attr("fill", "#ffffff")
            .style("opacity", 0.7);

        const blueData = [{startAngle: 0, endAngle: (percentage / 100) * 2 * Math.PI}];

        group.selectAll(".slice").data(blueData).join(
            enter => enter.append("path")
                .attr("class", "slice")
                .attr("fill", "#1B5C85")
                .attr("d", arc({startAngle: 0, endAngle: 0}))
                .transition()
                .duration(750)
                .attrTween("d", function (d) {
                    const interpolate = d3.interpolate({startAngle: 0, endAngle: 0}, d);
                    return t => arc(interpolate(t));
                }),
            update => update.transition()
                .duration(750)
                .attrTween("d", function (d) {
                    const interpolate = d3.interpolate(this._current || {startAngle: 0, endAngle: 0}, d);
                    this._current = interpolate(1); // Speichere den aktuellen Zustand
                    return t => arc(interpolate(t));
                })
        );

        group.selectAll(".percentage-text").data([1]).join("text")
            .attr("class", "percentage-text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.4em")
            .style("font-weight", "bold")
            .style("fill", "#1B5C85")
            .transition()
            .duration(750)
            .tween("text", function () {
                const interpolate = d3.interpolate(+this.textContent.replace('%', '') || 0, percentage);
                return t => d3.select(this).text(`${interpolate(t).toFixed(2)}%`);
            });

        svgPie.on("mouseover", function () {
            tooltip.style("display", "block").text(`Total: ${totalValue}`);
        }).on("mousemove", function (event) {
            tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
        }).on("mouseout", function () {
            tooltip.style("display", "none");
        });
    }

    d3.select("#distBuried").append("div")
        .text("Buried %")
        .attr("class", "smallTitle")
        .style("position", "absolute")
        .style("width", "100%")
        .style("height", "fit-content")
        .style("top", "10px")
        .style("left", "10px")
        .style("color", "#d1d1d1");

    d3.select("#distDead").append("div")
        .text("Dead %")
        .attr("class", "smallTitle")
        .style("position", "absolute")
        .style("width", "100%")
        .style("height", "fit-content")
        .style("top", "10px")
        .style("left", "10px")
        .style("color", "#d1d1d1");

    drawChartPie("#distBuried", percentageBuried, "Fully Buried", fullyBuried);
    drawChartPie("#distDead", percentageDead, "Dead", totalDead);
}

/*-----------------------STACKEDBARCHART---------------------------*/
function drawStackedBar(filteredData) {
    d3.select("#distDangerLevel").selectAll("*").remove();
    d3.selectAll("#distDangerLevel > .smallTitle").remove();

    const widthStackedBar = (document.querySelector("#distDangerLevel").offsetWidth) - 30;
    const heightStackedBar = (document.querySelector("#distDangerLevel").offsetHeight) * 0.5;

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
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("display", "none");

    const totalCaughtStack = d3.sum(filteredData, d => +d['caught']);
    const dangerLevels = d3.rollup(
        filteredData.filter(d => d['forecasted.dangerlevel.rating1'] && d['forecasted.dangerlevel.rating1'] !== "NULL"),
        v => d3.sum(v, d => +d['caught']),
        d => d['forecasted.dangerlevel.rating1']
    );

    if (!dangerLevels || dangerLevels.size === 0) {
        console.error("No valid data for forecasted danger levels.");
        return;
    }

    const proportionalWidths = Array.from(dangerLevels, ([level, count]) => ({
        level,
        count,
        width: (count / totalCaughtStack) * widthStackedBar
    }));

    const totalProportionalWidth = proportionalWidths.reduce((sum, d) => sum + d.width, 0);
    const scalingFactor = widthStackedBar / totalProportionalWidth;

    const stackedData = proportionalWidths.map(d => ({
        ...d,
        width: d.width * scalingFactor
    }));

    stackedData.sort((a, b) => +a.level - +b.level);

    const svgStackedBar = d3.select("#distDangerLevel")
        .append("svg")
        .attr("width", widthStackedBar)
        .attr("height", heightStackedBar)
        .style("border-radius", "8px");

    let xOffset = 0;

    svgStackedBar.selectAll("rect")
        .data(stackedData)
        .enter()
        .append("rect")
        .attr("class", d => {
            switch (+d.level) {
                case 1: return "gering";
                case 2: return "mässig";
                case 3: return "erheblich";
                case 4: return "gross";
                case 5: return "sehrGross";
                default: return "empty";
            }
        })
        .attr("x", d => {
            const x = xOffset;
            xOffset += d.width;
            return x;
        })
        .attr("y", 0)
        .attr("width", 0) // Start with width 0 for animation
        .attr("height", heightStackedBar)
        .attr("fill", d => colorMapping[d.level])
        .on("mouseover", function (event, d) {
            const tempFilteredData = filteredData.filter(
                item => item['forecasted.dangerlevel.rating1'] === d.level
            );

            drawPoints(tempFilteredData);

            tooltip
                .style("display", "block")
                .html(
                    `Level: ${{
                        1: "Gering",
                        2: "Mässig",
                        3: "Erheblich",
                        4: "Gross",
                        5: "Sehr gross",
                    }[+d.level]} - ${(d.count / totalCaughtStack * 100).toFixed(2)}%`
                );

            d3.selectAll("#distDangerLevel rect")
                .transition()
                .duration(300)
                .style("opacity", 0.3);
            d3.select(this)
                .transition()
                .duration(300)
                .style("opacity", 1);
        })
        .on("mousemove", function (event) {
            const mouseX = event.pageX;
            const mouseY = event.pageY;
            const tooltipWidth = tooltip.node().offsetWidth;
            const screenWidth = window.innerWidth;

            if (mouseX + tooltipWidth > screenWidth) {
                tooltip
                    .style("top", (mouseY - 10) + "px")
                    .style("left", (mouseX - tooltipWidth - 10) + "px");
            } else {
                tooltip
                    .style("top", (mouseY - 10) + "px")
                    .style("left", (mouseX + 10) + "px");
            }
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");

            drawPoints(filteredData);

            d3.selectAll("#distDangerLevel rect")
                .transition()
                .duration(300)
                .style("opacity", 1);
        })
        .transition()
        .duration(750) // Animation duration for width
        .attr("width", d => d.width); // Animate to final width

    d3.select("#distDangerLevel").append("div")
        .text("Danger Level Distribution")
        .attr("class", "smallTitle")
        .style("position", "absolute")
        .style("width", "100%")
        .style("height", "fit-content")
        .style("top", "10px")
        .style("left", "10px")
        .style("color", "#d1d1d1");
}

/*-----------------------BARCHART---------------------------*/
function checkActivityLoaded() {
    if (activityLoaded) {
        /*document.getElementById('charts-loader').style.display = 'none';*/
        document.getElementById('activity-loader').style.display = 'none';
    }
}

function drawChart(filteredData) {
    d3.selectAll("#distActivity > .smallTitle").remove();

    // Initialisiere die Größe und Ränder
    let widthBarChart = document.querySelector("#distActivity").offsetWidth;
    let heightBarChart = document.querySelector("#distActivity").offsetHeight;

    let leftMargin = 30;
    let rightMargin = 15;
    let bottomMargin = 20;
    let topMargin = 50;

    // Tooltip initialisieren
    const tooltip = d3.select("body").selectAll(".tooltip").data([1]).join("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.75)")
        .style("padding", "8px")
        .style("color", "#fff")
        .style("padding", "10px")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("display", "none");

    // Aktivitätsdaten vorbereiten
    const activityCounts = {
        offpiste: 0,
        transportation: 0,
        tour: 0,
        building: 0,
    };

    filteredData.forEach((entry) => {
        const activity = entry.activity;
        const activities = activity.split(',').map(act => act.trim());
        activities.forEach((act) => {
            if (act === 'transportation.corridor') {
                activityCounts.transportation += 1;
            } else if (activityCounts[act] !== undefined) {
                activityCounts[act] += 1;
            }
        });
    });

    let dataObj = {
        Offpiste: activityCounts.offpiste,
        Transportation: activityCounts.transportation,
        Tour: activityCounts.tour,
        Building: activityCounts.building,
    };

    // SVG erstellen oder aktualisieren
    let svgBar = d3.select("#distActivity").selectAll("svg").data([1]).join("svg")
        .attr("width", widthBarChart)
        .attr("height", heightBarChart);

    let innerWidth = widthBarChart - leftMargin - rightMargin;
    let innerHeight = heightBarChart - topMargin - bottomMargin;

    // Skalen
    let xscale = d3.scaleBand()
        .domain(Object.keys(dataObj))
        .range([0, innerWidth])
        .padding(0.4);

    let yscale = d3.scaleLinear()
        .domain([0, Math.max(...Object.values(dataObj))])
        .range([innerHeight, 0]);

    // Achsen
    svgBar.selectAll(".x-axis").data([1]).join("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(${leftMargin}, ${topMargin + innerHeight})`)
        .call(d3.axisBottom(xscale));

    svgBar.selectAll(".y-axis").data([1]).join("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${leftMargin}, ${topMargin})`)
        .call(d3.axisLeft(yscale));

    // Balken zeichnen oder aktualisieren
    const bars = svgBar.selectAll(".bar")
        .data(Object.entries(dataObj), d => d[0]); // Schlüssel für Datenbindung

    bars.join(
        enter => enter.append("rect")
            .attr("class", "bar")
            .attr("x", ([key]) => xscale(key) + leftMargin)
            .attr("y", innerHeight + topMargin)
            .attr("height", 0)
            .attr("width", xscale.bandwidth())
            .attr("fill", "#1B5C85")
            .attr("rx", 6)
            .attr("ry", 6)
            .transition()
            .duration(750)
            .attr("y", ([key, value]) => yscale(value) + topMargin)
            .attr("height", ([key, value]) => innerHeight - yscale(value)),
        update => update.transition()
            .duration(750)
            .attr("x", ([key]) => xscale(key) + leftMargin)
            .attr("y", ([key, value]) => yscale(value) + topMargin)
            .attr("height", ([key, value]) => innerHeight - yscale(value)),
        exit => exit.transition()
            .duration(750)
            .attr("height", 0)
            .attr("y", innerHeight + topMargin)
            .remove()
    );

    // Hover-Interaktionen hinzufügen
    svgBar.selectAll(".bar")
        .on("mouseover", function (event, [key, value]) {
            console.log(`Hovered over activity: ${key}, Total: ${value}`);

            // Beispiel: Dynamisches Filtern und Aktualisieren anderer Diagramme
            const tempFilteredData = filteredData.filter(
                d => d.activity.includes(key.toLowerCase()) // Filtere basierend auf der Aktivität
            );

            drawPoints(tempFilteredData); // Aktualisiere die Karte

            tooltip
                .style("display", "block")
                .html(`Activity: ${key}<br>Total: ${value}`);

            d3.selectAll("#distActivity rect")
                .transition()
                .duration(300)
                .style("opacity", 0.3); // Reduziere die Transparenz anderer Balken
            d3.select(this)
                .transition()
                .duration(300)
                .style("opacity", 1); // Markiere den aktuellen Balken
        })
        .on("mousemove", function (event) {
            tooltip
                .style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            console.log(`Mouse left activity bar: ${d3.select(this).datum()[0]}`);

            tooltip.style("display", "none");

            // Setze Diagramme zurück
            drawPoints(filteredData);

            d3.selectAll("#distActivity rect")
                .transition()
                .duration(300)
                .style("opacity", 1); // Setze Transparenz zurück
        });

    activityLoaded = true;
    checkActivityLoaded();

    d3.select("#distActivity").append("div")
        .text("Activity Distribution")
        .attr("class", "smallTitle")
        .style("position", "absolute")
        .style("width", "100%")
        .style("height", "fit-content")
        .style("top", "10px")
        .style("left", "10px")
        .style("color", "#d1d1d1");
}

/*-----------------------TREEMAP---------------------------*/
function checkTopLoaded() {
    if (topLoaded) {
        /*document.getElementById('charts-loader').style.display = 'none';*/
        document.getElementById('topChart-loader').style.display = 'none';
    }
}

// Global variable to track checkbox state
let showTop5 = false;

// Add checkbox dynamically (only once)
d3.select("#topChart")
    .append("div")
    .attr("id", "divToggle")
    .style("position", "absolute")
    .style("top", "10px")
    .style("right", "10px")
    .style("z-index", "1") // Ensure it's above other elements
    .html('<label class="smallTitle" for="toggleTop5" style="color: #d1d1d1;">Total </label>')
    .append("input")
    .attr("type", "checkbox")
    .attr("id", "toggleTop5")
    .on("change", function () {
        showTop5 = this.checked; // Update showTop5 based on checkbox state
        console.log("Checkbox is now:", showTop5 ? "Checked" : "Unchecked");
        drawList(filteredData); // Redraw the treemap with the updated state
    });

function drawList(filteredData) {
    d3.selectAll("#topChart > ul").remove();
    d3.selectAll("#topChart > .smallTitle").remove();
    d3.selectAll("#topChart > svg").remove();

    // Prepare data for treemap
    const totalCaughtPerMunicipality = d3.rollups(
        filteredData,
        v => d3.sum(v, d => d.caught), // Sum 'caught' for each municipality
        d => d.municipality // Group by municipality
    );

    let top5;
    if (showTop5) {
        top5 = totalCaughtPerMunicipality
            .sort((a, b) => b[1] - a[1]) // Sort by total caught
            .slice(0, 5); // Get top 5
    } else {
        // Create a sorted copy of filteredData to show the top 5
        const sortedData = [...filteredData]
            .sort((a, b) => b.caught - a.caught); // Sort by 'caught' descending

        // Aggregate the top 5 municipalities' caught totals
        const aggregatedTop5 = d3.rollups(
            sortedData.slice(0, 5), // Take only the top 5 entries
            v => d3.sum(v, d => d.caught), // Sum their caught values
            d => d.municipality // Group by municipality
        );

        top5 = aggregatedTop5;
    }

    const hierarchyData = {
        name: "root",
        children: top5.map(d => ({ name: d[0], value: d[1] }))
    };

    const marginTree = { top: 50, right: 20, bottom: 10, left: 10 };
    const widthTree = document.querySelector("#topChart").offsetWidth - marginTree.right;
    const heightTree = document.querySelector("#topChart").offsetHeight - marginTree.top;

    const svg = d3.select("#topChart")
        .append("svg")
        .style("margin-bottom", marginTree.bottom)
        .attr("width", widthTree)
        .attr("height", heightTree);

    const root = d3.hierarchy(hierarchyData)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    const treemapLayout = d3.treemap()
        .size([widthTree, heightTree])
        .padding(2);

    treemapLayout(root);

    // Define a color scale based on the 'value' (total caught)
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(top5, d => d[1])]);

    // Liste erstellen
    const nodes = svg.selectAll(".node")
        .data(root.leaves())
        .join("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    // Rechtecke für die Liste
    nodes.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 0) // Start width
        .attr("height", 0) // Start height
        .attr("fill", d => colorScale(d.data.value)) // Färbe basierend auf Wert
        .attr("stroke", "#fff")
        .attr("rx", 6) // Runde Ecken
        .on("mouseover", function (event, d) {
            console.log(`Hovered over municipality: ${d.data.name}, Total: ${d.data.value}`);

            // Reduziere die Transparenz aller Rechtecke
            d3.selectAll("#topChart rect")
                .transition()
                .duration(300)
                .style("opacity", 0.3);

            // Setze die Transparenz des aktuellen Rechtecks auf 1
            d3.select(this)
                .transition()
                .duration(300)
                .style("opacity", 1);

            // Tooltip anzeigen
            tooltip
                .style("display", "block")
                .html(`Municipality: ${d.data.name}<br>Total: ${d.data.value}`);

            // Filter die Daten basierend auf der Gemeinde
            const tempFilteredData = filteredData.filter(
                item => item.municipality === d.data.name
            );

            // Aktualisiere andere Diagramme
            drawPoints(tempFilteredData);
        })
        .on("mousemove", function (event) {
            tooltip
                .style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            console.log("Mouse left");

            // Tooltip ausblenden
            tooltip.style("display", "none");

            // Setze Transparenz aller Rechtecke zurück
            d3.selectAll("#topChart rect")
                .transition()
                .duration(300)
                .style("opacity", 1);

            // Setze die Diagramme auf die ursprünglichen Daten zurück
            drawPoints(filteredData);
        })
        .transition()
        .duration(750)
        .attr("width", d => d.x1 - d.x0) // Zielattribut für Breite
        .attr("height", d => d.y1 - d.y0); // Zielattribut für Höhe

    // Namen der Gemeinden anzeigen
    nodes.append("text")
        .attr("dx", 4)
        .attr("dy", 14)
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("fill", "#fff")
        .transition()
        .delay(500)
        .duration(750)
        .text(d => `${d.data.name}`);

    // Totalwerte anzeigen
    nodes.append("text")
        .attr("dx", 4)
        .attr("dy", 30)
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("fill", "#fff")
        .transition()
        .delay(500)
        .duration(750)
        .text(d => `(${d.data.value})`);

    topLoaded = true;
    checkTopLoaded();

    d3.select("#topChart").append("div")
        .text("Top 5 most caught people")
        .attr("class", "smallTitle")
        .style("position", "absolute")
        .style("width", "100%")
        .style("height", "fit-content")
        .style("top", "10px")
        .style("left", "10px")
        .style("color", "#d1d1d1");
}

/*-----------------------LINECHART---------------------------*/
function drawLineChart(filteredData) {
    d3.select("#lineChart").selectAll("*").remove();

    // Gruppieren nach Jahr und aggregieren der Daten
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

    // Responsive Dimensions
    const container = d3.select("#lineChart").node().getBoundingClientRect();
    const width = container.width;
    const height = container.height;
    const margin = {top: 40, right: 20, bottom: 30, left: 40};

    const x = d3.scaleLinear()
        .domain([d3.min(years), d3.max(years)])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max([...buried, ...caught, ...dead], d => d.value)])
        .range([height - margin.bottom, margin.top]);

    const svg = d3.select("#lineChart").append("svg")
        .attr("width", "100%") // Breite passt sich an
        .attr("height", height) // Höhe bleibt konstant
        .attr("viewBox", `0 0 ${width} ${height}`) // Anpassung an Skalierung
        .attr("preserveAspectRatio", "none"); // Verhindert Proportionsveränderungen

    // Clip-Path hinzufügen
    svg.append("defs")
        .append("clipPath")
        .attr("id", "chart-area")
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top - 5)
        .attr("width", width - margin.left - margin.right + 5)
        .attr("height", height - margin.top - margin.bottom + 10);

    // Achsen
    const xAxisGroup = svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`);
    const xAxis = d3.axisBottom(x)
        .tickFormat(d3.format("d")) // Formatierung als Ganzzahlen
        .ticks(10); // Begrenzung auf 10 Ticks
    xAxisGroup.call(xAxis);

    const yAxisGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},0)`);
    const yAxis = d3.axisLeft(y);
    yAxisGroup.call(yAxis);

    // Linien-Generator
    const lineGenerator = d3.line()
        .curve(d3.curveMonotoneX)
        .x(d => x(d.year))
        .y(d => y(d.value));

    // Gruppen für Linien und Punkte mit Clip-Path
    const chartGroup = svg.append("g")
        .attr("clip-path", "url(#chart-area)");

    const lineGroup = chartGroup.append("g");
    const pointGroup = chartGroup.append("g");

    // Funktion zum Zeichnen der Linien mit Animation
    const drawLine = (data, className, color) => {
        const path = lineGroup.append("path")
            .datum(data)
            .attr("class", className)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("d", lineGenerator);

        // Animation
        const totalLength = path.node().getTotalLength();

        path
            .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(2000) // Dauer der Animation in Millisekunden
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
    };

    drawLine(caught, "line caught", "black");
    drawLine(buried, "line buried", "blue");
    drawLine(dead, "line dead", "#CB9DF0");

    // Tooltip-Kreise hinzufügen
    const addTooltipCircles = (data, color, category) => {
        pointGroup.selectAll(`.tooltip-circle-${category}`)
            .data(data)
            .join("circle")
            .attr("class", `tooltip-circle-${category}`)
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.value))
            .attr("r", 3)
            .attr("fill", color)
            .on("mouseover", (event, d) => {
                d3.select(".tooltip")
                    .style("display", "block")
                    .html(`${category}: ${d.value} <br> Year: ${d.year}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
                d3.select(".tooltip").style("display", "none");
            });
    };

    addTooltipCircles(caught, "black", "Caught");
    addTooltipCircles(buried, "blue", "Buried");
    addTooltipCircles(dead, "#CB9DF0", "Dead");

    // Tooltip hinzufügen
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#333")
        .style("color", "#fff")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("display", "none");

    // Zoom-Handler
    // Zoom-Handler
    const zoom = d3.zoom()
        .scaleExtent([1, 5])
        .translateExtent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("zoom", (event) => {
            const transform = event.transform;

            // Reskalieren der Achsen
            const newX = transform.rescaleX(x);
            xAxisGroup.call(d3.axisBottom(newX).tickFormat(d3.format("d"))); // Format auch beim Zoomen

            // Aktualisieren der Linien
            lineGroup.selectAll("path")
                .each(function (d) {
                    const path = d3.select(this);
                    const updatedPath = lineGenerator.x(d => newX(d.year))(d);
                    path.attr("d", updatedPath);

                    // Neu berechnen der Länge für Animationseigenschaften
                    const totalLength = this.getTotalLength();
                    path.attr("stroke-dasharray", `${totalLength} ${totalLength}`)
                        .attr("stroke-dashoffset", 0); // Beim Zoom ist die Linie vollständig sichtbar
                });

            // Aktualisieren der Punkte
            pointGroup.selectAll("circle")
                .attr("cx", d => newX(d.year));
        });

    svg.call(zoom);

    // Add legend
    const legend = d3.select("#lineChart").append("div")
        .style("top", "10px")
        .style("right", "10px")
        .style("position", "absolute")
        .style("display", "flex")
        .style("gap", "20px")
        .style("align-items", "center");

    // Add legend items
    const legendItems = [
        {color: "black", label: "Caught"},
        {color: "blue", label: "Buried"},
        {color: "#CB9DF0", label: "Dead"}
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

    d3.select("#lineChart").append("div")
        .text("Timeline of Accidents")
        .attr("class", "smallTitle")
        .style("position", "absolute")
        .style("width", "100%")
        .style("height", "fit-content")
        .style("top", "10px")
        .style("left", "10px")
        .style("color", "#d1d1d1")
}