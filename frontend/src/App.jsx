import { useRef, useState } from "react";

function App() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);

  function handleFile(event) {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);
      console.log(selectedFile);
    }
  }

  async function uploadVideo() {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    "http://127.0.0.1:8000/upload",
    {
      method: "POST",
      body: formData
    }
  );

  const result = await response.json();
  console.log(result);
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
        <button onClick={uploadVideo}>
          Send to Backend
        </button>
      )}
    </div>
  );
}



export default App;