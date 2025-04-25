document.addEventListener('DOMContentLoaded', function() {
    const navbarId = 'navbar-placeholder'
    extractHtml("components/navbar.html", navbarId)
});

// TODO CHANGE NAME
const extractHtml = (htmlUrl, elementId) =>{
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