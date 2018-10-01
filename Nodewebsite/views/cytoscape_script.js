            var cy = cytoscape({
                    container: document.getElementById('cy'),
                    elements: [
                        // nodes
                        { data: { id: 'Genome' } }
                    ],

                    style: [
                        {
                            selector: 'node',
                            style: {
                                shape: 'circle',
                                'background-color': '#468e94',
                                label: 'data(id)'
                            }
                        }],
                });
                for (var i = 0; i < 10; i++) {
                    cy.add({
                            data: { id: 'Neighbour' + i }
                        }
                    );
                    var source = 'Neighbour' + i;
                    cy.add({
                        data: {
                            id: 'edge' + i,
                            source: source,
                            target: ('Genome')
                        }
                    });
                }
                cy.layout({
                    name: 'cola'
                }).run();