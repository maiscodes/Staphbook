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
        'sq': 'red',
        'location': 'blue',
        'host': 'green',
        'species': 'yellow',
        'isolation_source': 'orange',
    }
    const thisData = data.filter((other) => other.sample_id === thisSample)[0];

    data.forEach((other) => {
        if(other.sample_id === thisSample) return;
        // work out what is common (but not empty or null) between the two samples
        const common = Object.keys(thisData).filter((key) => {
            return thisData[key] === other[key] && thisData[key] !== null && thisData[key] !== '-' && thisData[key] !== 'null'
        });
        if (common.length === 0) {
            return;
        }
        // add the node
        collection.merge(cy.add({
            data: { id:other.sample_id, ...other },
        }));
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


window.onload = async function() {
    const cy = createNetwork();
    const data = await fetchCloseSamples();
    populateNetwork(cy, data);
}



