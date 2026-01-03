import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export function Login() {
  const { login } = useAuth();

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Hiyocord Nexus</h1>
        <p className="login-description">
          管理画面へのアクセスには
          <br />
          Discordアカウントでのログインが必要です
        </p>
        <button onClick={login} className="login-button">
          <span className="login-icon">🎮</span>
          Discordでログイン
        </button>
      </div>
    </div>
  );
}
