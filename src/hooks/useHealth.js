import { useEffect, useState } from 'react';
import { api } from '../services/api.js';

export function useHealth() {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let active = true;

    api
      .get('/health')
      .then(({ data }) => {
        if (active) setState({ loading: false, data: data.data, error: null });
      })
      .catch((error) => {
        if (active) setState({ loading: false, data: null, error: error.message });
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
