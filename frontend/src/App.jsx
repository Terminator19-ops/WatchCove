import { Routes, Route, Link } from "react-router-dom";
import UploadPage from "./pages/uploadpage.jsx";
import LibraryPage from "./pages/librarypage.jsx";

function App() {
  return (
    <div>
      <nav style={{ marginBottom: "20px", padding: "10px", borderBottom: "1px solid #ccc" }}>
        <Link to="/" style={{ marginRight: "15px" }}>
          <button>Home</button>
        </Link>
        <Link to="/upload" style={{ marginRight: "15px" }}>
          <button>Upload</button>
        </Link>
        <Link to="/library">
          <button>Library</button>
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/library" element={<LibraryPage />} />
      </Routes>
    </div>
  );
}

function HomePage() {
  return (
    <div>
      <h1>Welcome to WatchCove</h1>
      <p>Your video streaming platform</p>
      <div style={{ marginTop: "20px" }}>
        <Link to="/upload">
          <button>Go to Upload Page</button>
        </Link>
        <Link to="/library" style={{ marginLeft: "10px" }}>
          <button>Go to Library</button>
        </Link>
      </div>
    </div>
  );
}

export default App;