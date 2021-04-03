import "./styles.scss";
import { select } from "d3";
import { treemap, hierarchy } from "d3-hierarchy";

const margin = { top: 20, right: 20, bottom: 20, left: 20 },
  width = 1200 - margin.left - margin.right,
  height = 700 - margin.top - margin.bottom;

function generateTooltipHtml({ name, category, value }) {
  const baseHTML = `<div>${name}</div><div>Platform: ${category}</div><div>Value: ${value}</div>`;
  return baseHTML;
}

const svg = select("#svg-container")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const categoryToColor = {
  Wii: "#4d91c4",
  GB: "#fbc893",
  PS2: "#df5254",
  SNES: "#d0c0db",
  GBA: "#e992ce",
  2600: "#d2d2d2",
  DS: "#bed2ed",
  PS3: "#54b357",
  "3DS": "#ffadac",
  PS: "#a2786f",
  XB: "#f8c5da",
  PSP: "#caca4d",
  X360: "#ff993e",
  NES: "#ade49f",
  PS4: "#a985c9",
  N64: "#d1afa8",
  PC: "#999999",
  XOne: "#e1e1a4",
};

fetch(
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json"
)
  .then((response) => response.json())
  .then((data) => {
    const tooltip = select("body")
      .append("div")
      .attr("id", "tooltip")
      .style("opacity", 0);

    // build the treemap core
    var root = hierarchy(data)
      .eachBefore(function (d) {
        d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name;
      })
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value);

    treemap().size([width, height]).paddingInner(1)(root);

    svg
      .selectAll("rect")
      .data(root.leaves())
      .enter()
      .append("rect")
      .attr("x", function (d) {
        return d.x0;
      })
      .attr("y", function (d) {
        return d.y0;
      })
      .attr("width", function (d) {
        return d.x1 - d.x0;
      })
      .attr("height", function (d) {
        return d.y1 - d.y0;
      })
      .attr("class", "tile")
      .attr("data-name", (d) => d.data.name)
      .attr("data-category", (d) => d.data.category)
      .attr("data-value", (d) => d.data.value)
      .style("fill", (d) => {
        return categoryToColor[d.data.category];
      })
      .on("mousemove", (e, d) => {
        select(this).transition().duration("50").attr("opacity", ".85");
        tooltip
          .html(generateTooltipHtml(d.data))
          .style("left", `${e.pageX + 10}px`)
          .style("top", `${e.pageY - 75}px`)
          .attr("data-value", `${d.data.value}`);
        tooltip.transition().duration(50).style("opacity", 1);
      })
      .on("mouseout", function () {
        select(this).transition().duration("50").attr("opacity", "1");

        //Makes the tooltip disappear:
        tooltip.transition().duration("50").style("opacity", 0);
      });

    svg
      .selectAll("text")
      .data(root.leaves())
      .enter()
      .append("text")
      .attr("class", "node")
      .attr("x", function (d) {
        return d.x0 + 3;
      }) // +10 to adjust position (more right)
      .attr("y", function (d) {
        return d.y0 + 10;
      }) // +20 to adjust position (lower)
      .text(function (d) {
        return d.data.name;
      })
      .attr("font-size", "10px")
      .attr("fill", "black")
      .attr("width", (d) => d.x1 - d.x0 - 4)
      .call(wrap);

    // attach legend
    const legendWidth = 90;
    const legendHeight = 500;
    const legendPadding = 50;

    const legend = select("#legend-container")
      .append("svg")
      .attr("id", "legend")
      .attr("width", legendWidth + 2 * legendPadding)
      .attr("height", legendHeight)
      .attr("dx", 200);

    legend
      .selectAll("rect")
      .data(Object.keys(categoryToColor))
      .enter()
      .append("rect")
      .attr("fill", (d) => {
        return categoryToColor[d];
      })
      .attr("width", 15)
      .attr("height", 10)
      .attr("y", function (_, i) {
        return (i % 6) * 30;
      })
      .attr("x", function (_, i) {
        const spacingFactor = 60;
        const third = Math.floor(i / 6);
        return third * spacingFactor;
      })
      .attr("class", "legend-item");

    legend
      .selectAll("text")
      .data(Object.keys(categoryToColor))
      .enter()
      .append("text")
      .text((d) => {
        return d.toString();
      })
      .attr("y", function (d, i) {
        return (i % 6) * 30 + 9;
      })
      .attr("font-size", "10px")
      .attr("x", function (_, i) {
        const spacingFactor = 60;
        const third = Math.floor(i / 6);
        return third * spacingFactor + 20;
      });
  });

// got this from https://stackoverflow.com/questions/24784302/wrapping-text-in-d3/24785497
// allows text to wrap inside treemap nodes
function wrap(text) {
  text.each(function () {
    var text = select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1, // ems
      width = text.attr("width"),
      x = text.attr("x"),
      y = text.attr("y"),
      dy = 0, //parseFloat(text.attr("dy")),
      tspan = text
        .text(null)
        .append("tspan")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", dy + "em");
    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append("tspan")
          .attr("x", x)
          .attr("y", y)
          .attr("dy", ++lineNumber * lineHeight + dy + "em")
          .text(word);
      }
    }
  });
}
