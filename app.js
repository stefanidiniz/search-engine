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
        })
        .catch(error => console.error('Erro ao carregar o arquivo de dados:', error));
};

function createIndex(items) {
    const index = {};
    items.forEach((item, itemId) => {
        item.description.split(' ').forEach(term => {
            term = term.toLowerCase().replace(/\W/g, '');
            if (!index[term]) index[term] = [];
            index[term].push(itemId);
        });
    });
    return index;
}

function searchItems() {
    const query = document.getElementById('search-input').value.toLowerCase().replace(/\W/g, '').split(' ');
    const index = createIndex(items);
    const scores = Array(items.length).fill(0);

    query.forEach(term => {
        if (index[term]) {
            index[term].forEach(itemId => {
                scores[itemId]++;
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
