import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ManifestLatestVersion } from '../lib/types';
import { useFetch } from '../hooks/use-fetch';
import './Manifests.css';

export function Manifests() {
  const [manifests, setManifests] = useState<ManifestLatestVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const client = useFetch();

  useEffect(() => {
    const fetchManifests = async () => {
      try {
        setLoading(true);
        const { data, error } = await client.GET('/api/manifests');

        if (error) {
          setError('マニフェストの取得に失敗しました');
          return;
        }

        setManifests(data || []);
      } catch (err) {
        setError('マニフェストの取得に失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchManifests();
  }, []);

  const handleDelete = async (id: string) => {
    const manifest = manifests.find((m) => m.id === id);
    if (!manifest) return;

    if (confirm(`サービス "${manifest.name}" を削除しますか？`)) {
      try {
        const { error } = await client.DELETE('/api/manifests/{id}', {
          params: { path: { id } },
        });

        if (error) {
          alert('サービスの削除に失敗しました');
          return;
        }

        // 成功したらリストから削除
        setManifests(manifests.filter((m) => m.id !== id));
        alert('サービスを削除しました');
      } catch (err) {
        alert('サービスの削除に失敗しました');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="manifests-page">
        <div className="page-header">
          <h2>サービス一覧</h2>
          <p className="page-description">登録されているサービスの一覧</p>
        </div>
        <div className="empty-state">
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manifests-page">
        <div className="page-header">
          <h2>サービス一覧</h2>
          <p className="page-description">登録されているサービスの一覧</p>
        </div>
        <div className="empty-state">
          <p>{error}</p>
        </div>
      </div>
    );
  }

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
                  <span className="stat-value">{manifest.application_commands.global.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Guild Commands</span>
                  <span className="stat-value">{manifest.application_commands.guild.length}</span>
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
