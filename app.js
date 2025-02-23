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
        let terms = item.name.toLowerCase().replace(/\W/g, ' ').split(' ')
                        .concat(item.description.toLowerCase().replace(/\W/g, ' ').split(' '));
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

function evaluatePerformance(rankedItems, relevantItems) {
    let relevantRetrieved = 0;
    rankedItems.forEach((item, index) => {
        if (relevantItems.includes(item.itemId)) relevantRetrieved++;
    });

    const precision = relevantRetrieved / rankedItems.length;
    const recall = relevantRetrieved / relevantItems.length;
    const f1Score = 2 * (precision * recall) / (precision + recall);

    console.log(`Precisão: ${precision.toFixed(2)}, Revocação: ${recall.toFixed(2)}, F1-Score: ${f1Score.toFixed(2)}`);
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

    const relevantItems = [0, 2, 3];
    evaluatePerformance(rankedItems, relevantItems);
}

function suggestSimilarItems(itemId, numberOfItems) {
    const item = items[itemId];
    let itemTerms = item.name.toLowerCase().replace(/\W/g, ' ').split(' ')
                    .concat(item.description.toLowerCase().replace(/\W/g, ' ').split(' '));
    let scores = Array(items.length).fill(0);

    itemTerms.forEach(term => {
        if (tfidf[term]) {
            Object.keys(tfidf[term].docIds).forEach(docId => {
                scores[docId] += tfidf[term].docIds[docId];
            });
        }
    });

    const rankedItems = scores.map((score, itemId) => ({ itemId, score }))
                              .sort((a, b) => b.score - a.score)
                              .filter(rankItem => rankItem.itemId !== itemId);

    return rankedItems.slice(0, numberOfItems).map(rankItem => items[rankItem.itemId]);
}

function displayResults(rankedItems) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    rankedItems.forEach(rankItem => {
        const item = items[rankItem.itemId];
        const itemElement = document.createElement('div');
        itemElement.className = 'item';

        const itemImage = document.createElement('img');
        itemImage.src = item.image;
        itemElement.appendChild(itemImage);

        const itemName = document.createElement('h3');
        itemName.innerText = item.name;
        itemElement.appendChild(itemName);

        const itemDescription = document.createElement('p');
        itemDescription.innerText = item.description;
        itemElement.appendChild(itemDescription);

        const itemPrice = document.createElement('span');
        itemPrice.innerText = `Preço: ${item.price}`;
        itemElement.appendChild(itemPrice);

        itemElement.addEventListener('click', () => {
            const similarItems = suggestSimilarItems(rankItem.itemId, 5);
            openModal(similarItems);
        });

        resultsContainer.appendChild(itemElement);
    });
}

function openModal(similarItems) {
    const modal = document.getElementById('suggestionsModal');
    const suggestionsContainer = document.getElementById('suggestions');
    suggestionsContainer.innerHTML = '';

    similarItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';

        const itemImage = document.createElement('img');
        itemImage.src = item.image;
        itemElement.appendChild(itemImage);

        const itemName = document.createElement('h3');
        itemName.innerText = item.name;
        itemElement.appendChild(itemName);

        const itemDescription = document.createElement('p');
        itemDescription.innerText = item.description;
        itemElement.appendChild(itemDescription);

        const itemPrice = document.createElement('span');
        itemPrice.innerText = `Preço: ${item.price}`;
        itemElement.appendChild(itemPrice);

        suggestionsContainer.appendChild(itemElement);
    });

    modal.style.display = 'block';

    const closeButton = document.getElementsByClassName('close')[0];
    closeButton.onclick = function() {
        modal.style.display = 'none';
    }

    // Close the modal if the user clicks outside of the modal content
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}
