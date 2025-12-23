import { inngest } from "./client";

// EXAMPLE FUNCTION
export const helloFn = inngest.createFunction(
  { id: "hello-fn" },
  { event: "app/hello" },
  async ({ event }) => {
    console.log("Hello event received:", event.data);
    return { ok: true };
  }
);

// Export as **ARRAY**
export const functions = [helloFn];
