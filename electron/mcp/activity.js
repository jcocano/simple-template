const { EventEmitter } = require('events');

const IDLE_MS = 8000;
const TICK_COALESCE_MS = 200;
const USER_LOCK_MS = 3000;

class Activity extends EventEmitter {
  active = false;
  workspaceId = null;
  templateId = null;
  lastActivityAt = 0;
  _idleTimer = null;
  _lastTickBroadcastAt = 0;
  _userLockUntil = 0;

  touch(workspaceId, templateId) {
    const now = Date.now();
    if (now < this._userLockUntil) return false;
    if (this.active && (this.workspaceId !== workspaceId || this.templateId !== templateId)) {
      this._broadcast('end');
      this.active = false;
    }
    this.workspaceId = workspaceId;
    this.templateId = templateId;
    this.lastActivityAt = now;
    if (!this.active) {
      this.active = true;
      this._broadcast('start');
    } else {
      if (now - this._lastTickBroadcastAt >= TICK_COALESCE_MS) {
        this._broadcast('tick');
      }
    }
    this._resetIdle();
    return true;
  }

  release() {
    this._userLockUntil = Date.now() + USER_LOCK_MS;
    if (this.active) {
      this._broadcast('end');
      this.active = false;
    }
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }

  _resetIdle() {
    if (this._idleTimer) clearTimeout(this._idleTimer);
    this._idleTimer = setTimeout(() => {
      if (this.active) {
        this._broadcast('end');
        this.active = false;
      }
      this._idleTimer = null;
    }, IDLE_MS);
  }

  _broadcast(state) {
    this._lastTickBroadcastAt = Date.now();
    this.emit('change', { state, workspaceId: this.workspaceId, templateId: this.templateId });
  }

  getState() {
    return {
      active: this.active,
      workspaceId: this.workspaceId,
      templateId: this.templateId,
      lastActivityAt: this.lastActivityAt,
    };
  }
}

module.exports = new Activity();
