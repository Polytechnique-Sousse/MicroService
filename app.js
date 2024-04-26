const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

async function startServer() {
  try {
    const app = express();

    // Create an Apollo Server instance with type definitions and resolvers
    const server = new ApolloServer({ typeDefs, resolvers });

    // Apply middleware to the Express application
    await server.start();
    server.applyMiddleware({ app });

    // Connect to MongoDB database
    await mongoose.connect('mongodb://localhost:27017/products', { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Start the Express server
    const PORT = process.env.PORT || 4001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();