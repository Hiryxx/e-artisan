class UserState {
    static userInfo

    static seUserInfo(userInfo) {
        UserState.userInfo = userInfo;
    }

    static getUserInfo() {
        return UserState.userInfo;
    }

    static removeUserInfo() {
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
}