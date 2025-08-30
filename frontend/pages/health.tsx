export default function Health() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        backgroundColor: '#f8f9fa',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem', color: '#333' }}>
          Frontend Health Check
        </h1>
        <pre
          style={{
            backgroundColor: '#e9ecef',
            padding: '1rem',
            borderRadius: '4px',
            border: '1px solid #dee2e6',
          }}
        >
          {JSON.stringify(
            {
              ok: true,
              timestamp: new Date().toISOString(),
              service: 'Next.js Frontend',
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
