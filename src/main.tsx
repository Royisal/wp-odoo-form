import React from 'react';
import ReactDOM from 'react-dom/client';

import ContactForm from './components/ContactForm';

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('odoo-form-root');
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ContactForm />
      </React.StrictMode>
    );
  } 
});