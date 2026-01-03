import { Link } from 'react-router-dom';
import { mockManifestSummaries } from '../lib/mockData';
import './Home.css';

export function Home() {
  const totalManifests = mockManifestSummaries.length;
  const totalGlobalCommands = mockManifestSummaries.reduce((sum, m) => sum + m.command_count.global, 0);
  const totalGuildCommands = mockManifestSummaries.reduce((sum, m) => sum + m.command_count.guild, 0);
  const totalComponents = mockManifestSummaries.reduce((sum, m) => sum + m.component_count, 0);
  const totalModals = mockManifestSummaries.reduce((sum, m) => sum + m.modal_count, 0);

  return (
    <div className="home-page">
      <div className="welcome-section">
        <h2 className="welcome-title">Hiyocord Nexus 管理画面へようこそ</h2>
        <p className="welcome-description">
          登録されているサービスを管理できます。
        </p>
      </div>

      <div className="stats-grid">
        <Link to="/manifests" className="stat-card stat-card-link">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-number">{totalManifests}</div>
            <div className="stat-label">Services</div>
          </div>
        </Link>

        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-content">
            <div className="stat-number">{totalGlobalCommands}</div>
            <div className="stat-label">Global Commands</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏰</div>
          <div className="stat-content">
            <div className="stat-number">{totalGuildCommands}</div>
            <div className="stat-label">Guild Commands</div>
          </div>
        </div>
      </div>

      <div className="action-section">
        <Link to="/manifests" className="action-card">
          <h3>サービス一覧</h3>
          <p>登録されているサービスを表示・管理します</p>
          <span className="action-arrow">→</span>
        </Link>
      </div>
    </div>
  );
}
