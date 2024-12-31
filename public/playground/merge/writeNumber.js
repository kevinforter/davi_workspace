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