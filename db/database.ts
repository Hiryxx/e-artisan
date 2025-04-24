class Database{
    private createUserRole = "CREATE TABLE User_Role (\n" +
        "    role_id INT PRIMARY KEY,\n" +
        "    name VARCHAR(50) NOT NULL\n" +
        ");"

    private createShipmentInfo = "CREATE TABLE Shipment_Info (\n" +
        "    info_id INT PRIMARY KEY,\n" +
        "    street VARCHAR(100) NOT NULL,\n" +
        "    number VARCHAR(10) NOT NULL,\n" +
        "    zipcode VARCHAR(10) NOT NULL,\n" +
        "    state VARCHAR(50) NOT NULL,\n" +
        "    city VARCHAR(50) NOT NULL\n" +
        ");"
    private createUser = "CREATE TABLE User (\n" +
        "    user_id INT PRIMARY KEY,\n" +
        "    password VARCHAR(255) NOT NULL,\n" +
        "    email VARCHAR(100) UNIQUE NOT NULL,\n" +
        "    name VARCHAR(50) NOT NULL,\n" +
        "    lastname VARCHAR(50) NOT NULL,\n" +
        "    cf VARCHAR(16) UNIQUE NOT NULL,\n" +
        "    role_id INT NOT NULL,\n" +
        "    info_id INT,\n" +
        "    FOREIGN KEY (role_id) REFERENCES User_Role(role_id),\n" +
        "    FOREIGN KEY (info_id) REFERENCES Shipment_Info(info_id)\n" +
        ");\n"
    private createPaymet_Info = "CREATE TABLE Payment_Info (\n" +
        "    payment_id INT PRIMARY KEY,\n" +
        "    payment_method VARCHAR(50) NOT NULL\n" +
        ");"

    private createCategory = "\n" +
        "CREATE TABLE Category (\n" +
        "    id_category INT PRIMARY KEY,\n" +
        "    name VARCHAR(50) NOT NULL\n" +
        ");"

    private createProduct = "CREATE TABLE Product (\n" +
        "    product_id INT PRIMARY KEY,\n" +
        "    price NUMERIC(10, 2) NOT NULL,\n" +
        "    id_category INT NOT NULL,\n" +
        "    description TEXT,\n" +
        "    seller_id INT NOT NULL,\n" +
        "    image_url TEXT,\n" +
        "    stock INT NOT NULL CHECK (stock >= 0),\n" +
        "    FOREIGN KEY (id_category) REFERENCES Category(id_category),\n" +
        "    FOREIGN KEY (seller_id) REFERENCES User(user_id)\n" +
        ");"

    private createOrder = "CREATE TABLE Order (\n" +
        "    order_id INT PRIMARY KEY,\n" +
        "    payment_id INT NOT NULL,\n" +
        "    user_id INT NOT NULL,\n" +
        "    product_id INT NOT NULL,\n" +
        "    date DATE NOT NULL,\n" +
        "    status VARCHAR(50) NOT NULL,\n" +
        "    received_date DATE,\n" +
        "    FOREIGN KEY (payment_id) REFERENCES Payment_Info(payment_id),\n" +
        "    FOREIGN KEY (user_id) REFERENCES User(user_id),\n" +
        "    FOREIGN KEY (product_id) REFERENCES Product(product_id)\n" +
        ");"
    //guardare pg e vedere se eseguire il metodo 



}




