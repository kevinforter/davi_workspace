//const { path } = require("d3-path");




d3.csv("assets/avalanche_accidents_fatal_switzerland_since_1936.csv").then(function (data) {
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
var pie = d3.pie().value(function (d) { return d.count; });
var arc = d3.arc().innerRadius(115).outerRadius(radius1);
// change and animate on svg1
function changeSvgs(newData) {
    var path = svg1.selectAll("path");
    var data0 = path.data(), data1 = pie(newData);
    path = path.data(data1);
    path.transition().duration(1500).attrTween("d", arcTween)

    "hello world i hate mi life it's so boring or I can't find motivation for this stufff ..... "

    // animate percentage number
    svg1.select("text").transition().tween("text", () => {
        const interpolator = d3.interpolateNumber(data0[0].data.count, data1[0].data.count);
        return function(t) {
            d3.select(this).text(interpolator(t).toFixed(2).toString() + "%")
        }
    }).duration(1500);

    path = svg2.selectAll("path");
    data0 = path.data(), data1 = pie(newData);
}
// interplation used for animation 
function arcTween(d) {
    var i = d3.interpolate(this._current, d);

    this._current = i(0);
    return function (t) {
        return arc(i(t))
    }

}

d3.csv("assets/avalanche_accidents_fatal_switzerland_since_1936.csv").then(function (data) {
    var totalCaught = d3.sum(data, function (d) { return +d['number.caught']; });
    var totalDead = d3.sum(data, function (d) { return +d['number.dead']; });
    var percentageDead = (totalDead / totalCaught) * 100;

    var pieData0 = [{ "type": "dead", "count": percentageDead }, { "type": "survived", "count": 100 - percentageDead }]
    var pieData1 = [{ "type": "dead", "count": 75 }, { "type": "survived", "count": 100 - 75 }]

    // TODO change function to our colorscheme
    var color = d3.scaleOrdinal()
        .domain(Object.keys(pieData0[0].type))
        .range(["#336BFF", "#ffffff"]);

    svg1.selectAll('whatever').data(pie(pieData0))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function (d) { return color(d.data.type); })
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

    d3.select("#button1").on('click', function (d) {
        changeSvgs(pieData1)
    })
    d3.select("#button2").on('click', function (d) {
        changeSvgs(pieData0)
    })

    // TODO labels from bottom

    function myChange(newData) {
        var path = svg1.selectAll("path");
        var data0 = path.data(), data1 = pie(newData);
        path = path.data(data1);
        path.transition().duration(1500).attrTween("d", arcTween)
    }

    function arcTween(d) {
        var i = d3.interpolate(this._current, d);

        this._current = i(0);
        return function (t) {
            return arc(i(t))
        }

    }
}).catch(function (error) {
    console.error("Error loading the CSV file for the first chart: ", error);
});



/*d3.csv("assets/avalanche_accidents_fatal_switzerland_since_1936.csv").then(function (data) {
    var totalCaught = d3.sum(data, function (d) { return +d['number.caught']; });
    var totalDead = d3.sum(data, function (d) { return +d['number.dead']; });
    var percentageDead = (totalDead / totalCaught) * 100;

    var pieData1 = { "Dead": percentageDead, "Survived": 100 - percentageDead };
    var pieData12 = { "Dead": 50, "Survived": 50 };


    var color1 = d3.scaleOrdinal()
        .domain(Object.keys(pieData1))
        .range(["#336BFF", "#ffffff"]);


    var pie1 = d3.pie().value(function (d) { return d[1]; });
    var data_ready1 = pie1(Object.entries(pieData1));

    var arc = d3.arc().innerRadius(115).outerRadius(radius1)


    svg1.selectAll('whatever')
        .data(data_ready1)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function (d) { return color1(d.data[0]); })
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
    d3.select("button").on("click", buttonClick);
    function buttonClick() {
        myChange(pieData12);

    }
    function myChange(newData) {
        var path = svg1.selectAll("path");
        var data0 = path.data(), data1 = pie1(Object.entries(newData));
        path = path.data(data1);
        console.log(path)
        path.transition().duration(1500).attrTween("d", arcTween)
        console.log(path)
        path.enter().append("path").each(function (d, i) {
            var narc = findNeighborArc(i, data0, data1, key);
            if (narc) {
                this._current = narc;
                this._previous = narc;
            } else {
                this._current = d;
            }
        })
            .attr("fill", function (d, i) {
                return color1(d.data.region)
            })
            .transition()
            .duration(100)
            .attrTween("d", arcTween)

    }


    function change() {
        let path = svg1.selectAll("path");
        let data0 = path.data(),
            data1 = pie1(Object.entries(pieData12));
        path = path.data(data1, (d) => {
            return d.data.dead
        });
        path.transition().duration(100).attrTween("d", arcTween)

        path
            .enter()
            .append("path")
            .each(function (d, i) {
                var narc = findNeighborArc(i, data0, data1, key);
                if (narc) {
                    this._current = narc;
                    this._previous = narc;
                } else {
                    this._current = d;
                }
            })
            .attr("fill", function (d, i) {
                return color(d.data.region)
            })
            .transition()
            .duration(100)
            .attrTween("d", arcTween)


        path
            .exit()
            .transition()
            .duration(100)
            .attrTween("d", function (d, index) {

                var currentIndex = this._previous.data.region;
                var i = d3.interpolateObject(d, this._previous);
                return function (t) {
                    return arc(i(t))
                }

            })
            .remove()

    }
    function arcTween(d) {

        var i = d3.interpolate(this._current, d);

        this._current = i(0);

        return function (t) {
            return arc(i(t))
        }

    }
}).catch(function (error) {
    console.error("Error loading the CSV file for the first chart: ", error);
});*/


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

d3.csv("assets/avalanche_accidents_fatal_switzerland_since_1936.csv").then(function (data) {
    var totalCaught = d3.sum(data, function (d) { return +d['number.caught']; });
    var fullyBuried = d3.sum(data, function (d) { return +d['number.fully.buried']; });
    var percentageBuried = (fullyBuried / totalCaught) * 100;

    var pieData2 = { "Fully Buried": percentageBuried, "Not Buried": 100 - percentageBuried };

    var color2 = d3.scaleOrdinal()
        .domain(Object.keys(pieData2))
        .range(["#336BFF", "#ffffff"]);

    var pie2 = d3.pie().value(function (d) { return d[1]; });
    var data_ready2 = pie2(Object.entries(pieData2));

    var arc = d3.arc().innerRadius(115).outerRadius(radius2);

    svg2.selectAll('whatever')
        .data(data_ready2)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function (d) { return color2(d.data[0]); })
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

}).catch(function (error) {
    console.error("Error loading the CSV file for the second chart: ", error);
});

// Load the data
d3.csv("assets/avalanche_accidents_fatal_switzerland_since_1936.csv").then(function (data) {

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
        .attr("height", height)
        .attr("stroke", "black")
        .style("stroke-width", "2px");

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
        .on("mouseover", function (event, d) {
            tooltip.style("display", "block")
                .text(`Level: ${d.level}`);
        })
        .on("mousemove", function (event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");
        });

}).catch(function (error) {
    console.error("Error loading CSV data:", error);
});


