import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW() {
    // no-op hook keeps registration explicit and easier to debug
  },
});

void updateSW;

createRoot(document.getElementById("root")!).render(<App />);
