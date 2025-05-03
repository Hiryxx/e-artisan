document.addEventListener('DOMContentLoaded', function () {
    const navbarId = 'navbar-placeholder'
    extractHtml("components/navbar.html", navbarId)
    loadComponents()
});

// TODO CHANGE NAME
const extractHtml = (htmlUrl, elementId) => {
    fetch(htmlUrl)
        .then(response => response.text())
        .then(data => {
            console.log(data)
            document.getElementById(elementId).innerHTML = data;
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