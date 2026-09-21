import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Streak API",
      version: "1.0.0",
      description: "Backend for Streak — a social streak-tracking app.",
    },
    servers: [{ url: "/", description: "Current server" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Supabase access token (from supabase.auth.getSession())",
        },
      },
    },
  },
  // Both globs so the docs also work from a compiled build (dist/),
  // not just under tsx in development.
  apis: ["./src/routes/*.ts", "./dist/routes/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
