// Workspaces facade + React hooks.
// Imperative API on window.stWorkspaces; components should prefer
// useWorkspaces() and useCurrentWorkspace() which subscribe to events.
//
// Events emitted:
//   - st:workspaces-change {kind:'create'|'rename'|'delete', id}
//   - st:workspace-switch-blocked {newId, confirm, cancel}
//       → fired when switchWorkspace is called while the editor has
//         unsaved changes (window.__stEditor.isDirty() === true).
//         app.tsx listens and shows the UnsavedChangesModal.

function apiList() {
  return window.storage ? window.storage.workspaces.list() : Promise.resolve([]);
}

function apiCountTemplates(id) {
  return window.storage ? window.storage.workspaces.countTemplates(id) : Promise.resolve(0);
}

async function createWorkspace(name) {
  if (!window.storage) return null;
  const ws = await window.storage.workspaces.create(name);
  window.dispatchEvent(new CustomEvent('st:workspaces-change', {
    detail: { kind: 'create', id: ws?.id }
  }));
  return ws;
}

async function renameWorkspace(id, name) {
  if (!window.storage) return null;
  const ws = await window.storage.workspaces.rename(id, name);
  window.dispatchEvent(new CustomEvent('st:workspaces-change', {
    detail: { kind: 'rename', id }
  }));
  return ws;
}

async function deleteWorkspace(id) {
  if (!window.storage) return null;
  const result = await window.storage.workspaces.remove(id);
  if (result && result.error) return result;

  // Heal: if the deleted workspace was the current one, switch to the
  // first survivor BEFORE firing st:workspaces-change so consumers
  // re-render against a valid current workspace.
  if (window.stStorage.getCurrentWorkspaceId() === id) {
    const survivors = await apiList();
    if (survivors.length > 0) {
      await window.stStorage.setCurrentWorkspace(survivors[0].id);
    }
  }

  window.dispatchEvent(new CustomEvent('st:workspaces-change', {
    detail: { kind: 'delete', id }
  }));
  return result;
}

async function switchWorkspace(newId) {
  const currentId = window.stStorage.getCurrentWorkspaceId();
  if (!newId || newId === currentId) return { switched: false };

  // Editor unsaved-changes guard. Bundle D plugs window.__stEditor;
  // until then, the guard is a no-op.
  const editor = window.__stEditor;
  if (editor && typeof editor.isDirty === 'function' && editor.isDirty()) {
    return new Promise((resolve) => {
      window.dispatchEvent(new CustomEvent('st:workspace-switch-blocked', {
        detail: {
          newId,
          confirm: async () => {
            try { if (editor.flush) await editor.flush(); } catch {}
            await window.stStorage.setCurrentWorkspace(newId);
            resolve({ switched: true });
          },
          cancel: () => resolve({ switched: false, cancelled: true }),
        }
      }));
    });
  }

  await window.stStorage.setCurrentWorkspace(newId);
  return { switched: true };
}

// ─── React hooks ─────────────────────────────────────────────────
function useWorkspaces() {
  const [rows, setRows] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    const refresh = () => apiList().then((list) => { if (alive) setRows(list); });
    refresh();
    window.addEventListener('st:workspaces-change', refresh);
    return () => {
      alive = false;
      window.removeEventListener('st:workspaces-change', refresh);
    };
  }, []);
  return rows;
}

function useCurrentWorkspace() {
  const [current, setCurrent] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const id = window.stStorage.getCurrentWorkspaceId();
      if (!id) { if (alive) setCurrent(null); return; }
      const list = await apiList();
      if (!alive) return;
      setCurrent(list.find((w) => w.id === id) || null);
    };
    refresh();
    window.addEventListener('st:workspace-change', refresh);
    window.addEventListener('st:workspaces-change', refresh);
    return () => {
      alive = false;
      window.removeEventListener('st:workspace-change', refresh);
      window.removeEventListener('st:workspaces-change', refresh);
    };
  }, []);
  return current;
}

const stWorkspaces = {
  list: apiList,
  create: createWorkspace,
  rename: renameWorkspace,
  remove: deleteWorkspace,
  countTemplates: apiCountTemplates,
  switch: switchWorkspace,
  current: () => window.stStorage.getCurrentWorkspaceId(),
};

Object.assign(window, { stWorkspaces, useWorkspaces, useCurrentWorkspace });
