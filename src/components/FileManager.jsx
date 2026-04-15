import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileManagerComponent,
  Inject,
  NavigationPane,
  DetailsView,
  Toolbar,
} from "@syncfusion/ej2-react-filemanager";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const hostUrl = `${(import.meta.env.VITE_FILE_MANAGER_BASE_URL || apiBaseUrl).replace(/\/$/, "")}/`;
const workspaceId = (import.meta.env.VITE_WORKSPACE_ID || "demo-workspace").trim();
const integrationType = "GOOGLE_DRIVE";

const appStats = [
  { label: "Active Team Members", value: "24", note: "+4 this month" },
  { label: "Storage Used", value: "1.8 TB", note: "68% of quota" },
  { label: "Files Updated Today", value: "142", note: "Across 11 folders" },
];

const folders = [
  { name: "Contracts", files: 74, updated: "Updated 25m ago" },
  { name: "Clinical Intake", files: 213, updated: "Updated 1h ago" },
  { name: "Operations", files: 96, updated: "Updated 2h ago" },
];

function DashboardHome() {
  return (
    <>
      <section className="hero-card">
        <div>
          <p className="section-eyebrow">Cloud Workspace</p>
          <h1>Manage secure files with speed and confidence.</h1>
          <p>
            Centralize uploads, organize records, and maintain controlled access
            across your teams.
          </p>
        </div>
        <div className="hero-badges">
          <span>TLS 1.2+</span>
          <span>Encrypted Storage</span>
          <span>Audit Ready</span>
        </div>
      </section>

      <section className="stats-grid">
        {appStats.map((item) => (
          <article key={item.label} className="stat-card">
            <p>{item.label}</p>
            <h3>{item.value}</h3>
            <span>{item.note}</span>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel-card">
          <div className="panel-head">
            <h2>Recent Folders</h2>
            <button type="button">View all</button>
          </div>
          <div className="folder-list">
            {folders.map((folder) => (
              <div key={folder.name} className="folder-row">
                <div>
                  <h4>{folder.name}</h4>
                  <p>{folder.updated}</p>
                </div>
                <span>{folder.files} files</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>Security Controls</h2>
          </div>
          <ul className="security-list">
            <li>Role-based access configured for all user groups</li>
            <li>Suspicious download alerts enabled</li>
            <li>Retention and deletion policy synced weekly</li>
            <li>PII masking active for activity summaries</li>
          </ul>
        </article>
      </section>

      <section className="panel-card file-manager-panel">
        <div className="panel-head">
          <h2>File Manager</h2>
          <span className="pill">Details View</span>
        </div>

        <div className="control-section">
          <FileManagerComponent
            id="overview_file"
            ajaxSettings={{
              url:
                hostUrl +
                "api/FileManager/FileOperations?workspace=" +
                encodeURIComponent(workspaceId),
              getImageUrl:
                hostUrl +
                "api/FileManager/GetImage?workspace=" +
                encodeURIComponent(workspaceId),
              uploadUrl:
                hostUrl +
                "api/FileManager/Upload?workspace=" +
                encodeURIComponent(workspaceId),
              downloadUrl:
                hostUrl +
                "api/FileManager/Download?workspace=" +
                encodeURIComponent(workspaceId),
            }}
            toolbarSettings={{
              items: [
                "NewFolder",
                "SortBy",
                "Cut",
                "Copy",
                "Paste",
                "Delete",
                "Refresh",
                "Download",
                "Rename",
                "Selection",
                "View",
                "Details",
              ],
            }}
            contextMenuSettings={{
              file: [
                "Cut",
                "Copy",
                "|",
                "Delete",
                "Download",
                "Rename",
                "|",
                "Details",
              ],
              layout: [
                "SortBy",
                "View",
                "Refresh",
                "|",
                "Paste",
                "|",
                "NewFolder",
                "|",
                "Details",
                "|",
                "SelectAll",
              ],
              visible: true,
            }}
            view="Details"
          >
            <Inject services={[NavigationPane, DetailsView, Toolbar]} />
          </FileManagerComponent>
        </div>
      </section>
    </>
  );
}

function IntegrationsPage() {
  const [driveStatus, setDriveStatus] = useState({ connected: false, connectedAt: null });
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasClientConfig = Boolean(workspaceId);

  const apiRequest = useCallback(async (path, init = {}, parseAsText = false) => {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

    if (parseAsText) {
      const textResponse = await response.text();
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      return textResponse;
    }

    const parsed = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(parsed?.message || `Request failed (${response.status})`);
    }

    return parsed;
  }, []);

  const loadStatus = useCallback(async () => {
    if (!hasClientConfig) {
      return;
    }

    setStatusLoading(true);
    setErrorMessage("");

    try {
      const data = await apiRequest(
        `/v1/connected?workspace=${encodeURIComponent(workspaceId)}`,
        { method: "GET" },
      );

      const connected = Array.isArray(data?.data)
        ? data.data.some((item) => item?.type === integrationType && item?.isActive)
        : false;

      const matched = Array.isArray(data?.data)
        ? data.data.find((item) => item?.type === integrationType)
        : null;

      setDriveStatus({
        connected,
        connectedAt: matched?.updatedAt || null,
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to get Google Drive status.");
    } finally {
      setStatusLoading(false);
    }
  }, [apiRequest, hasClientConfig]);

  const connectDrive = async () => {
    if (!hasClientConfig || actionLoading) {
      return;
    }

    setActionLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const data = await apiRequest(
        `/v1/addcredentials?workspace=${encodeURIComponent(workspaceId)}`,
        {
          method: "POST",
          body: JSON.stringify({ type: integrationType }),
        },
      );

      const authUrl = data?.data?.url;
      if (!authUrl) {
        throw new Error("Authorization URL was not returned by server.");
      }

      window.location.assign(authUrl);
    } catch (error) {
      setErrorMessage(error.message || "Unable to start Google Drive authorization.");
      setActionLoading(false);
    }
  };

  const handleOAuthCallback = useCallback(
    async (code, state) => {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        await apiRequest(
          `/v1/integrations/get-code?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
          { method: "GET" },
          true,
        );

        setSuccessMessage("Google Drive connected successfully.");
        window.history.replaceState({}, document.title, window.location.pathname);
        await loadStatus();
      } catch (error) {
        setErrorMessage(error.message || "Unable to complete Google Drive authorization.");
      } finally {
        setActionLoading(false);
      }
    },
    [apiRequest, loadStatus],
  );

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const code = query.get("code");
    const state = query.get("state");

    if (code && state && hasClientConfig) {
      handleOAuthCallback(code, state);
    }
  }, [handleOAuthCallback, hasClientConfig]);

  const driveStatusLabel = driveStatus.connected ? "Connected" : "Not connected";

  return (
    <>
      <section className="hero-card integrations-hero">
        <div>
          <p className="section-eyebrow">Integrations</p>
          <h1>Connect external storage providers securely.</h1>
          <p>
            Authorize trusted integrations to sync files while preserving control
            with consented access.
          </p>
        </div>
      </section>

      <section className="integration-grid">
        <article className="integration-card">
          <div className="integration-brand">
            <div className="brand-icon" aria-hidden="true">
              G
            </div>
            <div>
              <h2>Google Drive</h2>
              <p>Two-way sync for selected folders and shared drives.</p>
            </div>
          </div>

          <div className="integration-meta">
            <p>
              Status: <strong>{statusLoading ? "Checking..." : driveStatusLabel}</strong>
            </p>
            <p>
              Last event: <strong>{driveStatus.connectedAt || "-"}</strong>
            </p>
            <p>
              Workspace: <strong>{workspaceId || "-"}</strong>
            </p>
          </div>

          {errorMessage ? <p className="integration-alert error">{errorMessage}</p> : null}
          {successMessage ? <p className="integration-alert success">{successMessage}</p> : null}

          {!hasClientConfig ? (
            <p className="integration-alert warn">
              Missing `VITE_WORKSPACE_ID` in client environment.
            </p>
          ) : null}

          <div className="integration-actions">
            <button
              type="button"
              className="connect-btn"
              onClick={connectDrive}
              disabled={!hasClientConfig || actionLoading}
              aria-label="Connect Google Drive integration"
            >
              {actionLoading ? "Processing..." : "Connect Google Drive"}
            </button>

            <button
              type="button"
              className="plain-btn"
              onClick={loadStatus}
              disabled={!hasClientConfig || statusLoading}
            >
              Refresh Status
            </button>
          </div>
        </article>

        <article className="panel-card integration-notes">
          <h3>Integration checklist</h3>
          <ul className="security-list">
            <li>Use OAuth 2.0 authorization for account linking</li>
            <li>Grant minimum scopes based on selected features</li>
            <li>Capture and retain user consent logs</li>
            <li>Store refresh tokens only in encrypted server storage</li>
          </ul>
        </article>
      </section>
    </>
  );
}

export default function CloudFileManagerApp() {
  const [activePage, setActivePage] = useState("home");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("code") && query.get("state")) {
      setActivePage("integrations");
    }
  }, []);

  const pageTitle = useMemo(() => {
    if (activePage === "integrations") {
      return "Integrations";
    }
    return "Home";
  }, [activePage]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">CF</span>
          <div>
            <h2>Cloud File Manager</h2>
            <p>Enterprise Workspace</p>
          </div>
        </div>

        <nav>
          <button
            type="button"
            className={activePage === "home" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("home")}
          >
            Home
          </button>
          <button
            type="button"
            className={
              activePage === "integrations" ? "nav-item active" : "nav-item"
            }
            onClick={() => setActivePage("integrations")}
          >
            Integrations
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1>{pageTitle}</h1>
          <span className="status-pill">Workspace: Production</span>
        </header>

        {activePage === "home" ? <DashboardHome /> : <IntegrationsPage />}
      </main>
    </div>
  );
}
