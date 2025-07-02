import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { useState } from 'react'
import { useLocalStorage } from 'usehooks-ts'

function App(): React.JSX.Element {
  const [proxyUrl, setProxyUrl] = useLocalStorage<string>('proxyUrl', '')
  const [verifierCode, setVerifierCode] = useLocalStorage<string>('verifierCode', '')

  const [started, setStarted] = useState<boolean>(false)

  const ipcHandle = (): void => {
    window.electron.ipcRenderer.send('start_proxy', {
      proxyUrl,
      verifierCode
    })
    setStarted(true)
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Proxy <span className="react">webhook</span> to local <span className="ts">URLs</span>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <label>Verifier code</label>
          <input
            type="text"
            placeholder="Verifier code"
            className="input"
            onChange={(event) => setVerifierCode(event.currentTarget.value)}
            value={verifierCode}
          />
        </div>
        <div>
          <label>URL to proxy</label>
          <input
            type="url"
            placeholder="URL to proxy"
            className="input"
            onChange={(event) => setProxyUrl(event.currentTarget.value)}
            value={proxyUrl}
          />
        </div>
      </div>
      <div className="actions">
        <div className="action">
          <button onClick={() => ipcHandle()} disabled={!proxyUrl || !verifierCode || started}>
            Start proxy
          </button>
        </div>
      </div>
      <Versions></Versions>
    </>
  )
}

export default App
