class Router {
    currentPage = null
    pagesPath = null

    constructor(page, pagesPath) {
        this.currentPage = page
        this.pagesPath = pagesPath
    }

    changePage(newPage) {
        this.currentPage = newPage
    }

    getCurrentPagePath() {
        return this.currentPage ? this.pagesPath + this.currentPage + ".html" : null
    }

}