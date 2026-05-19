// URL do surowego pliku CSV na GitHub
const CSV_URL = 'https://raw.githubusercontent.com/maciekzmga-sudo/wine4you-data/main/tak.csv';
const IMAGES_BASE_URL = 'https://raw.githubusercontent.com/maciekzmga-sudo/wine4you-data/main/';

let allWines = [];
let filteredWines = [];

// Pobierz i parsuj CSV
async function loadWines() {
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        
        allWines = parseCSV(csvText);
        filteredWines = [...allWines];
        
        populateCountryFilter();
        displayWines(filteredWines);
        updateWineCount();
        
    } catch (error) {
        console.error('Błąd ładowania danych:', error);
        document.getElementById('wineList').innerHTML = 
            '<p class="no-results">Błąd ładowania danych. Sprawdź połączenie z internetem.</p>';
    }
}

// Parsowanie CSV
function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const wines = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = parseCSVLine(lines[i]);
        const wine = {};
        
        headers.forEach((header, index) => {
            wine[header] = values[index] ? values[index].trim() : '';
        });
        
        // Konwersja ceny na liczbę
        if (wine['CENA NETTO']) {
            wine.priceNumeric = parseFloat(wine['CENA NETTO'].replace(',', '.').replace(/[^\d.]/g, ''));
        }
        
        wines.push(wine);
    }
    
    return wines;
}

// Parsowanie linii CSV (obsługa przecinków w cudzysłowach)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

// Wypełnij filtr krajów
function populateCountryFilter() {
    const countries = [...new Set(allWines.map(w => w.KRAJ).filter(c => c))].sort();
    const countryFilter = document.getElementById('countryFilter');
    
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });
}

// Wyświetl wina
function displayWines(wines) {
    const wineList = document.getElementById('wineList');
    if (wines.length === 0) {
        wineList.innerHTML = '<p class="no-results">Nie znaleziono win spełniających kryteria.</p>';
        return;
    }
    
    wineList.innerHTML = wines.map(wine => `
        <div class="wine-card" onclick="showWineDetails('${wine.ID}')">
            ${wine.IMAGES ? 
                `<img src="${IMAGES_BASE_URL}${wine.IMAGES}" alt="${wine['NAZWA WINA']}" class="wine-image" onerror="this.outerHTML='<div class=wine-image-placeholder>🍷</div>'">` :
                `<div class="wine-image-placeholder">🍷</div>`
            }
            <div class="wine-info">
                <span class="wine-id">${wine.ID}</span>
                <h3 class="wine-name">${wine['NAZWA WINA']}</h3>
                <p class="wine-origin">${wine.POCHODZENIE || ''}</p>
                <span class="wine-type ${wine.KOLOR}">${wine.KOLOR}</span>
                <p class="wine-price">${wine['CENA NETTO']} zł</p>
            </div>
        </div>
    `).join('');
}

// Pokaż szczegóły wina w modalu
function showWineDetails(wineId) {
    const wine = allWines.find(w => w.ID === wineId);
    if (!wine) return;
    
    const modal = document.getElementById('wineModal');
    const details = document.getElementById('wineDetails');
    
    details.innerHTML = `
        <div class="wine-detail-container">
            <div>
                ${wine.IMAGES ? 
                    `<img src="${IMAGES_BASE_URL}${wine.IMAGES}" alt="${wine['NAZWA WINA']}" class="wine-detail-image" onerror="this.outerHTML='<div class=wine-image-placeholder style=height:400px>🍷</div>'">` :
                    `<div class="wine-image-placeholder" style="height:400px">🍷</div>`
                }
            </div>
            <div class="wine-detail-info">
                <span class="wine-id">${wine.ID}</span>
                <h2>${wine['NAZWA WINA']}</h2>
                <p><strong>Rocznik:</strong> ${wine.ROK ||'N/A'}</p>
                <p><strong>Kolor:</strong> <span class="wine-type ${wine.KOLOR}">${wine.KOLOR}</span></p>
                <p><strong>Pochodzenie:</strong> ${wine.POCHODZENIE || 'N/A'}</p>
                <p><strong>Kraj:</strong> ${wine.KRAJ || 'N/A'}</p>
                <p><strong>Szczep:</strong> ${wine.SZCZEP || 'N/A'}</p>
                <p><strong>Alkohol:</strong> ${wine['ALK.'] || 'N/A'}%</p>
                <p><strong>Pojemność:</strong> ${wine['POJ.'] || 'N/A'}</p>
                ${wine.BECZKA ? `<p><strong>Beczka:</strong> ${wine.BECZKA}</p>` : ''}
                <p class="wine-price" style="font-size: 2rem; margin-top: 1rem;">${wine['CENA NETTO']} zł</p>${wine.OPIS ? `<div class="wine-description"><strong>Opis:</strong><br>${wine.OPIS}</div>` : ''}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Aktualizuj licznik win
function updateWineCount() {
    document.getElementById('wineCount').textContent = 
        `Znaleziono: ${filteredWines.length} win (z ${allWines.length})`;
}

// Filtrowanie
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const colorFilter = document.getElementById('colorFilter').value;
    const countryFilter = document.getElementById('countryFilter').value;
    const priceMin = parseFloat(document.getElementById('priceMin').value) || 0;
    const priceMax = parseFloat(document.getElementById('priceMax').value) || Infinity;
    
    filteredWines = allWines.filter(wine => {
        const matchesSearch = wine.ID.toLowerCase().includes(searchTerm) || 
                            wine['NAZWA WINA'].toLowerCase().includes(searchTerm);
        const matchesColor = !colorFilter || wine.KOLOR === colorFilter;
        const matchesCountry = !countryFilter || wine.KRAJ === countryFilter;
        const matchesPrice = wine.priceNumeric >= priceMin && wine.priceNumeric <= priceMax;
        
        return matchesSearch && matchesColor && matchesCountry && matchesPrice;
    });
    
    displayWines(filteredWines);
    updateWineCount();
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('colorFilter').addEventListener('change', applyFilters);
document.getElementById('countryFilter').addEventListener('change', applyFilters);
document.getElementById('priceMin').addEventListener('input', applyFilters);
document.getElementById('priceMax').addEventListener('input', applyFilters);

document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('colorFilter').value = '';
    document.getElementById('countryFilter').value = '';
    document.getElementById('priceMin').value = '';
    document.getElementById('priceMax').value = '';
    applyFilters();
});

// Zamknij modal
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('wineModal').style.display = 'none';
});

window.addEventListener('click', (e) => {
    const modal = document.getElementById('wineModal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Załaduj wina przy starcie
loadWines();
