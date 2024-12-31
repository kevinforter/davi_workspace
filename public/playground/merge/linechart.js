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