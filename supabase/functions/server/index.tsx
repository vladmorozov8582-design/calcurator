import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-c06d0958/health", (c) => {
  return c.json({ status: "ok" });
});

// Save OpenRouter API key (Global)
app.post("/make-server-c06d0958/api-key", async (c) => {
  try {
    const { apiKey } = await c.req.json();
    
    if (!apiKey) {
      return c.json({ error: "apiKey is required" }, 400);
    }
    
    // Save as global key
    await kv.set("openrouter_api_key_global", apiKey);
    console.log("Global API key saved");
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error saving API key: ${error}`);
    return c.json({ error: `Failed to save API key: ${error}` }, 500);
  }
});

// Check if Global API key exists
app.get("/make-server-c06d0958/api-key/:userId", async (c) => {
  try {
    const apiKey = await kv.get("openrouter_api_key_global");
    
    if (!apiKey) {
      return c.json({ hasApiKey: false });
    }
    
    return c.json({ hasApiKey: true });
  } catch (error) {
    console.log(`Error retrieving API key: ${error}`);
    return c.json({ error: `Failed to retrieve API key: ${error}` }, 500);
  }
});

// Solve a task using OpenRouter API
app.post("/make-server-c06d0958/solve-task", async (c) => {
  try {
    const { task, imageBase64, imagesBase64, messages: historyMessages } = await c.req.json();
    
    // Support legacy "task only" mode or "chat history" mode
    if (!task && (!historyMessages || historyMessages.length === 0)) {
      return c.json({ error: "task or messages are required" }, 400);
    }
    
    // Try to get API key from environment variable first
    let apiKey = Deno.env.get("OPENROUTER_API_KEY");
    
    // If not in env, try to get from KV store
    if (!apiKey || apiKey.trim().length === 0) {
      console.log("No env var found, checking KV store...");
      apiKey = await kv.get("openrouter_api_key_global");
    }
    
    // If still no key, return error
    if (!apiKey || apiKey.trim().length === 0) {
      console.log("No API key found in env or KV store");
      return c.json({ 
        error: "API key not found. Please configure your OpenRouter API key first." 
      }, 400);
    }

    console.log(`Using API key: ${apiKey.substring(0, 10)}...`);
    
    // Prepare messages for OpenRouter
    const apiMessages: any[] = [
      {
        role: "system",
        content: "You are an advanced AI assistant. Analyze the task and images carefully. When providing code solutions, ALWAYS use Python. The code MUST NOT contain hardcoded values or usage examples. Instead, it should explicitly prompt the user for input (e.g. using `input()`). The code should be general-purpose to solve any instance of the problem, using the provided example only to understand the logic."
      }
    ];

    // If history is provided, append it (it's already in OpenRouter format from the client)
    if (historyMessages && Array.isArray(historyMessages) && historyMessages.length > 0) {
        console.log(`Adding ${historyMessages.length} history messages`);
        apiMessages.push(...historyMessages);
    }

    // If there is a current task (new message), append it
    if (task) {
        // Normalize images input for the new task
        const images: string[] = [];
        if (imageBase64 && typeof imageBase64 === 'string') {
            images.push(imageBase64);
        }
        if (imagesBase64 && Array.isArray(imagesBase64)) {
           images.push(...imagesBase64);
        }

        if (images.length > 0) {
          const contentParts: any[] = [
            {
              type: "text",
              text: task
            }
          ];

          for (const img of images) {
            contentParts.push({
              type: "image_url",
              image_url: {
                url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`
              }
            });
          }

          apiMessages.push({
            role: "user",
            content: contentParts
          });
        } else {
          apiMessages.push({
            role: "user",
            content: task
          });
        }
    }
    
    console.log(`Total messages being sent to API: ${apiMessages.length}`);
    
    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://figma-make.com",
        "X-Title": "Task Solver"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: apiMessages
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`OpenRouter API error: ${response.status} - ${errorText}`);
      return c.json({ error: `OpenRouter API error: ${response.status} - ${errorText}` }, response.status);
    }
    
    const data = await response.json();
    const solution = data.choices[0].message.content;
    
    console.log(`Task solved successfully`);
    
    return c.json({ solution });
  } catch (error) {
    console.log(`Error solving task: ${error}`);
    return c.json({ error: `Failed to solve task: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);