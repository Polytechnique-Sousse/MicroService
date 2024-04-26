const { gql } = require('apollo-server-express');

// Define the GraphQL schema
const typeDefs = gql`
  type Product {
    id: String!
    name: String!
    price: Float!
    description: String!
  }

  type Order {
    id: String!
    productId: String!
    quantity: Int!
    totalPrice: Float!
    status: String!
  }

  type Query {
    product(id: String!): Product
    order(id: String!): Order
  }

  type Mutation {
    createProduct(name: String!, price: Float!, description: String!): Product
    createOrder(productId: String!, quantity: Int!): Order
  }
`;

module.exports = typeDefs;
