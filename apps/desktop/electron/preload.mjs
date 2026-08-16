/**
 * Electron preload — the ONLY bridge between the untrusted Renderer and the
 * Desktop Main. Exposes a narrow, JSON-safe `window.personalOS.v1` contract.
 * It never exposes `ipcRenderer` itself, `process`, `require`, or any Node API.
 */
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('personalOS', {
  v1: {
    projects: {
      list: () => ipcRenderer.invoke('personalOS:projects:list'),
      get: (projectId) => ipcRenderer.invoke('personalOS:projects:get', projectId),
      getWorkspace: (projectId) => ipcRenderer.invoke('personalOS:projects:getWorkspace', projectId),
      proposeNextStep: (projectId) => ipcRenderer.invoke('personalOS:projects:proposeNextStep', projectId),
    },
    proposals: {
      approve: (proposalId) => ipcRenderer.invoke('personalOS:proposals:approve', proposalId),
      reject: (proposalId) => ipcRenderer.invoke('personalOS:proposals:reject', proposalId),
    },
    appearance: {
      get: () => ipcRenderer.invoke('personalOS:appearance:get'),
      update: (patch) => ipcRenderer.invoke('personalOS:appearance:update', patch),
    },
    runtime: {
      status: () => ipcRenderer.invoke('personalOS:runtime:status'),
    },
  },
})
