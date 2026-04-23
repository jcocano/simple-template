function DevicePanelProvider({ device, setDevice, children }) {
  const value = React.useMemo(
    () => ({ device: device === 'mobile' ? 'mobile' : 'desktop', setDevice }),
    [device, setDevice]
  );
  return (
    <window.DevicePanelContext.Provider value={value}>
      {children}
    </window.DevicePanelContext.Provider>
  );
}

const DevicePanelContext = React.createContext({
  device: 'desktop',
  setDevice: () => {},
});

Object.assign(window, {
  DevicePanelContext,
  DevicePanelProvider,
});
