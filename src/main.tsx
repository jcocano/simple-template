import ReactDOM from "react-dom/client";

// Flag the platform so CSS can reserve room for native window controls
// (traffic lights on the left for macOS, overlay buttons on the right for Windows).
const ua = navigator.userAgent;
const platform = ua.includes("Mac") ? "darwin" : ua.includes("Win") ? "win32" : "linux";
document.documentElement.setAttribute("data-platform", platform);

import "./lib/storage.tsx";
import "./lib/workspaces.tsx";
import "./lib/templates.tsx";
import "./lib/export.tsx";
import "./lib/oauth.tsx";
import "./lib/test-send.tsx";
import "./lib/ai.tsx";
import "./lib/cdn.tsx";
import "./lib/images.tsx";
import "./icons.tsx";
import "./data.tsx";
import "./ui.tsx";
import "./email-blocks.tsx";
import "./block-controls.tsx";
import "./image-picker.tsx";
import "./block-props.tsx";
import "./screens/onboarding.tsx";
import "./screens/dashboard.tsx";
import "./screens/editor.tsx";
import "./screens/preview.tsx";
import "./screens/library.tsx";
import "./screens/image-library.tsx";
import "./modals.tsx";
import "./review-panel.tsx";
import "./command-palette.tsx";
import "./editor-tour.tsx";
import "./toasts.tsx";
import "./empty-state.tsx";
import "./smtp-modal.tsx";
import "./settings-panel.tsx";
import "./tweaks.tsx";
import "./app.tsx";

(async () => {
  await window.stStorage.boot();
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<window.App />);
})();
