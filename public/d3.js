d3.csv("assets/avalanche_accidents_fatal_switzerland_since_1936.csv").then(function(data) {
    var totalCaught = d3.sum(data, function (d) {
        return +d['number.caught'];
    });

// Display totalCaught in the element with id="total_caught"
    d3.select("#total_caught").text(totalCaught);
})

// First Pie Chart (Percentage Dead)
var width1 = 450;
var height1 = 450;
var margin1 = 40;
var radius1 = Math.min(width1, height1) / 2 - margin1;

var svg1 = d3.select("#piechart_container_left")
    .append("svg")
    .attr("width", width1)
    .attr("height", height1)
    .append("g")
    .attr("transform", "translate(" + width1 / 2 + "," + height1 / 2 + ")");

d3.csv("assets/avalanche_accidents_fatal_switzerland_since_1936.csv").then(function(data) {
    var totalCaught = d3.sum(data, function(d) { return +d['number.caught']; });
    var totalDead = d3.sum(data, function(d) { return +d['number.dead']; });
    var percentageDead = (totalDead / totalCaught) * 100;

    var pieData1 = { "Dead": percentageDead, "Survived": 100 - percentageDead };

    var color1 = d3.scaleOrdinal()
        .domain(Object.keys(pieData1))
        .range(["#336BFF", "#ffffff"]);

    var pie1 = d3.pie().value(function(d) { return d[1]; });
    var data_ready1 = pie1(Object.entries(pieData1));

    svg1.selectAll('whatever')
        .data(data_ready1)
        .enter()
        .append('path')
        .attr('d', d3.arc().innerRadius(115).outerRadius(radius1))
        .attr('fill', function(d) { return color1(d.data[0]); })
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 0.7);

    svg1.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.4em")
        .style("font-size", "56px")
        .style("font-weight", "bold")
        .style("fill", "#336BFF")
        .text(percentageDead.toFixed(2) + "%");

}).catch(function(error) {
    console.error("Error loading the CSV file for the first chart: ", error);
});

// Second Pie Chart (Percentage Fully Buried)
var width2 = 450;
var height2 = 450;
var margin2 = 40;
var radius2 = Math.min(width2, height2) / 2 - margin2;

var svg2 = d3.select("#piechart_container_right")
    .append("svg")
    .attr("width", width2)
    .attr("height", height2)
    .append("g")
    .attr("transform", "translate(" + width2 / 2 + "," + height2 / 2 + ")");

d3.csv("assets/avalanche_accidents_fatal_switzerland_since_1936.csv").then(function(data) {
    var totalCaught = d3.sum(data, function(d) { return +d['number.caught']; });
    var fullyBuried = d3.sum(data, function(d) { return +d['number.fully.buried']; });
    var percentageBuried = (fullyBuried / totalCaught) * 100;

    var pieData2 = { "Fully Buried": percentageBuried, "Not Buried": 100 - percentageBuried };

    var color2 = d3.scaleOrdinal()
        .domain(Object.keys(pieData2))
        .range(["#336BFF", "#ffffff"]);

    var pie2 = d3.pie().value(function(d) { return d[1]; });
    var data_ready2 = pie2(Object.entries(pieData2));

    svg2.selectAll('whatever')
        .data(data_ready2)
        .enter()
        .append('path')
        .attr('d', d3.arc().innerRadius(115).outerRadius(radius2))
        .attr('fill', function(d) { return color2(d.data[0]); })
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 0.7);

    svg2.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.4em")
        .style("font-size", "56px")
        .style("font-weight", "bold")
        .style("fill", "#336BFF")
        .text(percentageBuried.toFixed(2) + "%");

}).catch(function(error) {
    console.error("Error loading the CSV file for the second chart: ", error);
});

// Load the data
d3.csv("assets/avalanche_accidents_fatal_switzerland_since_1936.csv").then(function(data) {

    // Set the fixed width for the chart
    const width = 1350; // Fixed width of the stacked bar chart
    const height = 100;

    // Define specific colors for each level
    const colorMapping = {
        "1": "#9FFF64", // Green for Level 1
        "2": "#F2FF00", // Yellow for Level 2
        "3": "#FFC31E", // Orange for Level 3
        "4": "#FF0000", // Red for Level 4
        "5": "#8B0000"  // Dark Red for Level 5
    };

    // Calculate total caught and group by danger level, ignoring empty or null cells
    const totalCaught = d3.sum(data, d => +d['number.caught']);
    const dangerLevels = d3.rollup(
        data.filter(d => d['forecasted.dangerlevel.rating1'] && d['forecasted.dangerlevel.rating1'] !== "NULL"),
        v => d3.sum(v, d => +d['number.caught']),
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
        width: (count / totalCaught) * width // Initial proportional width based on total count
    }));

    // Calculate the total of proportional widths
    const totalProportionalWidth = proportionalWidths.reduce((sum, d) => sum + d.width, 0);

    // Determine the scaling factor to adjust to exactly 1350px
    const scalingFactor = width / totalProportionalWidth;

    // Apply the scaling factor to each segment to maintain proportionality and fit 1350px
    const stackedData = proportionalWidths.map(d => ({
        ...d,
        width: d.width * scalingFactor
    }));

    // Sort the stackedData by the level (convert level to a number for sorting)
    stackedData.sort((a, b) => +a.level - +b.level);

    // Create the stacked bar
    const svg = d3.select("#stacked_bar_chart")
        .append("svg")
        .attr("width", width) // Set SVG width to 1350px
        .attr("height", height);

    let xOffset = 0; // Track the x position for each segment

    // Select the tooltip element
    const tooltip = d3.select("#tooltip");

    svg.selectAll("rect")
        .data(stackedData)
        .enter()
        .append("rect")
        .attr("x", d => {
            const x = xOffset;
            xOffset += d.width;
            return x;
        })
        .attr("y", 0)
        .attr("width", d => d.width)
        .attr("height", height)
        .attr("fill", d => colorMapping[d.level]) // Use color from mapping based on level
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                .text(`Level: ${d.level}`);
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        });

}).catch(function(error) {
    console.error("Error loading CSV data:", error);
});


