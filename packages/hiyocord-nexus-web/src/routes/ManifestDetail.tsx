import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockManifestDetails } from '../lib/mockData';
import './ManifestDetail.css';

export function ManifestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const manifest = id ? mockManifestDetails[id] : undefined;

  const handleDelete = () => {
    if (confirm(`サービス "${manifest?.name}" を削除しますか？`)) {
      alert('サービスを削除しました（モック）');
      navigate('/manifests');
    }
  };

  if (!manifest) {
    return (
      <div className="manifest-detail-page">
        <div className="error-state">
          <h2>サービスが見つかりません</h2>
          <p>指定されたIDのサービスは存在しません。</p>
          <Link to="/manifests" className="btn btn-primary">
            一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="manifest-detail-page">
      <div className="breadcrumb">
        <Link to="/manifests">サービス</Link>
        <span className="separator">/</span>
        <span>{manifest.name}</span>
      </div>

      <div className="detail-header">
        <div className="detail-title-section">
          {manifest.icon_url && <img src={manifest.icon_url} alt={manifest.name} className="detail-icon" />}
          <div>
            <h2 className="detail-title">{manifest.name}</h2>
            <p className="detail-id">{manifest.id}</p>
          </div>
        </div>
        <button onClick={handleDelete} className="btn btn-danger btn-delete">
          削除
        </button>
      </div>

      <div className="detail-section">
        <h3 className="section-title">基本情報</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Version</span>
            <span className="info-value">{manifest.version}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Base URL</span>
            <span className="info-value">{manifest.base_url}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Description</span>
            <span className="info-value">{manifest.description}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="section-title">Application Commands</h3>

        <div className="subsection">
          <h4 className="subsection-title">Global Commands ({manifest.application_commands.global.length})</h4>
          {manifest.application_commands.global.length > 0 ? (
            <div className="command-list">
              {manifest.application_commands.global.map((cmd, idx) => (
                <div key={idx} className="command-item">
                  <div className="command-header">
                    <span className="command-name">/{cmd.name}</span>
                    <span className="command-type">Type {cmd.type}</span>
                  </div>
                  <p className="command-description">{cmd.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">グローバルコマンドはありません</p>
          )}
        </div>

        <div className="subsection">
          <h4 className="subsection-title">Guild Commands ({manifest.application_commands.guild.length})</h4>
          {manifest.application_commands.guild.length > 0 ? (
            <div className="command-list">
              {manifest.application_commands.guild.map((cmd, idx) => (
                <div key={idx} className="command-item">
                  <div className="command-header">
                    <span className="command-name">/{cmd.name}</span>
                    <span className="command-type">Type {cmd.type}</span>
                  </div>
                  <p className="command-description">{cmd.description}</p>
                  <div className="guild-ids">
                    <span className="guild-label">Guilds:</span>
                    {cmd.guild_id.map((guildId) => (
                      <span key={guildId} className="guild-id">
                        {guildId}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">ギルドコマンドはありません</p>
          )}
        </div>
      </div>

      <div className="detail-section">
        <h3 className="section-title">Permissions</h3>
        <div className="permission-list">
          {manifest.permissions.map((perm, idx) => (
            <div key={idx} className="permission-item">
              <span className="permission-type">{perm.type}</span>
              {perm.type === 'DISCORD_API_SCOPE' && perm.scopes && (
                <div className="scopes">
                  {Object.entries(perm.scopes).map(([path, methods]) => (
                    <div key={path} className="scope-item">
                      <span className="scope-path">{path}</span>
                      <span className="scope-methods">{methods.join(', ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="detail-section">
        <h3 className="section-title">認証情報</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Signature Algorithm</span>
            <span className="info-value">{manifest.signature_algorithm}</span>
          </div>
          <div className="info-item full-width">
            <span className="info-label">Public Key</span>
            <span className="info-value public-key">{manifest.public_key}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
