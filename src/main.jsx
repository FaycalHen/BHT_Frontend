import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import AgendaPage from './pages/AgendaPage.jsx';

const Main = () => {
  const [page, setPage] = useState('home');
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#agenda') setPage('agenda');
      else setPage('home');
    };
    window.addEventListener('hashchange', onHashChange);
    onHashChange();
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  if (page === 'agenda') return <AgendaPage />;
  return <App />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Main />
  </StrictMode>,
);
