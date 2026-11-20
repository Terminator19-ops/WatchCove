import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function LibraryPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    try {
      setLoading(true);
      const response = await fetch("http://127.0.0.1:8000/videos");
      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }
      const data = await response.json();
      setVideos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Library</h1>
        <div>
          <Link to="/upload">
            <button>Go to Upload Page</button>
          </Link>
          <Link to="/">
            <button style={{ marginLeft: "10px" }}>Go to Home</button>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: "15px", 
          backgroundColor: "#f8d7da", 
          color: "#721c24", 
          border: "1px solid #f5c6cb",
          borderRadius: "4px",
          marginBottom: "20px"
        }}>
          Error loading videos: {error}
          <button onClick={fetchVideos} style={{ marginLeft: "10px" }}>Retry</button>
        </div>
      )}

      {loading && !error && (
        <p>Loading videos...</p>
      )}

      {!loading && !error && videos.length === 0 && (
        <p>No videos uploaded yet. <Link to="/upload">Upload your first video</Link></p>
      )}

      {!loading && !error && videos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
          {videos.map((video) => (
            <div key={video.video_id} style={{ 
              border: "1px solid #ddd", 
              borderRadius: "8px", 
              padding: "15px",
              backgroundColor: "#fafafa"
            }}>
              <div style={{ 
                width: "100%", 
                aspectRatio: "16/9", 
                backgroundColor: "#e0e0e0", 
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
                fontSize: "14px",
                marginBottom: "10px"
              }}>
                🎬 Video Preview
              </div>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", wordBreak: "break-word" }}>
                {video.original_filename}
              </h3>
              <p style={{ margin: "5px 0", fontSize: "13px", color: "#666" }}>
                Size: {(video.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p style={{ margin: "5px 0", fontSize: "13px", color: "#666" }}>
                Uploaded: {new Date(video.uploaded_at).toLocaleDateString()}
              </p>
              <p style={{ margin: "5px 0", fontSize: "12px", color: "#999", fontFamily: "monospace" }}>
                ID: {video.video_id}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LibraryPage;