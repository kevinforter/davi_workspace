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