import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import './LoadingOverlay.css';

function LoadingOverlay({ loading }) {
  const [destroyed, setDestroyed] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    let timeout;

    if (loading) {
      clearTimeout(timeout);
      setDestroyed(false);
      setLocalLoading(true);
    } else {
      setLocalLoading(false);
      timeout = setTimeout(() => {
        setDestroyed(true);
      }, 500);
    }
  }, [loading]);

  if (destroyed) return null;

  return (
    <div className={clsx('load-overlay', localLoading && 'visible')}>
      <div className="load-spinner" />
    </div>
  );
}

export default LoadingOverlay;
