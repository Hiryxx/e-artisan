class UserState {
    static userInfo
    static reportedProducts = [];

    static setReportedProducts(productIds) {
        UserState.reportedProducts = productIds;
    }

    static hasReportedProduct(productId) {
        return UserState.reportedProducts.includes(Number(productId));
    }

    static addReportedProduct(productId) {
        if (!UserState.reportedProducts.includes(Number(productId))) {
            UserState.reportedProducts.push(Number(productId));
        }
    }

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

    static updateUserInfo(data, token) {
        let headers = {
            "Content-Type": "application/json",
        }
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return fetch("http://localhost:900/auth/user", {
            method: "PATCH",
            headers: headers,
            body: JSON.stringify(data)
        })

    }

    static removeReportedProduct(productId) {
        UserState.reportedProducts = UserState.reportedProducts.filter(product_id => product_id !== Number(productId));
    }
}

class ProductState {
    static allProducts = [];
    static selectedProduct = null;
    static categories = [];

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
        let headers = {
            "Content-Type": "application/json",
        }
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return fetch(`http://localhost:900/product?${textFilter}`, {
            method: "GET",
            headers: headers
        })

    }

    static fetchCategories(token) {
        let headers = {
            "Content-Type": "application/json",
        }
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return fetch("http://localhost:900/product/categories", {
            method: "GET",
            headers: headers
        })
    }

    static setCategories(categories) {
        ProductState.categories = categories;
    }

    static getCategories() {
        return ProductState.categories;
    }

    static setSelectedProduct(product) {
        ProductState.selectedProduct = product;
    }

    static getSelectedProduct() {
        return ProductState.selectedProduct;
    }
    // param has also the image file. send it as FormData
    static addProduct(param, token) {
        const formData = new FormData();
        let headers = {
        }
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        formData.append('name', param.name);
        formData.append('price', param.price);
        formData.append('description', param.description);
        formData.append('id_category', param.category);
        formData.append('stock', param.stock);
        formData.append('photo', param.picture);


        return fetch("http://localhost:900/product/with-img", {
            method: "POST",
            headers: headers,
            body: formData
        });
    }

    static removeAllProducts() {
        ProductState.allProducts = [];
    }

    static addStockToProduct(productId, token) {
        let headers = {
            "Content-Type": "application/json",
        }
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return fetch(`http://localhost:900/product/${productId}/stock/1`, {
            method: "POST",
            headers: headers
        });

    }
}

class CartState {
    static itemToAdd = null; // this is the item to add when the user clicks on the add to cart button
    static cartItems = [];

    static setCartItems(cartItems) {
        CartState.cartItems = cartItems;
    }

    static getCartItems() {
        return CartState.cartItems;
    }

    static addToCart(product) {
        CartState.cartItems.push(product);
    }

    static removeFromCart(productId) {
        CartState.cartItems = CartState.cartItems.filter(item => item.id !== productId);
    }

    static getItemToAdd() {
        return CartState.itemToAdd;
    }

    static setItemToAdd(productId) {
        CartState.itemToAdd = productId;
    }
}

class OrderState {
    static orders = [];
    static selectedOrder = null;

    static setOrders(orders) {
        OrderState.orders = orders;
    }

    static getOrders() {
        return OrderState.orders;
    }

    static setSelectedOrder(order) {
        OrderState.selectedOrder = order;
    }

    static getSelectedOrder() {
        return OrderState.selectedOrder;
    }

    static fetchOrders(token) {
        let headers = {
            "Content-Type": "application/json",
        }
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return fetch("http://localhost:900/orders", {
            method: "GET",
            headers: headers
        });
    }
}