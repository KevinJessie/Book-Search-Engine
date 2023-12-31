const express = require('express');
const path = require('path');
const db = require('./config/connection');

const { authMiddleware } = require('./utils/auth');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers } = require('./schemas');



const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// create a new Apollo server and pass in our schema data
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware
});
// integrate our Apollo server with the Express application as middleware
server.applyMiddleware({ app });


// add Apollo server and Express.js middleware to our application
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Path: server/server.js
// if we're in production, serve client/build as static assets
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// wildcard GET route for the server
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
}
);


// Path: server/server.js
// add this after the Apollo server is instantiated
db.once('open', () => {
  app.listen(PORT, () => {
    console.log(`Now listening on localhost:${PORT}`);
    // log where we can go to test our GQL API
    console.log(`Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
  });
});
