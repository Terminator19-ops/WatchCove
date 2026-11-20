import { useRef, useState } from "react";
import { Link } from "react-router-dom";

function UploadPage() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  function handleFile(event) {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus(null);
      console.log(selectedFile);
    }
  }

  async function uploadVideo() {
    if (!file) return;
    
    setIsUploading(true);
    setUploadStatus(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/upload",
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setUploadStatus({ 
          success: true, 
          message: `Successfully uploaded: ${result.original_filename}`,
          videoId: result.video_id
        });
        setFile(null);
        inputRef.current.value = "";
      } else {
        setUploadStatus({ 
          success: false, 
          message: result.detail || "Upload failed" 
        });
      }
    } catch (error) {
      setUploadStatus({ 
        success: false, 
        message: "Network error: " + error.message 
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <h1>Video Upload</h1>

      <input
        type="file"
        accept="video/*"
        ref={inputRef}
        onChange={handleFile}
        style={{ display: "none" }}
      />

      <button onClick={() => inputRef.current.click()}>
        Upload Video
      </button>

      {file && (
        <button onClick={uploadVideo} disabled={isUploading}>
          {isUploading ? "Uploading..." : "Send to Backend"}
        </button>
      )}

      {file && (
        <p style={{ marginTop: "10px", color: "#666" }}>
          Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      )}

      {uploadStatus && (
        <div style={{ 
          marginTop: "15px", 
          padding: "10px", 
          borderRadius: "4px",
          backgroundColor: uploadStatus.success ? "#d4edda" : "#f8d7da",
          color: uploadStatus.success ? "#155724" : "#721c24",
          border: uploadStatus.success ? "1px solid #c3e6cb" : "1px solid #f5c6cb"
        }}>
          {uploadStatus.message}
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <Link to="/">
          <button>Go to Home</button>
        </Link>
        <Link to="/library">
          <button style={{ marginLeft: "10px" }}>Go to Library</button>
        </Link>
      </div>
    </div>
  );
}

export default UploadPage;
