class UserState {
    static userInfo

    static seUserInfo(userInfo) {
        UserState.userInfo = userInfo;
    }

    static getUserInfo() {
        return UserState.userInfo;
    }

    static removeUserInfo() {
        console.log("Removing user info");
        UserState.userInfo = null;
    }
}

class ProductState {
    static allProducts = [];

    static setAllProducts(products) {
        ProductState.allProducts = products;
    }

    static getAllProducts() {
        return ProductState.allProducts;
    }

    static fetchProducts(filter, token) {
        let textFilter = ""
        for (const key in filter) {
            if (filter[key] !== "") {
                textFilter += `${key}=${filter[key]}&`
            }
        }
        if (textFilter.length > 0) {
            textFilter = textFilter.slice(0, -1)
        }
        return fetch(`http://localhost:900/product?${textFilter}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        })

    }
}