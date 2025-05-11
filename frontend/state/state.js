class State {
    static userInfo = {

    }

    static allProducts = [];

    static seUserInfo(userInfo) {
        State.userInfo = userInfo;
    }

    static getUserInfo() {
        return State.userInfo;
    }

    static setAllProducts(products) {
        State.allProducts = products;
    }

    static getAllProducts() {
        return State.allProducts;
    }
}