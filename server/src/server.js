import express from "express";
import "dotenv/config";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { functions, inngest } from "./inngest/index.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.send("Hey i m working");
});

app.use("/api/inngest", serve({ client: inngest, functions }));

const PORT = process.env.PORT || 5000;

const start = () => {
  const server = app.listen(PORT, () => {
    console.log(`Backend started on port ${PORT}`);
  });

  server.on("error", (err) => {
    console.error("Failed to start backend:", err);
    process.exit(1);
  });
};

start();
