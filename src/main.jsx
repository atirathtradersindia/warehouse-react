import React from "react";
import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";

import { NotificationProvider } from "./context/NotificationContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </StrictMode>
);
