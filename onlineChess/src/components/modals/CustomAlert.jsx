import { useEffect, useState } from 'react';
import styles from './Modals.module.css';

export default function CustomAlert({ message, onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDone) onDone();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!message) return null;

  return (
    <div className={styles.customAlert}>
      {message}
    </div>
  );
}
