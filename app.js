let items = [];

window.onload = function() {
    fetch('loja_de_roupas_ultimos_itens.txt')
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n');
            let currentItem = {};

            lines.forEach(line => {
                if (line.startsWith('Nome:')) {
                    currentItem.name = line.replace('Nome: ', '');
                } else if (line.startsWith('Descrição:')) {
                    currentItem.description = line.replace('Descrição: ', '');
                } else if (line.startsWith('Preço:')) {
                    currentItem.price = line.replace('Preço: ', '');
                } else if (line.startsWith('Imagem:')) {
                    currentItem.image = line.replace('Imagem: ', '');
                    items.push(currentItem);
                    currentItem = {};
                }
            });
            createIndex(items);
        })
        .catch(error => console.error('Erro ao carregar o arquivo de dados:', error));
};

let tfidf = {};
let totalTerms = {};

function createIndex(items) {
    items.forEach((item, itemId) => {
        let terms = item.description.toLowerCase().replace(/\W/g, ' ').split(' ');
        terms.forEach(term => {
            if (!tfidf[term]) {
                tfidf[term] = { docFreq: 0, docIds: {} };
            }
            if (!tfidf[term].docIds[itemId]) {
                tfidf[term].docIds[itemId] = 0;
                tfidf[term].docFreq++;
            }
            tfidf[term].docIds[itemId]++;
        });
    });
    const totalDocuments = items.length;
    Object.keys(tfidf).forEach(term => {
        let idf = Math.log(totalDocuments / tfidf[term].docFreq);
        Object.keys(tfidf[term].docIds).forEach(docId => {
            tfidf[term].docIds[docId] *= idf;
        });
    });
}

function searchItems() {
    const query = document.getElementById('search-input').value.toLowerCase().replace(/\W/g, ' ').split(' ');
    let scores = Array(items.length).fill(0);

    query.forEach(term => {
        if (tfidf[term]) {
            Object.keys(tfidf[term].docIds).forEach(docId => {
                scores[docId] += tfidf[term].docIds[docId];
            });
        }
    });

    const rankedItems = scores.map((score, itemId) => ({ itemId, score }))
                              .sort((a, b) => b.score - a.score);

    displayResults(rankedItems);
}

function displayResults(rankedItems) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    rankedItems.forEach(({ itemId, score }) => {
        if (score > 0) {
            const item = items[itemId];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            itemDiv.innerHTML = `
                <h2>${item.name}</h2>
                <img src="${item.image}" alt="${item.name}">
                <p>${item.description}</p>
                <p><strong>Preço:</strong> ${item.price}</p>
            `;
            resultsDiv.appendChild(itemDiv);
        }
    });
}
