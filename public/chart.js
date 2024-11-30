const margin = {top: 40, right: 80, bottom: 60, left: 50},
    width = 960 - margin.left - margin.right,
    height = 280 - margin.top - margin.bottom;

const parseDate = d3.timeParse("%Y-%m-%d"),
    formatDate = d3.timeFormat("%Y %b %d"),
    formatMonth = d3.timeFormat("%Y %b");

const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

const areaDeath = d3
    .area()
    .x((d) => x(d.date))
    .y0(height)
    .y1((d) => y(d.dead))
    .curve(d3.curveMonotoneX);

const areaBuried = d3
    .area()
    .x((d) => x(d.date))
    .y0(height)
    .y1((d) => y(d.buried))
    .curve(d3.curveMonotoneX);

const valueline = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.caught))
    .curve(d3.curveMonotoneX);

const deadLine = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.dead))
    .curve(d3.curveMonotoneX);

const buriedLine = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.buried))
    .curve(d3.curveMonotoneX);


const svg = d3
    .select("#root")
    .append("svg")
    .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${
            height + margin.top + margin.bottom
        }`
    )
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(formatMonth));

svg.append("g").attr("class", "y axis").call(d3.axisLeft(y));

document.addEventListener("DOMContentLoaded", function () {
    let selectedCanton = "all";
    let selectedMunicipality = "all";
    let selectedDangerLevels = new Set();
    let fromDate = null;
    let toDate = null;

    document
        .getElementById("filterButton")
        .addEventListener("click", () => {
            document.getElementById("filterModal").style.display = "block";
        });

    document
        .getElementById("closeFilter")
        .addEventListener("click", () => {
            document.getElementById("filterModal").style.display = "none";
        });

    d3.csv("assets/ava36.csv").then((data) => {
        data.forEach((d) => {
            d.date = parseDate(d.date);
            d.caught = +d.caught;
            d.dead = +d.dead;
            d.buried = +d.buried;
        });

        let filteredData = data;

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

        appendData(filteredData);

        function appendData(filteredData) {
            d3.selectAll("path.area").remove();
            d3.selectAll("path.line").remove();
            d3.selectAll(".title").remove();
            d3.selectAll(".single-point").remove();

            x.domain(d3.extent(filteredData, (d) => d.date));
            y.domain([
                0,
                d3.max(filteredData, (d) => Math.max(d.caught, d.dead, d.buried)) || 1,
            ]);

            svg.select(".x.axis").transition().duration(750).call(
                d3.axisBottom(x).tickFormat(formatMonth)
            );
            svg.select(".y.axis").transition().duration(750).call(d3.axisLeft(y));

            if (filteredData.length === 1) {
                // If there's only one data point, draw a circle instead of a line
                svg
                    .append("circle")
                    .data(filteredData)
                    .attr("cx", (d) => x(d.date))
                    .attr("cy", (d) => y(d.caught))
                    .attr("r", 5)
                    .attr("class", "single-point")
                    .style("fill", "steelblue"); // Optional: Set a color for the dot

                svg
                    .append("circle")
                    .data(filteredData)
                    .attr("cx", (d) => x(d.date))
                    .attr("cy", (d) => y(d.dead))
                    .attr("r", 5)
                    .attr("class", "single-point")
                    .style("fill", "steelblue"); // Optional: Set a color for the dot

                svg
                    .append("circle")
                    .data(filteredData)
                    .attr("cx", (d) => x(d.date))
                    .attr("cy", (d) => y(d.buried))
                    .attr("r", 5)
                    .attr("class", "single-point")
                    .style("fill", "steelblue"); // Optional: Set a color for the dot
            } else if (filteredData.length > 1) {
                // Draw area and line for multiple data points
                svg
                    .append("path")
                    .data([filteredData])
                    .attr("class", "area area-death")
                    .attr("d", areaDeath);

                svg
                    .append("path")
                    .data([filteredData])
                    .attr("class", "area area-buried")
                    .attr("d", areaBuried);

                const lineCaught = svg
                    .append("path")
                    .data([filteredData])
                    .attr("class", "line caught-line")
                    .attr("d", valueline);

                const lineDeath = svg
                    .append("path")
                    .data([filteredData])
                    .attr("class", "line dead-line")
                    .attr("d", deadLine)

                const lineBuried = svg
                    .append("path")
                    .data([filteredData])
                    .attr("class", "line buried-line")
                    .attr("d", buriedLine)

                // Add animation for the line
                const caughtLength = lineCaught.node().getTotalLength();
                lineCaught
                    .attr("stroke-dasharray", caughtLength)
                    .attr("stroke-dashoffset", caughtLength)
                    .transition()
                    .duration(1000)
                    .attr("stroke-dashoffset", 0);

                const deathLength = lineDeath.node().getTotalLength();
                lineDeath
                    .attr("stroke-dasharray", deathLength)
                    .attr("stroke-dashoffset", deathLength)
                    .transition()
                    .duration(1000)
                    .attr("stroke-dashoffset", 0);

                const buriedLength = lineBuried.node().getTotalLength();
                lineBuried
                    .attr("stroke-dasharray", buriedLength)
                    .attr("stroke-dashoffset", buriedLength)
                    .transition()
                    .duration(1000)
                    .attr("stroke-dashoffset", 0);
            }

            const focus = svg
                .append("g")
                .attr("class", "focus")
                .style("display", "none");

            focus
                .append("circle")
                .attr("class", "y")
                .style("fill", "none")
                .attr("r", 4);

            focus.append("text").attr("class", "y1").attr("dx", 8).attr("dy", "-.3em");
            focus.append("text").attr("class", "y2").attr("dx", 8).attr("dy", "-.3em");

            focus.append("text").attr("class", "y3").attr("dx", 8).attr("dy", "1em");
            focus.append("text").attr("class", "y4").attr("dx", 8).attr("dy", "1em");

            // Add focuses for "caught," "dead," and "buried"
            const focusCaught = svg.append("g").attr("class", "focus caught").style("display", "none");
            const focusDead = svg.append("g").attr("class", "focus dead").style("display", "none");
            const focusBuried = svg.append("g").attr("class", "focus buried").style("display", "none");

// Configure each focus group
            [focusCaught, focusDead, focusBuried].forEach((focus) => {
                focus.append("circle").attr("r", 4).style("fill", "none").style("stroke", "black");
                focus.append("text").attr("dx", 8).attr("dy", "-.3em");
            });

// Update mouseMove function
            function mouseMove(event) {
                const bisect = d3.bisector((d) => d.date).left;
                const x0 = x.invert(d3.pointer(event, this)[0]);
                const i = bisect(filteredData, x0, 1);
                const d0 = filteredData[i - 1];
                const d1 = filteredData[i];
                const d = !d0 || !d1 ? d0 || d1 : x0 - d0.date > d1.date - x0 ? d1 : d0;

                if (d) {
                    // Update "caught" focus
                    focusCaught.attr("transform", `translate(${x(d.date)},${y(d.caught)})`);
                    // focusCaught.select("text").text(`Caught: ${d.caught}`);

                    // Update "dead" focus
                    focusDead.attr("transform", `translate(${x(d.date)},${y(d.dead)})`);
                    // focusDead.select("text").text(`Dead: ${d.dead}`);

                    // Update "buried" focus
                    focusBuried.attr("transform", `translate(${x(d.date)},${y(d.buried)})`);
                    // focusBuried.select("text").text(`Buried: ${d.buried}`);
                }
            }

// Add event listeners for the interactive area
            svg.append("rect")
                .attr("width", width)
                .attr("height", height)
                .style("fill", "none")
                .style("pointer-events", "all")
                .on("mouseover", () => {
                    focusCaught.style("display", null);
                    focusDead.style("display", null);
                    focusBuried.style("display", null);
                })
                .on("mouseout", () => {
                    focusCaught.style("display", "none");
                    focusDead.style("display", "none");
                    focusBuried.style("display", "none");
                })
                .on("mousemove", mouseMove);

        }

        function tabulate(data, columns) {
            d3.select("body").selectAll("table").remove();

            const table = d3.select("body").append("table");
            const thead = table.append("thead");
            const tbody = table.append("tbody");

            thead.append("tr")
                .selectAll("th")
                .data(columns)
                .enter()
                .append("th")
                .text((d) => d);

            const rows = tbody
                .selectAll("tr")
                .data(data)
                .enter()
                .append("tr");

            rows.selectAll("td")
                .data((row) =>
                    columns.map((column) => ({column, value: row[column]}))
                )
                .enter()
                .append("td")
                .text((d) => d.value);

            return table;
        }

        const columns = [
            "date",
            "hydrological.year",
            "canton",
            "municipality",
            "start.zone.coordinates.latitude",
            "start.zone.coordinates.longitude",
            "start.zone.elevation",
            "forecasted.dangerlevel.rating1",
            "caught",
            "dead",
            "fully.buried",
        ];

        tabulate(data, columns);

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

            appendData(filteredData);
            tabulate(filteredData, columns);
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
    });
});