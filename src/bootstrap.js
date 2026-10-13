import React from 'react';
import { createRoot } from 'react-dom/client';
import Widget from './Widget';
import './global.scss';

createRoot(document.getElementById('root')).render(<Widget />);
