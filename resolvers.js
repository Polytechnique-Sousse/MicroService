const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

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

// Define the resolvers for GraphQL queries and mutations
const resolvers = {
  Query: {
    product: (_, { id }) => {
      // Make gRPC call to product microservice to fetch product by ID
      const client = new productProto.ProductService('localhost:50052', grpc.credentials.createInsecure());
      return new Promise((resolve, reject) => {
        client.getProduct({ id }, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.product);
          }
        });
      });
    },
    
    order: (_, { id }) => {
      // Make gRPC call to order microservice to fetch order by ID
      const client = new orderProto.OrderService('localhost:50053', grpc.credentials.createInsecure());
      return new Promise((resolve, reject) => {
        client.getOrder({ id }, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.order);
          }
        });
      });
    },
  },
  Mutation: {
    createProduct: (_, { name, price, description }) => {
      // Make gRPC call to product microservice to create product
      const client = new productProto.ProductService('localhost:50052', grpc.credentials.createInsecure());
      const request = { name, price, description };
      return new Promise((resolve, reject) => {
        client.createProduct(request, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.product);
          }
        });
      });
    },
    createOrder: (_, { productId, quantity }) => {
      // Make gRPC call to order microservice to create order
      const client = new orderProto.OrderService('localhost:50053', grpc.credentials.createInsecure());
      const request = { productId, quantity };
      return new Promise((resolve, reject) => {
        client.createOrder(request, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.order);
          }
        });
      });
    },
  },
};

module.exports = resolvers;
