const width = 960; // Largeur de la carte
const height = 600; // Hauteur de la carte

const svg = d3.select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Définir une projection géographique ajustée
const projection = d3.geoMercator()
    .scale(120) // Ajuster l'échelle pour inclure tous les pays
    .translate([width / 2, height / 2]); // Centre la carte dans le SVG

const path = d3.geoPath().projection(projection);

// Échelle de couleur pour les températures
const colorScale = d3.scaleLinear()
    .domain([-5, 0, 5]) // Ajustez selon vos données
    .range(["blue", "white", "red"]);

// Table de correspondance des noms des pays
const countryNameMapping = {
    "Russian Federation": "Russia",
    "Venezuela (Bolivarian Republic of)": "Venezuela",
    "Democratic Republic of the Congo": "Dem. Rep. Congo",
    "Iran (Islamic Republic of)": "Iran",
    "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
    "Syrian Arab Republic": "Syria",
    "Republic of Moldova": "Moldova",
    "Viet Nam": "Vietnam",
    "Lao People's Democratic Republic": "Laos",
    "Bolivia (Plurinational State of)": "Bolivia",
    "Micronesia (Federated States of)": "Micronesia",
    "China, Hong Kong SAR": "Hong Kong",
    "China, Macao SAR": "Macao",
    "Bosnia and Herzegovina": "Bosnia and Herz.",
    "North Macedonia": "Macedonia"
};

// Fonction pour normaliser les noms des pays
function normalizeCountryName(name) {
    return countryNameMapping[name] || name; // Retourne le nom mappé ou le nom original si non trouvé
}

// Liste des mois (dans l'ordre)
const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Ajouter un conteneur pour le tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

// Charger les données GeoJSON et CSV
Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
    d3.csv("https://raw.githubusercontent.com/Elkhilyass/Projet-Data-Vis/refs/heads/main/temperature_changement.csv")
]).then(([world, data]) => {
    const countries = topojson.feature(world, world.objects.countries);

    // Normaliser les noms des pays dans les données CSV
    data.forEach(d => {
        d.Area = normalizeCountryName(d.Area);
    });

    const dataByYearMonthAndCountry = d3.group(data, d => d.Year, d => d.Months, d => d.Area);

    // Fonction pour mettre à jour la carte
    const updateMap = (year, month) => {
        const monthData = dataByYearMonthAndCountry.get(String(year))?.get(month) || new Map();

        svg.selectAll("path")
            .data(countries.features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                const countryData = monthData.get(d.properties.name);
                if (!countryData) return "lightgray"; // Pas de données
                const value = +countryData[0]?.Value;
                return isNaN(value) ? "lightgray" : colorScale(value);
            })
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 0.5)
            // Événements pour le tooltip
            .on("mouseover", function (event, d) {
                const countryData = monthData.get(d.properties.name);
                const value = countryData ? countryData[0]?.Value : "NaN";
                tooltip.style("visibility", "visible")
                    .style("opacity", 1)
                    .html(`
                        <strong>Pays :</strong> ${d.properties.name || "Non disponible"}<br>
                        <strong>Changement de température :</strong> ${value}
                    `);
            })
            .on("mousemove", function (event) {
                tooltip.style("top", (event.pageY + 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden")
                    .style("opacity", 0);
            })
            .on("click", function (event, d) {
                const countryName = d.properties.name;
                const countryDataByYear = d3.group(data.filter(row => row.Area === countryName), d => d.Year);

                if (!countryDataByYear.size) {
                    alert(`Pas de données disponibles pour ${countryName}`);
                    return;
                }

                drawChart(countryName, countryDataByYear);
            });
    };

    // Fonction pour dessiner un graphique des données annuelles d'un pays
    function drawChart(countryName, countryDataByYear) {
        // Effacer le contenu précédent
        d3.select("#chart-container").html("");

        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const chartWidth = 600 - margin.left - margin.right;
        const chartHeight = 300 - margin.top - margin.bottom;
        console.log(values); // Affiche les données pour vérifier la présence de valeurs négatives


        // Créer un SVG pour le graphique
        const svg = d3.select("#chart-container")
            .append("svg")
            .attr("width", chartWidth + margin.left + margin.right)
            .attr("height", chartHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Préparer les données pour le graphique
        const years = Array.from(countryDataByYear.keys()).sort();
        const values = years.map(year => d3.sum(countryDataByYear.get(year), d => +d.Value || 0));

        // Créer des échelles
        const xScale = d3.scaleBand()
            .domain(years)
            .range([0, chartWidth])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(values)])
            .range([chartHeight, 0]);

        // Ajouter l'axe X
        svg.append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((_, i) => i % 5 === 0))) // Affiche un tick tous les 5 ans
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Ajouter l'axe Y
        svg.append("g").call(d3.axisLeft(yScale));

        // Ajouter les lignes de données
        const line = d3.line()
            .x((d, i) => xScale(years[i]))
            .y(d => yScale(d));

        svg.append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", "orange")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Ajouter un titre
        svg.append("text")
            .attr("x", chartWidth / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(`Annual temperature changes for ${countryName}`);
    }
  
  function drawChart(countryName, countryDataByYear) {
    // Vérifier si le conteneur de la pop-up existe, sinon le créer
    let chartPopup = d3.select("#chart-popup");
    if (chartPopup.empty()) {
        chartPopup = d3.select("body")
            .append("div")
            .attr("id", "chart-popup")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("border-radius", "8px")
            .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.2)")
            .style("padding", "20px")
            .style("width", "600px")
            .style("height", "350px");
    }

    // Effacer le contenu précédent
    chartPopup.html("");

    // Ajouter un bouton "X" pour fermer la pop-up
    chartPopup
        .append("button")
        .text("X")
        .style("position", "absolute")
        .style("top", "10px")
        .style("right", "10px")
        .style("background", "#f44336")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "5px")
        .style("cursor", "pointer")
        .style("font-size", "16px")
        .on("click", () => {
            chartPopup.style("visibility", "hidden"); // Cacher la pop-up au clic
        });
chartPopup
    .style("visibility", "visible")
    .style("opacity", 0) // Début de l'animation
    .style("top", `${window.innerHeight / 2 - 200}px`)
    .style("left", `${window.innerWidth / 2 - 300}px`)
    .transition()
    .duration(300)
    .style("opacity", 1); // Apparition progressive

    // Création du graphique dans la pop-up
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const chartWidth = 600 - margin.left - margin.right;
    const chartHeight = 300 - margin.top - margin.bottom;

    const svg = chartPopup
        .append("svg")
        .attr("width", chartWidth + margin.left + margin.right)
        .attr("height", chartHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Préparer les données pour le graphique
    const years = Array.from(countryDataByYear.keys()).sort();
    const values = years.map(year => d3.sum(countryDataByYear.get(year), d => +d.Value || 0));

    const xScale = d3.scaleBand()
        .domain(years)
        .range([0, chartWidth])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(values)])
        .nice()
        .range([chartHeight, 0]);

    // Ajouter les axes
    svg.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((_, i) => i % 5 === 0)));

    svg.append("g").call(d3.axisLeft(yScale));

    // Ajouter un label pour l'axe Y
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -chartHeight / 2)
        .attr("y", -margin.left + 15)
        .style("text-anchor", "middle")
        .text("Degrés");

    // Ajouter une courbe
    const line = d3.line()
        .x((_, i) => xScale(years[i]) + xScale.bandwidth() / 2)
        .y(d => yScale(d));

    svg.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Ajouter un titre
    svg.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(`Annual temperature changes for ${countryName}`);

    // Afficher la pop-up au centre
    chartPopup
        .style("visibility", "visible")
        .style("top", `${window.innerHeight / 2 - 200}px`)
        .style("left", `${window.innerWidth / 2 - 300}px`);
}


  function updateStats(year, month) {
    const monthData = dataByYearMonthAndCountry.get(String(year))?.get(month) || new Map();

    const differences = Array.from(monthData.values()).map(d => +d[0]?.Value).filter(v => !isNaN(v));
    if (differences.length === 0) {
        d3.select("#highest-diff").text("Pays avec la plus haute différence : Pas de données");
        d3.select("#lowest-diff").text("Pays avec la plus basse différence : Pas de données");
        d3.select("#avg-diff").text("Moyenne des différences : Pas de données");
        d3.select("#median-diff").text("Médiane des différences : Pas de données");
        d3.select("#std-dev").text("Écart-type : Pas de données");
        d3.select("#reporting-countries").text("Nombre de pays reportant des données : 0");
        return;
    }

    const maxDiff = d3.max(differences);
    const minDiff = d3.min(differences);
    const avgDiff = d3.mean(differences);
    const medianDiff = d3.median(differences);
    const stdDev = d3.deviation(differences);

    const highestCountry = Array.from(monthData.entries()).find(([_, v]) => +v[0]?.Value === maxDiff)?.[0];
    const lowestCountry = Array.from(monthData.entries()).find(([_, v]) => +v[0]?.Value === minDiff)?.[0];

    d3.select("#highest-diff").text(`Pays avec la plus haute différence : ${highestCountry} (${maxDiff.toFixed(2)})`);
    d3.select("#lowest-diff").text(`Pays avec la plus basse différence : ${lowestCountry} (${minDiff.toFixed(2)})`);
    d3.select("#avg-diff").text(`Moyenne des différences : ${avgDiff.toFixed(2)}`);
    d3.select("#median-diff").text(`Médiane des différences : ${medianDiff.toFixed(2)}`);
    d3.select("#std-dev").text(`Écart-type : ${stdDev.toFixed(2)}`);
    d3.select("#reporting-countries").text(`Nombre de pays reportant des données : ${differences.length}`);
}


    // Mise à jour initiale
    updateMap(1961, "January");

    // Gestion des sliders
    const yearSlider = d3.select("#year-slider");
    const monthSlider = d3.select("#month-slider");
    const yearLabel = d3.select("#year-label");
    const monthLabel = d3.select("#month-label");

yearSlider.on("input", function () {
    const year = +this.value;
    const month = months[monthSlider.node().value];
    yearLabel.text(`Year: ${year}`);
    updateMap(year, month);
    updateStats(year, month);
});

monthSlider.on("input", function () {
    const monthIndex = +this.value;
    const month = months[monthIndex];
    const year = yearSlider.node().value;
    monthLabel.text(`Month: ${month}`);
    updateMap(year, month);
    updateStats(year, month);
});
 
  window.addEventListener("resize", () => {
    if (chartPopup.style("visibility") === "visible") {
        chartPopup
            .style("top", `${window.innerHeight / 2 - 200}px`)
            .style("left", `${window.innerWidth / 2 - 300}px`);
    }
});



// Ajouter la légende verticale à droite
const legendWidth = 20;
const legendHeight = 300;
const legendX = width - 70;
const legendY = 50;

const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendX}, ${legendY})`);

// Dégradé pour la légende
const gradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("x2", "0%")
    .attr("y1", "100%") // Bas
    .attr("y2", "0%"); // Haut

gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "blue"); // Couleur minimale (-5)

gradient.append("stop")
    .attr("offset", "50%")
    .attr("stop-color", "white"); // Couleur neutre (0)

gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "red"); // Couleur maximale (5)

// Ajouter le rectangle de la légende
legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

// Ajouter les étiquettes des valeurs
legend.append("text")
    .attr("x", -10)
    .attr("y", 0)
    .text("5") // Valeur maximale
    .attr("text-anchor", "end")
    .style("font-size", "12px");

legend.append("text")
    .attr("x", -10)
    .attr("y", legendHeight / 2)
    .text("0") // Valeur neutre
    .attr("text-anchor", "end")
    .style("font-size", "12px");

legend.append("text")
    .attr("x", -10)
    .attr("y", legendHeight)
    .text("-5") // Valeur minimale
    .attr("text-anchor", "end")
    .style("font-size", "12px");

// Ajouter un indicateur pour NaN (gris)
legend.append("rect")
    .attr("x", 0)
    .attr("y", legendHeight + 10)
    .attr("width", legendWidth)
    .attr("height", 20)
    .style("fill", "lightgray");

legend.append("text")
    .attr("x", legendWidth / 2)
    .attr("y", legendHeight + 40)
    .text("NaN")
    .attr("text-anchor", "middle")
    .style("font-size", "12px");

// Ajouter une description pour la légende
legend.append("text")
    .attr("x", legendWidth / 2)
    .attr("y", legendHeight + 70)
    .text("Temperature difference")
    .attr("text-anchor", "middle")
    .style("font-size", "12px");

}).catch(error => {
    console.error("Erreur lors du chargement des données :", error);
});
