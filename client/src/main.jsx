import React from 'react';
import * as Sentry from "@sentry/react";
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

Sentry.init({
  dsn: "https://03c513f1a827aaa78fa5c2f660308012@o4511292700688384.ingest.us.sentry.io/4511292719300608",
  sendDefaultPii: false,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
