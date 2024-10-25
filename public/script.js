
const svgFilePath = "/assets/switzerland.svg";

function chatgptFunc() {
    // Load the SVG content
    d3.xml(svgFilePath).then(function (xml) {
        document.getElementById('container').appendChild(xml.documentElement);
        const svg = d3.select('svg');
        const svgWidth = svg.attr('width')
        const svgHeight = svg.attr('height')
        // Set up zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 10])  // Define how much you can zoom in/out
            .on("zoom", function (event) {
                svg.attr("transform", event.transform);
            });

        svg.call(zoom);
        // Add click event to each canton to zoom in
        svg.selectAll('path') // Assuming each canton is a <path> element
            .on('click', function (event, d) {
                const canton = d3.select(this);
                const bbox = canton.node().getBBox(); // Get the bounding box of the clicked canton

                // Calculate the zoom level and translate to center the clicked canton
                const scale = Math.min(10, 0.9 / Math.max(bbox.width / svgWidth, bbox.height / svgHeight));
                const translate = [svgWidth / 2 - scale * (bbox.x + bbox.width / 2),
                svgHeight / 2 - scale * (bbox.y + bbox.height / 2)];

                svg.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
                );
            });
    });
}

d3.xml(svgFilePath).then(function (xml) {
    //d3.select('container').node().append(xml.documentElement)
    document.getElementById('container').appendChild(xml.documentElement);
    const svg = d3.select('svg').on('click', reset);
    const svgWidth = svg.attr('width')
    const svgHeight = svg.attr('height')
    selectedCanton = ""

    const zoom = d3.zoom()
        .scaleExtent([1, 10])  // Define how much you can zoom in/out
        .on("zoom", function (event) {
            svg.attr("transform", event.transform);
        });
    svg.call(zoom);
    function reset() {
        selectedCanton = ""
        svg.selectAll('path').transition().style("fill", "grey");
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(svg.node()).invert([svgWidth / 2, svgHeight / 2])
        );
    }
    svg.append('circle').attr('cx', svgWidth/2).attr('cy',svgHeight/2).attr('r', 5).style('fill','green')
    svg.selectAll('path').on('click', function (event, d) {
        
        const canton = d3.select(this);
        console.log(canton)
        if (selectedCanton == canton.attr("id")) {
            console.log("Country selected")
            reset()
            return
        }
        selectedCanton = canton.attr("id")
        svg.selectAll('path').transition().style("fill", "grey")
        
        const bbox = canton.node().getBBox();
        canton.transition().duration(750).style('fill', 'red');
        const scale = Math.min(8, 0.9 / Math.max((bbox.width) / svgWidth, (bbox.height) / svgHeight))
        translateX = svgWidth/2 - bbox.x - (bbox.width/2)
        translateY =  svgHeight/2 - bbox.y - (bbox.height/2)
        svg.transition().duration(1250).call(
            zoom.transform,
                d3.zoomIdentity
                    .scale(scale)
                    .translate(translateX,translateY),
                d3.pointer(event, svg.node())
        )
        event.stopPropagation()
    })
})