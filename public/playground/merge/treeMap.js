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