import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ManifestSummary } from '../lib/types';
import { mockManifestSummaries } from '../lib/mockData';
import './Manifests.css';

export function Manifests() {
  const [manifests, setManifests] = useState<ManifestSummary[]>(mockManifestSummaries);

  const handleDelete = (id: string) => {
    if (confirm(`サービス "${manifests.find((m) => m.id === id)?.name}" を削除しますか？`)) {
      // モックなので配列から削除するだけ
      setManifests(manifests.filter((m) => m.id !== id));
      alert('サービスを削除しました（モック）');
    }
  };

  return (
    <div className="manifests-page">
      <div className="page-header">
        <h2>サービス一覧</h2>
        <p className="page-description">登録されているサービスの一覧</p>
      </div>

      {manifests.length === 0 ? (
        <div className="empty-state">
          <p>サービスが登録されていません</p>
        </div>
      ) : (
        <div className="manifest-grid">
          {manifests.map((manifest) => (
            <div key={manifest.id} className="manifest-card">
              <div className="manifest-card-header">
                {manifest.icon_url && (
                  <img src={manifest.icon_url} alt={manifest.name} className="manifest-icon" />
                )}
                <div className="manifest-title-section">
                  <h3 className="manifest-name">{manifest.name}</h3>
                  <p className="manifest-id">{manifest.id}</p>
                </div>
              </div>

              <p className="manifest-description">{manifest.description}</p>

              <div className="manifest-stats">
                <div className="stat-item">
                  <span className="stat-label">Global Commands</span>
                  <span className="stat-value">{manifest.command_count.global}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Guild Commands</span>
                  <span className="stat-value">{manifest.command_count.guild}</span>
                </div>
              </div>

              <div className="manifest-actions">
                <Link to={`/manifests/${manifest.id}`} className="btn btn-primary">
                  詳細を見る
                </Link>
                <button onClick={() => handleDelete(manifest.id)} className="btn btn-danger">
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
