
//todo find a way move this to router.js
class Router {
    currentPage = null
    pagesPath = null

    constructor(page, pagesPath){
        this.currentPage = page
        this.pagesPath = pagesPath
    }

    changePage(newPage){
        this.currentPage = newPage
    }

    getCurrentPagePath() {
        return this.currentPage ? this.pagesPath + this.currentPage + ".html": null
    }

}

/**
 * Get the function to call after loading the page
 * @param page
 * @returns {(function(): void)|*|loadComponents}
 */
const getPageFunction = (page) => {
    switch (page) {
        case "home":
            return loadComponents
        case "about":
            return () => {
                console.log("About page loaded")
            }
    }
}

const pageId = "current-page"
const router = new Router("home", "pages/") // todo ok here or in the event listener?

// todo remove event listener
document.addEventListener('DOMContentLoaded', function () {
    extractHtml(router.getCurrentPagePath(), pageId, getPageFunction('home'))
});

// TODO CHANGE NAME
const extractHtml = (htmlUrl, elementId, callAfter) => {
    fetch(htmlUrl)
        .then(response => response.text())
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
            callAfter()
        })
        .catch(error => {
            console.error('Error loading navbar:', error);
        });
}

const loadComponents = () => {
    const productsDiv = document.getElementById("products")
    if (!productsDiv) {
        console.error("No products div found")
    }
    // todo this is fetch
    const products = [
        {
            id: "1",
            name: "prova1",
            price: 50,
            img: "./images/products/prod1.webp"
        },
        {
            id: "2",
            name: "prova2",
            price: 100,
            img: "./images/products/prod2.jpg"
        },
        {
            id: "3",
            name: "prova3",
            price: 150,
            img: "./images/products/prod3.jpg"
        },
        {
            id: "4",
            name: "prova4",
            price: 200,
            img: "./images/products/prod4.png"
        },
        {
            id: "5",
            name: "prova5",
            price: 250,
            img: "./images/products/prod5.jpg"
        },
        {
            id: "6",
            name: "prova6",
            price: 300,
            img: ""
        },
        {
            id: "7",
            name: "prova7",
            price: 350,
            img: ""
        },
        {
            id: "8",
            name: "prova8",
            price: 400,
            img: ""
        },
        {
            id: "9",
            name: "prova9",
            price: 450,
            img: ""
        },
        {
            id: "10",
            name: "prova10",
            price: 500,
            img: ""
        },
    ]
    // TODO FIX
    for (let prod of products) {
        productsDiv.innerHTML += `
        <div class="product">
            <div class="product-img">
                <img src=${prod.img} alt="prod-img">
            </div>
            <div class="product-info">
                <p class="product-info-text">
                    ${prod.name}
                </p>
                 <p class="product-info-text">
                    $${prod.price}
                </p>
            </div>
        </div>
        `
    }
}
// todo switch to class
/**
 * Switch page
 * @param page Page name without url (e.g. "home" for "/pages/home.html")
 */
const switchPage = (page) => {
    router.changePage(page)
    extractHtml(router.getCurrentPagePath(), pageId, getPageFunction(page))

}