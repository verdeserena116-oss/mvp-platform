import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const OperationContext = createContext(null);

export function OperationProvider({ children }) {
  const [operations, setOperations] = useState([]);
  const [activeOperation, setActiveOperation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOperations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/operations');
      setOperations(data);

      // Restore previously selected operation, or default to first
      const savedId = localStorage.getItem('activeOperationId');
      const found = data.find((op) => op.id === savedId);
      setActiveOperation(found || data[0] || null);
    } catch (err) {
      console.error('Erro ao carregar operações:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  function selectOperation(operation) {
    setActiveOperation(operation);
    localStorage.setItem('activeOperationId', operation.id);
  }

  return (
    <OperationContext.Provider
      value={{ operations, activeOperation, selectOperation, loading, refresh: fetchOperations }}
    >
      {children}
    </OperationContext.Provider>
  );
}

export function useOperation() {
  return useContext(OperationContext);
}
