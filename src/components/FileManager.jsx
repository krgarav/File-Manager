import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileManagerComponent,
  Inject,
  DetailsView,
  Toolbar,
} from "@syncfusion/ej2-react-filemanager";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const hostUrl = `${(import.meta.env.VITE_FILE_MANAGER_BASE_URL || apiBaseUrl).replace(/\/$/, "")}/`;
const workspaceFallback = (import.meta.env.VITE_WORKSPACE_ID || "workspace").trim();
const integrationType = "GOOGLE_DRIVE";
const tokenStorageKey = "cfm_auth_token";
const userStorageKey = "cfm_auth_user";

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

function buildFileManagerUrls(workspaceId) {
  const base = `workspace=${encodeURIComponent(workspaceId)}`;

  return {
    url: `${hostUrl}api/FileManager/FileOperations?${base}`,
    getImageUrl: `${hostUrl}api/FileManager/GetImage?${base}`,
    uploadUrl: `${hostUrl}api/FileManager/Upload?${base}`,
    downloadUrl: `${hostUrl}api/FileManager/Download?${base}`,
  };
}

function AuthPage({ mode, setMode, onSubmit, loading, error, workspaceDefault }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspace, setWorkspace] = useState(workspaceDefault || "");

  useEffect(() => {
    if (workspaceDefault) {
      setWorkspace(workspaceDefault);
    }
  }, [workspaceDefault]);

  const isSignup = mode === "signup";

  const submit = async (event) => {
    event.preventDefault();

    const payload = isSignup
      ? { name, email, password, workspace }
      : { email, password };

    await onSubmit(mode, payload);
  };

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <p className="section-eyebrow">Cloud File Manager</p>
        <h1>{isSignup ? "Create your account" : "Sign in"}</h1>
        <p className="auth-subtitle">
          Access integrations and file operations with JWT-secured APIs.
        </p>

        <div className="auth-switch">
          <button
            type="button"
            className={mode === "signin" ? "plain-btn active" : "plain-btn"}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "signup" ? "plain-btn active" : "plain-btn"}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {isSignup ? (
            <label>
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                maxLength={80}
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={200}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              maxLength={128}
            />
          </label>

          {isSignup ? (
            <label>
              Workspace
              <input
                value={workspace}
                onChange={(event) => setWorkspace(event.target.value)}
                required
                maxLength={120}
              />
            </label>
          ) : null}

          {error ? <p className="integration-alert error">{error}</p> : null}

          <button type="submit" className="connect-btn" disabled={loading}>
            {loading ? "Processing..." : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>
      </section>
    </div>
  );
}

function DashboardHome({
  activeIntegrationCount,
  workspaceId,
  authToken,
}) {
  const fileManagerUrls = useMemo(
    () => buildFileManagerUrls(workspaceId),
    [workspaceId],
  );

  const handleBeforeSend = useCallback(
    (args) => {
      if (!authToken) {
        return;
      }

      const authHeader = `Bearer ${authToken}`;
      const applyHeader = (eventArgs) => {
        if (eventArgs?.httpRequest?.setRequestHeader) {
          eventArgs.httpRequest.setRequestHeader("Authorization", authHeader);
        }
      };

      if (args?.ajaxSettings) {
        const existingBeforeSend = args.ajaxSettings.beforeSend;
        args.ajaxSettings.beforeSend = (eventArgs) => {
          if (typeof existingBeforeSend === "function") {
            existingBeforeSend(eventArgs);
          }
          applyHeader(eventArgs);
        };
      }
      applyHeader(args);
    },
    [authToken],
  );

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
          <span>Active Drives: {activeIntegrationCount}</span>
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
            key={`workspace-${workspaceId}`}
            id="overview_file"
            ajaxSettings={fileManagerUrls}
            beforeSend={handleBeforeSend}
            navigationPaneSettings={{ visible: false }}
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
            <Inject services={[DetailsView, Toolbar]} />
          </FileManagerComponent>
        </div>
      </section>
    </>
  );
}

function IntegrationsPage({
  linkedIntegrations,
  onToggleIntegrationStatus,
  refreshIntegrations,
  workspaceId,
  user,
  authToken,
}) {
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasClientConfig = Boolean(workspaceId && authToken && user?.userId);

  const apiRequest = useCallback(
    async (path, init = {}, parseAsText = false) => {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
    },
    [authToken],
  );

  const loadStatus = useCallback(async () => {
    if (!hasClientConfig) {
      return;
    }

    setStatusLoading(true);
    setErrorMessage("");

    try {
      await refreshIntegrations();
    } catch (error) {
      setErrorMessage(error.message || "Unable to get Google Drive status.");
    } finally {
      setStatusLoading(false);
    }
  }, [hasClientConfig, refreshIntegrations]);

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
          { method: "GET", headers: {} },
          true,
        );

        setSuccessMessage("Google Drive connected successfully.");
        window.history.replaceState({}, document.title, window.location.pathname);
        await refreshIntegrations();
      } catch (error) {
        setErrorMessage(error.message || "Unable to complete Google Drive authorization.");
      } finally {
        setActionLoading(false);
      }
    },
    [apiRequest, refreshIntegrations],
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

  const activeIntegrations = linkedIntegrations.filter((item) => item.isActive);
  const driveStatusLabel = activeIntegrations.length ? "Connected" : "Not connected";

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
              Linked accounts: <strong>{linkedIntegrations.length}</strong>
            </p>
            <p>
              Active accounts: <strong>{activeIntegrations.length}</strong>
            </p>
            <p>
              Workspace/User: <strong>{workspaceId} / {user?.email || "-"}</strong>
            </p>
          </div>

          {linkedIntegrations.length ? (
            <div className="linked-list">
              {linkedIntegrations.map((item) => (
                <div key={item.id} className="linked-item">
                  <div>
                    <p className="linked-email">{item.info || "Unknown email"}</p>
                    <p className="linked-meta">
                      Linked: {item.updatedAt || "-"} | Status: {item.isActive ? "Active" : "Disabled"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={item.isActive ? "plain-btn active" : "plain-btn"}
                    onClick={() => onToggleIntegrationStatus(item.id, !item.isActive)}
                  >
                    {item.isActive ? "Disable" : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {errorMessage ? <p className="integration-alert error">{errorMessage}</p> : null}
          {successMessage ? <p className="integration-alert success">{successMessage}</p> : null}

          {!hasClientConfig ? (
            <p className="integration-alert warn">
              Missing workspace or valid auth token.
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
              {actionLoading ? "Processing..." : "Link Another Google Account"}
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
  const [linkedIntegrations, setLinkedIntegrations] = useState([]);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(tokenStorageKey) || "");
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(userStorageKey);
    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState("signin");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const workspaceId = (user?.workspace || workspaceFallback).trim();

  const apiRequest = useCallback(
    async (path, init = {}) => {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(init.headers || {}),
        },
      });

      const parsed = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(parsed?.message || `Request failed (${response.status})`);
      }

      return parsed;
    },
    [authToken],
  );

  const refreshIntegrations = useCallback(
    async () => {
      if (!authToken || !workspaceId) {
        setLinkedIntegrations([]);
        return;
      }

      const parsed = await apiRequest(
        `/v1/integrations?workspace=${encodeURIComponent(workspaceId)}`,
      );

      const list = Array.isArray(parsed?.data) ? parsed.data : [];
      setLinkedIntegrations(list);
    },
    [apiRequest, authToken, workspaceId],
  );

  const toggleIntegrationStatus = useCallback(
    async (integrationId, isActive) => {
      await apiRequest(
        `/v1/integrations/${encodeURIComponent(integrationId)}/status?workspace=${encodeURIComponent(workspaceId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive }),
        },
      );
      await refreshIntegrations();
    },
    [apiRequest, refreshIntegrations, workspaceId],
  );

  const handleAuthSubmit = useCallback(async (mode, payload) => {
    setAuthLoading(true);
    setAuthError("");

    try {
      const endpoint = mode === "signup" ? "/v1/auth/signup" : "/v1/auth/signin";
      const result = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const parsed = await result.json().catch(() => null);
      if (!result.ok) {
        throw new Error(parsed?.message || `Request failed (${result.status})`);
      }

      const token = parsed?.data?.token || "";
      const nextUser = parsed?.data?.user || null;
      if (!token || !nextUser) {
        throw new Error("Invalid auth response");
      }

      setAuthToken(token);
      setUser(nextUser);
      localStorage.setItem(tokenStorageKey, token);
      localStorage.setItem(userStorageKey, JSON.stringify(nextUser));
      setAuthMode("signin");
      setActivePage("home");
    } catch (error) {
      setAuthError(error.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setAuthToken("");
    setUser(null);
    setLinkedIntegrations([]);
    localStorage.removeItem(tokenStorageKey);
    localStorage.removeItem(userStorageKey);
  }, []);

  useEffect(() => {
    if (!authToken) {
      return;
    }

    apiRequest("/v1/auth/me")
      .then((response) => {
        const profile = response?.data;
        if (!profile?.userId) {
          throw new Error("Invalid session");
        }

        setUser(profile);
        localStorage.setItem(userStorageKey, JSON.stringify(profile));
      })
      .catch(() => {
        signOut();
      });
  }, [apiRequest, authToken, signOut]);

  useEffect(() => {
    refreshIntegrations().catch(() => undefined);
  }, [refreshIntegrations]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("code") && query.get("state")) {
      setActivePage("integrations");
    }
  }, []);

  const activeIntegrationCount = linkedIntegrations.filter((item) => item.isActive).length;

  const pageTitle = useMemo(() => {
    if (activePage === "integrations") {
      return "Integrations";
    }
    return "Home";
  }, [activePage]);

  if (!authToken || !user) {
    return (
      <AuthPage
        mode={authMode}
        setMode={setAuthMode}
        onSubmit={handleAuthSubmit}
        loading={authLoading}
        error={authError}
        workspaceDefault={workspaceFallback}
      />
    );
  }

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
          <div className="topbar-actions">
            <span className="status-pill">
              Active Drives: {activeIntegrationCount} | Workspace: {workspaceId}
            </span>
            <button type="button" className="plain-btn" onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>

        {activePage === "home" ? (
          <DashboardHome
            activeIntegrationCount={activeIntegrationCount}
            workspaceId={workspaceId}
            authToken={authToken}
          />
        ) : (
          <IntegrationsPage
            linkedIntegrations={linkedIntegrations}
            onToggleIntegrationStatus={toggleIntegrationStatus}
            refreshIntegrations={refreshIntegrations}
            workspaceId={workspaceId}
            user={user}
            authToken={authToken}
          />
        )}
      </main>
    </div>
  );
}
