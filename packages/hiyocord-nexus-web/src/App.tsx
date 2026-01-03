import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './routes/Home';
import { Manifests } from './routes/Manifests';
import { ManifestDetail } from './routes/ManifestDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="manifests" element={<Manifests />} />
          <Route path="manifests/:id" element={<ManifestDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
