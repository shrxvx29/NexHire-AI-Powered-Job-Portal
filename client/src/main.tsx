import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#FFFCF5",
            color: "#570016",
            border: "1px solid #E4D5BC",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 600,
          },
          success: {
            iconTheme: {
              primary: "#26734D",
              secondary: "#FFFCF5",
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);