const express = require('express');
const { ApolloServer } = require('@apollo/server-express');
const bodyParser = require('body-parser');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const cors = require('cors');
const { expressMiddleware } = require('@apollo/server-express');
const resolvers = require('./resolvers');
const typeDefs = require('./schema');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Load the proto files for the product and order microservices
const productProtoPath = 'product.proto';
const orderProtoPath = 'order.proto';
const productProtoDefinition = protoLoader.loadSync(productProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const orderProtoDefinition = protoLoader.loadSync(orderProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const productProto = grpc.loadPackageDefinition(productProtoDefinition);
const orderProto = grpc.loadPackageDefinition(orderProtoDefinition);

// Create an ApolloServer instance with the imported schema and resolvers
const server = new ApolloServer({ typeDefs, resolvers });

// Apply the ApolloServer middleware to the Express application
server.start().then(() => {
  app.use(expressMiddleware(server));
});

// Define the gRPC endpoints for the product microservice
const productServiceClient = new productProto.ProductService('localhost:50052', grpc.credentials.createInsecure());

app.get('/products', (req, res) => {
  productServiceClient.getProducts({}, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.products);
    }
  });
});

app.get('/products/:id', (req, res) => {
  const id = req.params.id;
  productServiceClient.getProduct({ id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.product);
    }
  });
});

app.post('/products', (req, res) => {
  const { name, price, description } = req.body;
  productServiceClient.createProduct({ name, price, description }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.product);
    }
  });
});

// Define the gRPC endpoints for the order microservice
const orderServiceClient = new orderProto.OrderService('localhost:50053', grpc.credentials.createInsecure());

app.post('/orders', (req, res) => {
  const { productId, quantity } = req.body;
  orderServiceClient.createOrder({ productId, quantity }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.order);
    }
  });
});

app.get('/orders/:id', (req, res) => {
  const id = req.params.id;
  orderServiceClient.getOrder({ id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.order);
    }
  });
});

// Start the Express application
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});