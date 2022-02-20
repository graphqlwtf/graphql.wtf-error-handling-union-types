import { createServer } from "@graphql-yoga/node";

const typeDefs = /* GraphQL */ `
  type Query {
    user(id: ID!): User!
  }

  type Mutation {
    login(input: LoginInput!): LoginResult!
  }

  type LoginResult {
    user: User!
    loginErrors: [LoginError!]!
  }

  union LoginError =
      IncorrectCredentialsError
    | UserSuspendedError
    | UserBannedError

  type User {
    id: ID!
    name: String!
  }

  interface Error {
    message: String!
  }

  type IncorrectCredentialsError implements Error {
    message: String!
  }

  type UserSuspendedError implements Error {
    message: String!
    unlockedAt: String!
  }

  type UserBannedError implements Error {
    message: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }
`;

type User = {
  id: string;
  email: string;
  name: string;
  password: string;
  suspended: boolean;
};

const users = [
  {
    id: "1",
    email: "jamie@graphql.wtf",
    name: "notrab",
    password: "password",
    suspended: false,
  },
  {
    id: "2",
    email: "misty@graphql.wtf",
    name: "misty",
    password: "password",
    suspended: true,
  },
];

const resolvers = {
  Query: {
    user: (_, { id }) => {
      const user = users.find((user: User) => user.id === id);

      if (!user) {
        throw new Error("User not found");
      }

      if (user.suspended) {
        throw new Error("User suspended");
      }

      return {
        __typename: "User",
        ...user,
      };
    },
  },
  Mutation: {
    login: (_, { input }) => {
      const user = users.find((user: User) => user.email === input.email);

      // return {
      //   __typename: "UserBannedError",
      //   message: "User banned forever",
      // };

      if (!user || user.password !== input.password) {
        return {
          __typename: "IncorrectCredentialsError",
          message: "Incorrect credentials",
        };
      }

      if (user.suspended) {
        return {
          __typename: "UserSuspendedError",
          message: "User suspended",
          unlockedAt: new Date().toISOString(),
        };
      }

      return {
        __typename: "User",
        ...user,
      };
    },
  },
};

const server = createServer({
  schema: {
    typeDefs,
    resolvers,
  },
  // maskedErrors: false,
});

server.start();
