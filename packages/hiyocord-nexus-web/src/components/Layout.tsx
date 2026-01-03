import { Link, Outlet } from 'react-router-dom';
import './Layout.css';

export function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="title-link">
            <h1 className="title">Hiyocord Nexus</h1>
          </Link>
          <nav className="nav">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/manifests" className="nav-link">
              Services
            </Link>
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
