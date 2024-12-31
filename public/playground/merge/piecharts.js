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