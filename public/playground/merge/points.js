// Function to draw points on the map
function drawPoints(data) {
    // Entferne vorhandene Punkte mit einer Transition
    pointsGroup.selectAll("circle")
        .transition()
        .duration(250)
        .attr("r", 0)
        .remove();

    data.forEach(row => {
        const latitude = parseFloat(row['start.zone.coordinates.latitude']);
        const longitude = parseFloat(row['start.zone.coordinates.longitude']);
        const date = row['date'];
        const canton = row['canton'];
        const municipality = row['municipality'];
        const dangerLevel = row['forecasted.dangerlevel.rating1'];
        const caught = row['caught'];
        const buried = row['buried'];
        const dead = row['dead'];
        const activity = row['activity'];

        // Convert the date to a JavaScript Date object for filtering
        const rowDate = new Date(date);
        const options = { weekday: 'short', year: 'numeric', month: 'short' };
        const formattedDate = date.toLocaleDateString('de-CH', options);

        // Check if the data matches the selected filters
        if (
            (selectedCanton === 'all' || canton === selectedCanton) &&
            (selectedMunicipality === 'all' || municipality === selectedMunicipality) &&
            (selectedDangerLevels.size === 0 || selectedDangerLevels.has(dangerLevel)) &&
            (!fromDate || rowDate >= new Date(fromDate)) &&
            (!toDate || rowDate <= new Date(toDate))
        ) {
            // Ensure valid coordinates before plotting
            if (!isNaN(latitude) && !isNaN(longitude)) {
                const projectedCoordinates = projection([longitude, latitude]);

                pointsGroup.append("circle")
                    .attr("cx", projectedCoordinates[0])
                    .attr("cy", projectedCoordinates[1])
                    .attr("r", 0) // Start radius for animation
                    .attr("fill", function () {
                        // Check dangerLevel for appropriate color
                        if (dangerLevel.includes(3)) {
                            return "orange";
                        } else if (dangerLevel.includes(4)) {
                            return "red";
                        } else if (dangerLevel.includes(1)) {
                            return "#9FFF64";
                        } else if (dangerLevel.includes(2)) {
                            return "yellow";
                        } else if (dangerLevel.includes(5)) {
                            return "#A11B1B";
                        } else {
                            return "grey";
                        }
                    })
                    .attr("stroke", "black")
                    .attr("stroke-width", 0.25)
                    .transition()
                    .duration(250)
                    .attr("r", 2) // Final radius after animation
                    .on("end", function () {
                        // Add event listeners after the animation ends
                        d3.select(this)
                            .on("mouseover", (event) => {
                                tooltip
                                    .style("opacity", 1)
                                    .style("z-index", 100)
                                    .html(`
                                        <strong>Date:</strong> ${formattedDate}<br>
                                        <strong>Canton:</strong> ${canton}<br>
                                        <strong>Municipality:</strong> ${municipality}<br>
                                        <strong>Coordinates:</strong> [${latitude}, ${longitude}]<br>
                                        <strong>Danger Level:</strong> ${dangerLevel}<br>
                                        <strong>Caught:</strong> ${caught}
                                        <strong>Buried:</strong> ${buried} 
                                        <strong>Dead:</strong> ${dead}<br>
                                        <strong>Activity:</strong> ${activity}
                                    `)
                                    .style("left", (event.pageX + 10) + "px")
                                    .style("top", (event.pageY - 28) + "px");
                            })
                            .on("mousemove", (event) => {
                                tooltip
                                    .style("left", (event.pageX + 10) + "px")
                                    .style("top", (event.pageY - 28) + "px");
                            })
                            .on("mouseout", () => {
                                tooltip.style("opacity", 0);
                            });
                    });
            }
        }
    });
}
