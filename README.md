# E-Artisan

## Starting the project
### 1. Move to the backend directory and install dependencies
```bash
cd backend
npm install
```

### 2. Set up the environment variables
```bash
cp .env.example .env
```

### 3. Start the docker containers
```bash
docker-compose up -d
```

### You can now access the backend at http://localhost:3000/index.html
---
## 📋 ToDo List

| Funzionalità                                                                 | Stato       | Grafica     | Responsabile                    | Note                                                                 |
|------------------------------------------------------------------------------|-------------|-------------|----------------------------------|----------------------------------------------------------------------|
| Pagina utente                                                               | ✅   | ✅    | Tommaso, Mauro                   |                                                                      |
| Pagina prodotto                                                             | ✅  | ✅    | Francesco                        |                                                                      |
| Carrello                                                                    | ✅      | ✅      | Paolo                            |                                                                      |
| Ricerca con filtri                                                          | ✅    | ✅   | Paolo                            |                                                                      |
| Acquisto, pagamento e gestione ordini                                       | ✅   | ✅    | Paolo, Francesco                 |                                                                      |
| Dashboard artigiano (vendite, prodotti, stock)                              | ✅    | ✅    | Davide                           |                                                                      |
| Amministratore (monitoraggio, segnalazioni, funzionamento)                 | ✅    | ✅    | Francesco                        |                                                                      |
| Test unitari e integration test                                             | ✅    | —           | Paolo                            |                                                                      |
| Schema ER                                                                   | ✅    | —           | Tommaso                          |                                                                      |
| Documentazione operazioni CRUD                                              | ✅    | —           | Tutti                            |                                                                      |
| README esaustivo                                                            | ✅    | —           | Davide                           | Include istruzioni di build, test, deploy                           |

