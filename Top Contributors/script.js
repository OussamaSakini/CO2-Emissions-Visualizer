// Tabs Management
document.querySelectorAll(".tab-link").forEach(tab => {
    tab.addEventListener("click", function () {
        document.querySelectorAll(".tab-link").forEach(link => link.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

        this.classList.add("active");
        document.getElementById(this.dataset.tab).classList.add("active");
    });
});

// Gestion des clics pour le toggle (Countries/Continents)
document.querySelectorAll("#entity-toggle .toggle-button").forEach(button => {
    button.addEventListener("click", function () {
        // Supprime la classe active des autres boutons dans ce toggle
        document.querySelectorAll("#entity-toggle .toggle-button").forEach(btn => btn.classList.remove("active"));

        // Ajoute la classe active au bouton cliqué
        this.classList.add("active");

        // Récupère la valeur sélectionnée (Countries ou Continents)
        const selectedType = this.getAttribute("data-value");
        currentType = selectedType;

        // Met à jour le graphique Bubble Chart
        updateBubbleChart(currentType, currentYear, currentSortKey);
    });
});



// Bubble Chart (Page 1) and Bar Chart (Page 2) Setup
const margin = { top: 50, right: 30, bottom: 100, left: 100 };
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg1 = d3.select("#chart1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const svg2 = d3.select("#chart2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const url = "https://raw.githubusercontent.com/OussamaSakini/climate-change-data/refs/heads/main/global-co2-fossil-plus-land-use.csv";

// Tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "#fff")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("box-shadow", "0px 4px 8px rgba(0,0,0,0.1)");

d3.csv(url).then(data => {
    const geographicalRegions = ["Asia", "Europe", "Australia", "North America", "South America", "Oceania"];
    const countries = ["Afghanistan", "Aland Islands", "Albania", "Algeria", "Andorra", "Angola", "Anguilla", "Antigua and Barbuda",
        "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh",
        "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia and Herzegovina",
        "Botswana", "Brazil", "British Virgin Islands", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia",
        "Cameroon", "Canada", "Cape Verde", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
        "Cote d'Ivoire", "Croatia", "Cuba", "Curacao", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica",
        "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini",
        "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Greenland",
        "Grenada", "Guadeloupe", "Guatemala", "Guernsey", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
        "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Isle of Man", "Israel",
        "Italy", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait",
        "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
        "Luxembourg", "Macao", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
        "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia (country)", "Moldova", "Mongolia",
        "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Caledonia",
        "New Zealand", "Nicaragua", "Niger", "Nigeria", "Niue", "North Korea", "North Macedonia", "Norway", "Oman",
        "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
        "Portugal", "Puerto Rico", "Qatar", "Reunion", "Romania", "Russia", "Rwanda", "Saint Helena", "Saint Kitts and Nevis",
        "Saint Lucia", "Saint Martin (French part)", "Saint Pierre and Miquelon", "Saint Vincent and the Grenadines",
        "Samoa", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
        "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain",
        "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand",
        "Timor", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Turks and Caicos Islands",
        "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
        "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];

    // Prétraitement des données
    data.forEach(d => {
        d["Emissions industrielles de CO2"] = +d["Emissions industrielles de CO2"];
        d["Emissions globales de CO2"] = +d["Emissions globales de CO2"];
        d["Emissions de CO2 dues à la déforestation"] = +d["Emissions de CO2 dues à la déforestation"];
    });

    // Ajouter les années dans les sélecteurs
    for (let year = 2000; year <= 2021; year++) {
        d3.select("#year-select1").append("option").attr("value", year).text(year);
        d3.select("#year-select2").append("option").attr("value", year).text(year);
    }

    function filterData(type, year) {
        let filteredData = data;

        if (type === "countries") {
            filteredData = filteredData.filter(d => countries.includes(d.Entity));
        } else if (type === "geographical") {
            filteredData = filteredData.filter(d => geographicalRegions.includes(d.Entity));
        }

        filteredData = filteredData.filter(d => +d.Year >= 2000 && +d.Year <= 2021);
        if (year !== "all") {
            filteredData = filteredData.filter(d => +d.Year === +year);
        }
        return filteredData;
    }

    // Bubble Chart Update
// Bubble Chart Update
function updateBubbleChart(type, year, sortKey) {
    const filteredData = filterData(type, year);
    const bubbleData = d3.rollup(
        filteredData,
        v => ({
            industrial: d3.sum(v, d => d["Emissions industrielles de CO2"]),
            global: d3.sum(v, d => d["Emissions globales de CO2"]),
            deforestation: d3.sum(v, d => d["Emissions de CO2 dues à la déforestation"]),
        }),
        d => d.Entity
    );

    const dataArray = Array.from(bubbleData, ([key, value]) => ({
        entity: key,
        industrial: value.industrial,
        global: value.global,
        deforestation: value.deforestation,
        total: value.industrial + value.global + value.deforestation,
    }))
        .sort((a, b) => b[sortKey] - a[sortKey])
        .slice(0, 10);

    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(dataArray, d => d[sortKey])])
        .range([20, 100]);

    const simulation = d3.forceSimulation(dataArray)
        .force("x", d3.forceX(width / 2).strength(0.1))
        .force("y", d3.forceY(height / 2).strength(0.1))
        .force("collide", d3.forceCollide(d => radiusScale(d[sortKey]) + 5))
        .stop();

    for (let i = 0; i < 200; i++) simulation.tick();

    // Circles
    const circles = svg1.selectAll("circle").data(dataArray, d => d.entity);
    circles.enter()
        .append("circle")
        .attr("fill", "#007bff")
        .merge(circles)
        .transition()
        .duration(1000)
        .attr("r", d => radiusScale(d[sortKey]))
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    circles.exit().remove();

    // Text labels inside bubbles
    const labels = svg1.selectAll(".bubble-label").data(dataArray, d => d.entity);
    labels.enter()
        .append("text")
        .attr("class", "bubble-label")
        .attr("text-anchor", "middle")
        .merge(labels)
        .transition()
        .duration(1000)
        .attr("x", d => d.x)
        .attr("y", d => d.y - 10) // Position du nom légèrement au-dessus du centre
        .text(d => d.entity);

    labels.exit().remove();

    // Emission values below the names
    const values = svg1.selectAll(".bubble-value").data(dataArray, d => d.entity);
    values.enter()
        .append("text")
        .attr("class", "bubble-value")
        .attr("text-anchor", "middle")
        .merge(values)
        .transition()
        .duration(1000)
        .attr("x", d => d.x)
        .attr("y", d => d.y + 10) // Position des valeurs sous le centre
        .text(d => `${(d[sortKey] / 1e9).toFixed(2)} Gt`);

    values.exit().remove();
}

// Bar Chart Update
function updateBarChart(type, year, sortKey) {
    const filteredData = filterData(type, year);
    const aggregatedData = d3.rollup(
        filteredData,
        v => ({
            industrial: d3.sum(v, d => d["Emissions industrielles de CO2"]),
            global: d3.sum(v, d => d["Emissions globales de CO2"]),
            deforestation: d3.sum(v, d => d["Emissions de CO2 dues à la déforestation"]),
        }),
        d => d.Entity
    );

    const topEntities = Array.from(aggregatedData, ([key, value]) => ({
        entity: key,
        industrial: value.industrial,
        global: value.global,
        deforestation: value.deforestation,
        total: value.industrial + value.global + value.deforestation,
    }))
        .sort((a, b) => b[sortKey] - a[sortKey])
        .slice(0, 10);

    const x = d3.scaleBand()
        .domain(topEntities.map(d => d.entity))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(topEntities, d => d[sortKey])])
        .range([height, 0]);

    // Mise à jour des rectangles
    svg2.selectAll("rect").data(topEntities).join(
        enter => enter.append("rect")
            .attr("fill", "#007bff")
            .attr("x", d => x(d.entity))
            .attr("y", d => y(d[sortKey]))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d[sortKey]))
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.entity}</strong><br>${(d[sortKey] / 1e9).toFixed(2)} Gt`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            }),
        update => update.transition().duration(1000)
            .attr("x", d => x(d.entity))
            .attr("y", d => y(d[sortKey]))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d[sortKey])),
        exit => exit.remove()
    );

    // Mise à jour des axes
    svg2.selectAll(".x-axis").remove();
    svg2.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg2.selectAll(".y-axis").remove();
    svg2.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).tickFormat(d => `${(d / 1e9).toFixed(2)} Gt`));
}

    // Event Listeners
    let currentType = "countries";
    let currentYear = "all";
    let currentSortKey = "total";

    // Gestion des clics pour les boutons d'émissions (Page 1)
    document.querySelectorAll("#emission-type1 .emission-option").forEach(button => {
        button.addEventListener("click", function () {
            document.querySelectorAll("#emission-type1 .emission-option").forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
            currentSortKey = this.id.includes("global") ? "global" :
                this.id.includes("industrial") ? "industrial" : "deforestation";
            updateBubbleChart(currentType, currentYear, currentSortKey);
        });
    });

    // Gestion des clics pour les boutons d'émissions (Page 2)
    document.querySelectorAll("#emission-type2 .emission-option").forEach(button => {
        button.addEventListener("click", function () {
            document.querySelectorAll("#emission-type2 .emission-option").forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
            currentSortKey = this.id.includes("global") ? "global" :
                this.id.includes("industrial") ? "industrial" : "deforestation";
            updateBarChart(currentType, currentYear, currentSortKey);
        });
    });

document.querySelectorAll("#entity-toggle .toggle-button").forEach(button => {
    button.addEventListener("click", function () {
        document.querySelectorAll("#entity-toggle .toggle-button").forEach(btn => btn.classList.remove("active"));
        this.classList.add("active");
        const selectedType = this.getAttribute("data-value");
        currentType = selectedType;
        updateBubbleChart(currentType, currentYear, currentSortKey);
    });
});


    d3.select("#year-select1").on("change", function () {
        currentYear = this.value;
        updateBubbleChart(currentType, currentYear, currentSortKey);
    });

document.querySelectorAll("#entity-toggle-bar .toggle-button").forEach(button => {
    button.addEventListener("click", function () {
        document.querySelectorAll("#entity-toggle-bar .toggle-button").forEach(btn => btn.classList.remove("active"));
        this.classList.add("active");
        const selectedType = this.getAttribute("data-value");
        currentType = selectedType;
        updateBarChart(currentType, currentYear, currentSortKey);
    });
});


    d3.select("#year-select2").on("change", function () {
        currentYear = this.value;
        updateBarChart(currentType, currentYear, currentSortKey);
    });

    // Initial charts update
    updateBubbleChart(currentType, currentYear, currentSortKey);
    updateBarChart(currentType, currentYear, currentSortKey);

});