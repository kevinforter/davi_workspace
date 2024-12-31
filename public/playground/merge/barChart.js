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