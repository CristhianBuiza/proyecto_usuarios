import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "bootstrap/dist/css/bootstrap.min.css";
import { Toaster } from "react-hot-toast";
import "./index.css";

/* The code snippet `<QueryClientProvider client={clientQ}>
    <Toaster />
    <App />
  </QueryClientProvider>` is setting up a context provider for the React Query library. Here's what
each part is doing: */

const clientQ = new QueryClient();
ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={clientQ}>
    <Toaster />
    <App />
  </QueryClientProvider>
);
