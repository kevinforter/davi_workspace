import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


Promise.all([
    d3.xml("/assets/switzerland.svg"),
    d3.csv("/assets/avalanche_accidents_all_switzerland_since_1970.csv"),
    d3.csv("/assets/avalanche_accidents_fatal_switzerland_since_1936.csv")
]).then(function (files) {
    const data = files[1].concat(files[2]);

    document.getElementById('swissmap_container').appendChild(files[0].documentElement).setAttribute('id', 'swissmap');
    const swiss = d3.select('#swissmap');
    const cantons = swiss.selectAll('path');

    // Get the SVG's viewBox dimensions
    const viewBox = swiss.node().viewBox.baseVal;
    const width = viewBox.width;
    const height = viewBox.height;

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);
    function zoomed(event) {
        const { transform } = event;
        swiss.attr("transform", transform);
        swiss.attr("stroke-width", 1 / transform.k);
    }
    piechart(data)
    // add DataPoints to swissmap
    swiss.append('g').selectAll('circle').data(data).enter().append('circle')
        .attr("cx", function (d) { return transformLonToSvgX(d['start.zone.coordinates.longitude']) })
        .attr("cy", function (d) { return transformLatToSvgY(d['start.zone.coordinates.latitude']) })
        .attr("r", 3)
        .attr("fill", function (d) { return colorCodingBySeverity(d['forecasted.dangerlevel.rating1']) });

    cantons.on('click', function (event, d) {
        const canton = d3.select(this);
        const bbox = canton.node().getBBox();
        const [[x0, y0], [x1, y1]] = [[bbox.x, bbox.y], [bbox.x + bbox.width, bbox.y + bbox.height]];
        event.stopPropagation();
        // states.transition().style("fill", null);
        //d3.select(this).transition().style("fill", "red");
        swiss.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(event, swiss.node())
        );
    })
})
function piechart(data) {
    data = data.slice(3350,3400);
    var width = 400;
    var height = 400;
    var pie = d3.pie().value(function (d) { return d['number.dead'] })

    console.log(pie(data));
    // var pie_data = pie(d3.entries(data));
    var arc = d3.arc().innerRadius(100).outerRadius(150)

    const color = d3.scaleOrdinal()
    .domain(data.map(d => d['avalanche.id']))
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse());


    var svg = d3.select('#piechart_container').append('svg')
        .attr('width', width).attr('height', height).append('g')
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    svg.selectAll('asdf').data(pie(data)).enter().append('path').attr('d', arc)
        .attr("fill", d => color(d.data['avalanche.id']))
}
// Transformation for map coordinate lat to the svg y-coordinate ( 0, 783.)
function transformLatToSvgY(lat) {
    const latMin = 47.808048;
    const latMax = 45.817216;
    const yMin = 0;
    const yMax = 783.07391;
    return ((lat - latMin) * (yMax - yMin) / (latMax - latMin) + yMin)
}
// Transformation for map coordinate lon to the svg x-coordinate (0, 1224)
function transformLonToSvgX(lon) {
    const lonMin = 5.956532;
    const lonMax = 10.492377;
    const xMin = 0;
    const xMax = 1224.3984;
    return ((lon - lonMin) * (xMax - xMin) / (lonMax - lonMin) + xMin);
}

function colorCodingBySeverity(severity) {
    switch (parseInt(severity)) {
        case 1: return "green";
        case 2: return "yellow";
        case 3: return "orange";
        case 4: return "red";
        default: return "black";
    }
}