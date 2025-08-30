const Health = () => {
  return (
    <div className='min-h-screen bg-background flex items-center justify-center'>
      <div className='text-center'>
        <h1 className='text-2xl font-bold text-foreground mb-4'>
          Health Check
        </h1>
        <pre className='text-sm bg-muted p-4 rounded-lg'>
          {JSON.stringify(
            { ok: true, timestamp: new Date().toISOString() },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
};

export default Health;
