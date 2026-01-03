import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setError('認証コードが見つかりません');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    const authenticate = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_NEXUS_URL}/api/auth/discord`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            code,
            redirect_uri: `${window.location.origin}/callback`,
          }),
        });

        if (!response.ok) {
          throw new Error('認証に失敗しました');
        }

        // 認証成功、ホームにリダイレクト
        window.location.href = '/';
      } catch (err) {
        console.error('Authentication error:', err);
        setError('認証に失敗しました');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    authenticate();
  }, [searchParams, navigate]);

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Hiyocord Nexus</h1>
        {error ? (
          <p className="login-description" style={{ color: '#f04747' }}>
            {error}
            <br />
            ログイン画面に戻ります...
          </p>
        ) : (
          <p className="login-description">認証中...</p>
        )}
      </div>
    </div>
  );
}
