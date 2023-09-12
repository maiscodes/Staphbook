/*
    *  This file contains the functions that are used to create the functional network
    *  visualisation on the result page
    *
    *  - Populate the network graph
    *  - Deal with filters
    *
*/

// grab the sample name from the url param sampleSelection=sampleName
const regex = /sampleSelection=(.*)/
const thisSample = regex.exec(window.location.href)[1]
if (thisSample === null) {
    console.error("Cytoscape: No sample name found in url")
}

let cy;

function createNetwork() {
    const cy = cytoscape({
        container: document.getElementById('cy'),
        elements: [
            // nodes
            { data: { id: thisSample }, style: { 'background-color': 'grey' } }
        ],
        style: [{
            selector: 'node', style: { 'background-color': '#468e94', label: 'data(id)' },
        }, {
            selector: 'edge', style: { 'curve-style': 'bezier', 'control-point-step-size': 10 }
        }
        ],
    });
    return cy;
}


// get the data from the server
// we want:
//  1. sample names
//  2. sample metadata
//  3. distance from this sample to that sample
async function fetchCloseSamples() {
    const res = await fetch('/getCloseSamples/?sampleId=' + thisSample);
    const data = await res.json();
    console.log(data)
    return data;
}

function populateNetwork(cy, data) {
    const collection = cy.collection();
    // iterate through all the data, adding a connection between the sample and the other
    const colors = {
        'sequence_type': 'green',
        'time_of_sampling': 'purple',
        'isolation_location': 'red',
        'species': 'teal',
        'isolation_species': 'blue',
        'isolation_source': 'orange',
    }
    const thisData = data.filter((other) => other.sample_id === thisSample)[0];

    data.forEach((other) => {
        if (other.sample_id === thisSample) return;
        // work out what is common (but not empty or null) between the two samples
        const common = Object.keys(thisData).filter((key) => {
            return thisData[key] === other[key] && thisData[key] !== null && thisData[key] !== '-' && thisData[key] !== 'null'
        });
        if (common.length === 0) {
            return;
        }
        // add the node
        collection.merge(cy.add({
            data: { id: other.sample_id, ...other },
        }));
        // get the node element
        const el = cy.getElementById(other.sample_id);
        el.on('click', () => {
            // add the popup
            popupS.confirm({
                content: `<div class="popup">
                        <h3>${other.sample_id}</h3>
                        <p>Sequence type: ${other.sequence_type}</p>
                        <p>Time of sampling: ${other.time_of_sampling}</p>
                        <p>Isolation location: ${other.isolation_location}</p>
                        <p>Species: ${other.species}</p>
                        <p>Isolation species: ${other.isolation_species}</p>
                        <p>Isolation source: ${other.isolation_source}</p>
                    </div>`,
                labelOk: 'View',
                labelCancel: 'Close',
                additionalButtonCancelClass: 'popUpButtonCSS',
                additionalButtonOkClass: 'popUpButtonCSS',
                onSubmit: function() {
                    window.location.href = '/result/?sampleSelection=' + other.sample_id;
                }
            });
        });
        // display the collection
        console.log(collection);
        // add the edges
        common.forEach((key) => {
            collection.merge(cy.add({
                data: {
                    id: thisSample + '-' + other.sample_id + '-' + key,
                    source: thisSample,
                    target: other.sample_id,
                },
                classes: key,
                style: {
                    'line-color': colors[key]
                }

            }));
        });
    });

    cy.layout({
        name: 'cola'
    }).run()

}

/**
    * Updates the graph based on filters
    * Minimum connections
    * Maximum distance
*/
function updateCytoscape() {
    const minConnections = document.getElementById('cyMinConnections').value;
    const maxDistance = document.getElementById('cyMaxDistance').value;
    cy.elements().forEach((el) => {
        if (el.isNode()) {
            const connections = el.connectedEdges().length;
            if (connections < minConnections) {
                el.style('display', 'none');
                return;
            } else {
                el.style('display', 'element');
            }
            const distance = el.data('distance');
            if (distance > maxDistance) {
                el.style('display', 'none');
                return;
            } else {
                el.style('display', 'element');
            }
        }
    }
    );
}

// Logic for the slider to select the genetic distance
function makeSlider(element, type) {

    let startX = 0, x = 0;
    const width = document.getElementById("slider").offsetWidth;
    let elementLeft = element.offsetLeft;
    let otherLeft = 0;

    element.onmousedown = dragMouseDown;

    // update text on first load
    if (type === "min") {
        element.style.left = 0;
        document.getElementById("minGeneticDist").innerText = 0;
    } else {
        element.style.left = width;
        document.getElementById("maxGeneticDist").innerText = 1;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        startX = e.clientX;
        elementLeft = element.offsetLeft;
        otherLeft = type === "min" ? document.getElementById("maxGeneticDistThumb").style.left : document.getElementById("minGeneticDistThumb").style.left;
        otherLeft = otherLeft === "" ? 0 : parseInt(otherLeft);
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        dx = e.clientX - startX;
        let newLeft = elementLeft + dx;
        if (newLeft < 0) {
            newLeft = 0;
        }
        if (newLeft > width) {
            newLeft = width;
        }
        // prevent going over 'other' slider
        if (type === "min" && newLeft > otherLeft) {
            newLeft = otherLeft - 1;
        }
        if (type === "max" && newLeft < otherLeft) {
            newLeft = otherLeft + 1;
        }
        element.style.left = newLeft + "px";
        // calculate as percentage
        newValue = newLeft / width;



        // update label with new value (6dp)
        const selectedSlider = document.getElementById("selectedSlider");

        if (type === "min") {
            selectedSlider.style.left = newLeft + "px";
            document.getElementById("minGeneticDist").innerText = newValue.toFixed(4);
        } else {
            selectedSlider.style.right = width - newLeft + "px";
            document.getElementById("maxGeneticDist").innerText = newValue.toFixed(4);
        }
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        populateFriendsSection();
    }
}


function populateFriendsSection(data) {
    let parentSection = document.getElementById("findMyFriendsCards"); // Now create cards
    parentSection.innerHTML = "";
    let count = 0;
    const min_dist = document.getElementById("minGeneticDist").innerText;
    const max_dist = document.getElementById("maxGeneticDist").innerText;

    data.forEach(function(sample) {
        // skip if out of range
        if (sample.distance < min_dist - 0.0001 || sample.distance > max_dist + 0.0001) {
            return;
        }
        genomeCard = createGenomeCard(sample);
        parentSection.appendChild(genomeCard);

        tag = parentSection.getElementsByClassName("geneticDistanceTag")[count]; // Position the tag
        card = parentSection.getElementsByClassName("genomeCard")[count];
        tag.setAttribute("style", `z-index: 1; top: ${- 1 * 0.5 * tag.clientHeight}px; left: ${0.5 * card.clientWidth}px; width: ${0.6 * card.clientWidth}px;`);
        count++;
    });
}

function createGenomeCard(sample) {
    let newCard = document.createElement("button");
    newCard.setAttribute("class", "genomeCard");
    newCard.setAttribute("name", "sampleSelection");
    newCard.setAttribute("value", `${sample.sample_id}`);
    newCard.setAttribute("onclick", "window.location.href='/result'");
    newCard.setAttribute("type", "submit");

    let info = document.createElement("p");

    let display = `<div class="genomeCardSampleId"><h4>${sample.sample_id}</h4></div>
        <div class="genomeCardSampleMetadata" style="text-align:left"> 
            <p>Species: ${sample.species}</p>
            <p>Sequence type: ${sample.sequence_type}</p>
            <p>Location: ${sample.isolation_location}</p>
            <p>Isolation Host: ${sample.isolation_species}</p>
            <p>Isolation Source: ${sample.isolation_source}</p>
        </div>
       <div class="geneticDistanceTag">${sample.distance}</div>`;

    info.innerHTML = display;
    newCard.innerHTML = info.outerHTML;

    return newCard;
}


window.onload = async function() {
    cy = createNetwork();
    const data = await fetchCloseSamples();
    populateNetwork(cy, data);

    const minSlider = document.getElementById("minGeneticDistThumb");
    const maxSlider = document.getElementById("maxGeneticDistThumb");
    makeSlider(minSlider, "min");
    makeSlider(maxSlider, "max");
    populateFriendsSection(data);
}



