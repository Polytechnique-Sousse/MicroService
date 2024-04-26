const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mysql = require('mysql2/promise');

async function startProductService() {
  const productProtoPath = 'product.proto';

  try {
    // Load product.proto
    const productProtoDefinition = protoLoader.loadSync(productProtoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const productProto = grpc.loadPackageDefinition(productProtoDefinition);
    const productService = productProto.ProductService;

    // Create MySQL connection pool
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'order',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Implement product service
    const serviceImpl = {
      async createProduct(call, callback) {
        try {
          const { name, price, description } = call.request;

          // Insert product into MySQL database
          const connection = await pool.getConnection();
          const [result] = await connection.query('INSERT INTO products (name, price, description) VALUES (?, ?, ?)', [name, price, description]);
          connection.release();

          // Return the created product
          const product = {
            id: result.insertId,
            name,
            price,
            description,
          };
          callback(null, { product });
        } catch (error) {
          console.error('Error creating product:', error);
          callback(error);
        }
      },

      async getProduct(call, callback) {
        try {
          const productId = call.request.id;

          // Fetch product details from MySQL database
          const connection = await pool.getConnection();
          const [rows] = await connection.query('SELECT * FROM products WHERE id = ?', [productId]);
          connection.release();

          if (rows.length === 0) {
            return callback({ code: grpc.status.NOT_FOUND, details: 'Product not found' });
          }

          const product = rows[0];
          callback(null, { product });
        } catch (error) {
          console.error('Error getting product:', error);
          callback(error);
        }
      },

      async getProducts(call, callback) {
        try {
          // Fetch all products from MySQL database
          const connection = await pool.getConnection();
          const [rows] = await connection.query('SELECT * FROM products');
          connection.release();

          const products = rows;
          callback(null, { products });
        } catch (error) {
          console.error('Error getting products:', error);
          callback(error);
        }
      },
    };

    // Create and start the gRPC server for product service
    const server = new grpc.Server();
    server.addService(productService.service, serviceImpl);
    const port = 50052;
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
      if (err) {
        console.error('Failed to bind server:', err);
        return;
      }
      console.log(`Product microservice running on port ${port}`);
    });
  } catch (error) {
    console.error('Error loading product.proto:', error);
  }
}

startProductService();