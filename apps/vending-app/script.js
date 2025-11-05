// Proizvodi - kao u C++ programu
let proizvodi = [
    { naziv: "Coca-Cola", cijena: 1.50, kolicina: 10 },
    { naziv: "Fanta", cijena: 1.50, kolicina: 10 },
    { naziv: "Sprite", cijena: 1.50, kolicina: 10 },
    { naziv: "Pepsi", cijena: 1.40, kolicina: 10 },
    { naziv: "Next sok", cijena: 1.20, kolicina: 10 },
    { naziv: "Voda", cijena: 1.00, kolicina: 10 },
    { naziv: "Red Bull", cijena: 2.00, kolicina: 10 },
    { naziv: "Ice Tea", cijena: 1.30, kolicina: 10 },
    { naziv: "Chips", cijena: 1.80, kolicina: 10 },
    { naziv: "Smoki", cijena: 1.00, kolicina: 10 },
    { naziv: "Čokoladica", cijena: 1.20, kolicina: 10 },
    { naziv: "Bananica", cijena: 0.80, kolicina: 10 },
    { naziv: "Keks", cijena: 1.10, kolicina: 10 },
    { naziv: "Sendvič", cijena: 2.50, kolicina: 10 },
    { naziv: "Croissant", cijena: 1.60, kolicina: 10 },
    { naziv: "Gumene bombone", cijena: 0.90, kolicina: 10 }
];

let novac = 0;
let kupljeniProizvodi = [];

// Unos novca
function unesiNovac() {
    const unosInput = document.getElementById('unosNovca');
    const uneseniNovac = parseFloat(unosInput.value);
    
    if (isNaN(uneseniNovac) || uneseniNovac <= 0) {
        prikaziModal("Greška", "Molimo unesite validan iznos novca!");
        return;
    }
    
    novac = uneseniNovac;
    
    // Sakrij unos, prikaži glavni panel
    document.getElementById('novacUnos').style.display = 'none';
    document.getElementById('glavniPanel').style.display = 'block';
    
    azurirajPrikaz();
    generisiProizvode();
}

// Generisanje proizvoda
function generisiProizvode() {
    const grid = document.getElementById('proizvodiGrid');
    grid.innerHTML = '';
    
    proizvodi.forEach((proizvod, index) => {
        const kartica = document.createElement('div');
        kartica.className = 'proizvod-kartica';
        
        if (proizvod.kolicina === 0) {
            kartica.classList.add('rasprodat');
        }
        
        let kolicinaKlasa = '';
        if (proizvod.kolicina === 0) {
            kolicinaKlasa = 'rasprodat';
        } else if (proizvod.kolicina <= 3) {
            kolicinaKlasa = 'malo';
        }
        
        kartica.innerHTML = `
            <div class="proizvod-naziv">${proizvod.naziv}</div>
            <div class="proizvod-cijena">${proizvod.cijena.toFixed(2)} KM</div>
            <div class="proizvod-kolicina ${kolicinaKlasa}">
                ${proizvod.kolicina > 0 ? `Preostalo: ${proizvod.kolicina}` : 'RASPRODAT'}
            </div>
            <button class="kupi-btn" onclick="kupiProizvod(${index})" 
                    ${proizvod.kolicina === 0 || novac < proizvod.cijena ? 'disabled' : ''}>
                ${proizvod.kolicina === 0 ? 'Rasprodat' : 'Kupi'}
            </button>
        `;
        
        grid.appendChild(kartica);
    });
}

// Kupovina proizvoda
function kupiProizvod(index) {
    const proizvod = proizvodi[index];
    
    // Provjere kao u C++ programu
    if (proizvod.kolicina === 0) {
        prikaziModal("❌ Rasprodat", `Proizvod "${proizvod.naziv}" je rasprodat!`);
        return;
    }
    
    if (novac < proizvod.cijena) {
        prikaziModal("❌ Nedovoljno kredita", 
            `Nemate dovoljno kredita za "${proizvod.naziv}"!\nPotrebno: ${proizvod.cijena.toFixed(2)} KM\nImate: ${novac.toFixed(2)} KM`);
        return;
    }
    
    // Izvršavanje kupovine
    novac -= proizvod.cijena;
    proizvod.kolicina--;
    kupljeniProizvodi.push(proizvod.naziv);
    
    prikaziModal("✅ Uspješna kupovina", 
        `Kupili ste: ${proizvod.naziv}\nPreostalo novca: ${novac.toFixed(2)} KM`);
    
    azurirajPrikaz();
    generisiProizvode();
    prikaziKupljene();
    
    // Provjera da li ima dovoljno novca za dalje kupovine
    const najmanjaZaliha = Math.min(...proizvodi
        .filter(p => p.kolicina > 0)
        .map(p => p.cijena));
    
    if (novac < najmanjaZaliha) {
        setTimeout(() => {
            prikaziModal("ℹ️ Obavještenje", 
                `Nemate dovoljno novca za dalje kupovine.\nVaš preostali novac: ${novac.toFixed(2)} KM\n\nHvala na kupovini!`);
        }, 500);
    }
}

// Prikaz kupljenih proizvoda
function prikaziKupljene() {
    const panel = document.getElementById('kupljeniPanel');
    const lista = document.getElementById('kupljeniLista');
    
    if (kupljeniProizvodi.length === 0) {
        panel.style.display = 'none';
        return;
    }
    
    panel.style.display = 'block';
    lista.innerHTML = '';
    
    // Brojanje ponavljanja
    const brojac = {};
    kupljeniProizvodi.forEach(naziv => {
        brojac[naziv] = (brojac[naziv] || 0) + 1;
    });
    
    for (const [naziv, kolicina] of Object.entries(brojac)) {
        const li = document.createElement('li');
        li.textContent = kolicina > 1 ? `${naziv} x${kolicina}` : naziv;
        lista.appendChild(li);
    }
}

// Azuriranje prikaza kredita
function azurirajPrikaz() {
    document.getElementById('kreditIznos').textContent = novac.toFixed(2) + ' KM';
}

// Kraj kupovine
function krajKupovine() {
    prikaziModal("💰 Kraj kupovine", 
        `Vaš višak novca: ${novac.toFixed(2)} KM\n\nHvala na kupovini!`);
    
    setTimeout(() => {
        location.reload(); // Reset aplikacije
    }, 2500);
}

// Modal funkcije
function prikaziModal(naslov, poruka) {
    document.getElementById('modalNaslov').textContent = naslov;
    document.getElementById('modalPoruka').textContent = poruka;
    document.getElementById('modal').classList.add('show');
}

function zatvoriModal() {
    document.getElementById('modal').classList.remove('show');
}

// Zatvori modal klikom van njega
document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) {
        zatvoriModal();
    }
});

// Enter na input polju
document.getElementById('unosNovca').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        unesiNovac();
    }
});
