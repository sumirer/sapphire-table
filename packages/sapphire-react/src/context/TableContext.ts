import { createContext } from 'react';
import type { VirtualTableType } from '../hooks/useVirtualTable';

const TableContext = createContext<VirtualTableType | undefined>(undefined);

export { TableContext };
