import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ManifestLatestVersion } from '../lib/types';
import { useFetch } from '../hooks/use-fetch';
import './Home.css';

export function Home() {
  const [manifests, setManifests] = useState<ManifestLatestVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const client = useFetch();

  useEffect(() => {
    const fetchManifests = async () => {
      try {
        setLoading(true);
        const { data } = await client.GET('/api/manifests');
        setManifests(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchManifests();
  }, []);

  const totalManifests = manifests.length;
  const totalGlobalCommands = manifests.reduce((sum, m) => sum + m.application_commands.global.length, 0);
  const totalGuildCommands = manifests.reduce((sum, m) => sum + m.application_commands.guild.length, 0);

  if (loading) {
    return (
      <div className="home-page">
        <div className="welcome-section">
          <h2 className="welcome-title">Hiyocord Nexus 管理画面へようこそ</h2>
          <p className="welcome-description">
            登録されているサービスを管理できます。
          </p>
        </div>
        <p>読み込み中...</p>
      </div>
    );
  }

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
