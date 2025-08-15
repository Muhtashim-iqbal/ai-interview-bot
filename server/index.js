import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors()); // Allow all origins (or restrict to your GitHub Pages domain)
app.use(express.json());

// Root route for health check
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// ✅ Proxy endpoint for Ollama
app.post("/api/generate", async (req, res) => {
  try {
    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const data = await ollamaRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


console.log("Render PORT:", process.env.PORT);
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

