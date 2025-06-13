import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css"; // IMPORTANT: Ensure this matches your CSS file name

const rootElement = document.getElementById("root");

// Ensure the root element exists before rendering
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root element with ID 'root' not found in the document.");
}
