

function viewReportedProduct(productId) {
    if (!productId) {
        spawnToast("Questo prodotto è stato rimosso", "info");
        return;
    }

    ProductState.fetchProducts({product_id: productId})
        .then(res => res.json())
        .then(products => {
            if (products.length > 0) {
                ProductState.setSelectedProduct(products[0]);
                switchPage('product_details');
            } else {
                spawnToast("Prodotto non più disponibile", "warning");
            }
        })
        .catch(err => {
            console.error("Errore nel caricamento del prodotto:", err);
            spawnToast("Errore nel caricamento del prodotto", "error");
        });
}

function resolveReport(productId) {
    if (!confirm("Sei sicuro di voler risolvere questa segnalazione? Il prodotto non verrà rimosso.")) {
        return;
    }


    const token = localStorage.getItem("token");

    fetch(`http://localhost:900/admin/reports/${productId}/resolve`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`Errore: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            spawnToast("Segnalazione risolta con successo", "success");
            loadAdminPage();
        })
        .catch(err => {
            console.error("Errore nella risoluzione della segnalazione:", err);
            spawnToast("Errore nella risoluzione della segnalazione", "error");
        });
}

function removeReportedProduct(productId, sellerId) {
    // Chiedi conferma
    const message = prompt("Vuoi inviare un messaggio all'artigiano? (opzionale)");

    if (message === null) {
        // L'utente ha annullato
        return;
    }

    if (!confirm("Sei sicuro di voler rimuovere questo prodotto?")) {
        return;
    }

    const token = localStorage.getItem("token");

    fetch(`http://localhost:900/admin/product/${productId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({message: message || ""})
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`Errore: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            spawnToast("Prodotto rimosso con successo", "success");
            // Ricarica la pagina admin e aggiorna lo stato dei prodotti
            ProductState.removeAllProducts()
            loadAdminPage();
        })
        .catch(err => {
            console.error("Errore nella rimozione del prodotto:", err);
            spawnToast("Errore nella rimozione del prodotto", "error");
        });
}

const loadReports = () => {
    const reportedProductsDiv = document.getElementById("reported-products");

    // Aggiorna stato visuale dei bottoni
    document.getElementById("view-pending").classList.add("active");
    document.getElementById("view-history").classList.remove("active");

    reportedProductsDiv.innerHTML = '<div class="loading">Caricamento segnalazioni pendenti...</div>';

    const token = localStorage.getItem("token");
    fetch("http://localhost:900/admin/reports", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`Il server ha risposto con stato: ${res.status}`);
            }
            return res.json();
        })
        .then(reports => {
            if (reports.length === 0) {
                reportedProductsDiv.innerHTML = `
                <div class="no-reports">
                    <h3>✅ Nessuna segnalazione pendente</h3>
                    <p>Ottimo lavoro! Non ci sono prodotti segnalati al momento.</p>
                </div>
            `;
                return;
            }

            // Aggregazione delle segnalazioni per prodotto
            const aggregatedReports = {};
            reports.forEach(report => {
                if (!aggregatedReports[report.product_id]) {
                    aggregatedReports[report.product_id] = {
                        productInfo: report,
                        count: 1,
                        reasons: [report.reason],
                        reporters: [report.reporter_name ? `${report.reporter_name} ${report.reporter_lastname}` : 'Utente anonimo']
                    };
                } else {
                    aggregatedReports[report.product_id].count++;
                    aggregatedReports[report.product_id].reasons.push(report.reason);
                    aggregatedReports[report.product_id].reporters.push(
                        report.reporter_name ? `${report.reporter_name} ${report.reporter_lastname}` : 'Utente anonimo'
                    );
                }
            });

            reportedProductsDiv.innerHTML = '';
            Object.values(aggregatedReports).forEach(aggregatedReport => {
                const {productInfo, count, reasons, reporters} = aggregatedReport;
                const hasActiveProduct = productInfo.active_product_id !== null;

                const reportDiv = document.createElement("div");
                reportDiv.className = "report-item";

                reportDiv.innerHTML = `
                <div class="report-details">
                    <h3>${productInfo.product_name} <span class="report-count">(${count} segnalazioni)</span></h3>
                    <p><strong>Venditore:</strong> ${productInfo.seller_name || 'N/A'} ${productInfo.seller_lastname || ''}</p>
                    <p><strong>Prima segnalazione:</strong> ${new Date(productInfo.created_at).toLocaleDateString()}</p>
                    <p><strong>Prezzo:</strong> €${productInfo.price}</p>
                    <details>
                        <summary><strong>Motivi della segnalazione (${reasons.length})</strong></summary>
                        <ul>
                            ${reasons.map(reason => `<li>${reason}</li>`).join('')}
                        </ul>
                    </details>
                    <details>
                        <summary><strong>Segnalato da (${reporters.length})</strong></summary>
                        <ul>
                            ${reporters.map(reporter => `<li>${reporter}</li>`).join('')}
                        </ul>
                    </details>
                </div>
                <div class="report-actions">
                    ${hasActiveProduct ?
                    `<button class="btn btn-primary" onclick="viewReportedProduct(${productInfo.product_id})">👁️ Visualizza</button>` :
                    `<button class="btn btn-secondary" disabled>Prodotto già rimosso</button>`
                }
                    <button class="btn btn-success" onclick="resolveReport(${productInfo.product_id})">✓ Risolvi</button>
                    ${hasActiveProduct ?
                    `<button class="btn btn-danger" onclick="removeReportedProduct(${productInfo.product_id}, '${productInfo.seller_id}')">🗑️ Rimuovi</button>` :
                    ''
                }
                </div>
            `;
                reportedProductsDiv.appendChild(reportDiv);
            });
        })
        .catch(err => {
            console.error("Errore nel caricamento dei report:", err);
            reportedProductsDiv.innerHTML = `
            <div class="error-message">
                <strong>Errore:</strong> Impossibile caricare le segnalazioni.
            </div>
        `;
        });
};




const loadReportsHistory = () => {
    const reportedProductsDiv = document.getElementById("reported-products");

    // Aggiorna stato visuale dei bottoni
    document.getElementById("view-pending").classList.remove("active");
    document.getElementById("view-history").classList.add("active");

    reportedProductsDiv.innerHTML = '<div class="loading">Caricamento storico segnalazioni...</div>';

    const token = localStorage.getItem("token");
    fetch("http://localhost:900/admin/reports/history", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`Il server ha risposto con stato: ${res.status}`);
            }
            return res.json();
        })
        .then(historyItems => {
            if (historyItems.length === 0) {
                reportedProductsDiv.innerHTML = `
                <div class="no-reports">
                    <h3>📜 Nessuna segnalazione risolta</h3>
                    <p>Non ci sono segnalazioni risolte nella cronologia.</p>
                </div>
            `;
                return;
            }

            reportedProductsDiv.innerHTML = '';
            historyItems.forEach(item => {
                const reportDiv = document.createElement("div");
                reportDiv.className = "report-item history-item";

                reportDiv.innerHTML = `
                <div class="report-details">
                    <h3>${item.product_name || 'Prodotto rimosso'} <span class="report-status ${item.product_status === 'Prodotto attivo' ? 'status-active' : 'status-removed'}">${item.product_status}</span></h3>
                    <p><strong>Motivo segnalazione:</strong> ${item.reason}</p>
                    <p><strong>Data segnalazione:</strong> ${new Date(item.created_at).toLocaleDateString()}</p>
                    <p><strong>Risolta il:</strong> ${new Date(item.resolved_at).toLocaleDateString()} ${new Date(item.resolved_at).toLocaleTimeString()}</p>
                    <p><strong>Segnalato da:</strong> ${item.reporter_name ? `${item.reporter_name} ${item.reporter_lastname}` : 'Utente anonimo'}</p>
                    ${item.resolution_message ? `<p><strong>Messaggio di risoluzione:</strong> "${item.resolution_message}"</p>` : ''}
                </div>
                ${item.product_status === 'Prodotto attivo' ?
                    `<div class="report-actions">
                    <button class="btn btn-primary" onclick="viewReportedProduct(${item.product_id})">👁️ Visualizza prodotto</button>
                </div>` : ''}
            `;
                reportedProductsDiv.appendChild(reportDiv);
            });
        })
        .catch(err => {
            console.error("Errore nel caricamento dello storico:", err);
            reportedProductsDiv.innerHTML = `
            <div class="error-message">
                <strong>Errore:</strong> Impossibile caricare lo storico delle segnalazioni.
            </div>
        `;
        });
};

const loadAdminPage = () => {
    const user = UserState.getUserInfo();

    if (!user || user.role_id !== 1) {
        alert("Accesso negato: area riservata agli amministratori");
        switchPage("home");
        return;
    }

    // Aggiunto container per switchare tra report pendenti e storico
    const reportedProductsDiv = document.getElementById("reported-products");
    const adminHeader = document.getElementById("admin-header");

    // Aggiorniamo l'header per includere le opzioni di visualizzazione
    adminHeader.innerHTML = `
        <h2>Dashboard Amministratore</h2>
        <p>Gestione prodotti segnalati</p>
        <div class="view-options">
            <button id="view-pending" class="btn btn-primary active">Segnalazioni pendenti</button>
            <button id="view-history" class="btn btn-secondary">Storico segnalazioni</button>
        </div>
    `;

    // Aggiungiamo gli event listener per i nuovi bottoni
    document.getElementById("view-pending").addEventListener("click", () => loadReports());
    document.getElementById("view-history").addEventListener("click", () => loadReportsHistory());

    // Carichiamo le segnalazioni pendenti di default
    loadReports();
};





window.viewReportedProduct = viewReportedProduct;
window.removeReportedProduct = removeReportedProduct;
window.loadAdminPage = loadAdminPage;
window.resolveReport = resolveReport;
window.loadReports = loadReports;
window.loadReportsHistory = loadReportsHistory;