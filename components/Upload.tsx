import { CheckCircle2, ImageIcon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useOutletContext } from "react-router";
import {
  PROGRESS_INTERVAL_MS,
  PROGRESS_STEP,
  REDIRECT_DELAY_MS,
} from "../lib/constants";

const Upload = ({ onComplete }: UploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const { isSignedIn } = useOutletContext<AuthContext>();
  const isSignedInRef = useRef(isSignedIn);
  isSignedInRef.current = isSignedIn;

  const processFile = (selectedFile: File) => {
    if (!isSignedInRef.current) return;

    setFile(selectedFile);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = () => {
      if (!isSignedInRef.current || typeof reader.result !== "string") return;

      const base64File = reader.result;
      const progressInterval = setInterval(() => {
        setProgress((currentProgress) => {
          if (!isSignedInRef.current) {
            clearInterval(progressInterval);
            return currentProgress;
          }

          const nextProgress = Math.min(currentProgress + PROGRESS_STEP, 100);

          if (nextProgress === 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
              if (isSignedInRef.current) onComplete?.(base64File);
            }, REDIRECT_DELAY_MS);
          }

          return nextProgress;
        });
      }, PROGRESS_INTERVAL_MS);
    };
    reader.readAsDataURL(selectedFile);
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSignedInRef.current) return;

    const selectedFile = event.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isSignedInRef.current) setIsDragging(true);
  };

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isSignedInRef.current) setIsDragging(false);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!isSignedInRef.current) return;

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  return (
    <div className="upload">
      {!file ? (
        <div
          className={`dropzone ${isDragging ? "is-dragging" : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input
            type="file"
            className="drop-input"
            accept=".jpg,.jpeg,.png"
            disabled={!isSignedIn}
            onChange={onChange}
          />

          <div className="drop-content">
            <div className="drop-icon">
              <UploadIcon size={20} />
            </div>
            <p>
              {isSignedIn
                ? "Click to upload or just drag and drop"
                : "Sign in or sign up with Puter to upload"}
            </p>
            <p className="help">Maximum file size 50 MB.</p>
          </div>
        </div>
      ) : (
        <div className="upload-status">
          <div className="status-content">
            <div className="status-icon">
              {progress === 100 ? (
                <CheckCircle2 className="check" />
              ) : (
                <ImageIcon className="iamge" />
              )}
            </div>

            <h3>{file.name}</h3>
            <div className="progress">
              <div className="bar" style={{ width: `${progress}%` }} />

              <p className="status-text">
                {progress < 100 ? "Analyzing Floor pan..." : "Redirecting ..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
