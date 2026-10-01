import store

state = {"tradingEnabled": True, "autoExecutionEnabled": True, "emergencyStopped": False}


def load():
    """Restore kill-switch/pause flags from DB on boot — a crash or restart must not silently
    un-pause trading or clear an emergency stop."""
    state.update(store.get_runtime_state())


def set(**kwargs):
    state.update(kwargs)
    store.save_runtime_state(state)
