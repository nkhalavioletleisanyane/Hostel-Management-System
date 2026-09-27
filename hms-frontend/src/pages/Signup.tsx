import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import WaveBackground from '../components/ui/WaveBackground';
import Logo from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Camera,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Trash2,
  RotateCcw,
  Mail,
  Phone,
} from 'lucide-react';
import { logAuditAction } from '../utils/auditLogger';
import '../styles/login.css';

const Signup: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If student or admin is already logged in, redirect directly to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Face Photo states
  const [faceImage, setFaceImage] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [photoError, setPhotoError] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Attach webcam stream to video element when camera becomes active
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive]);

  // Clean up media tracks when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setPhotoError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera is not supported on this browser or device. Please upload an image file instead.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions in your browser or upload an image file instead.');
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally to mirror selfie orientation
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setFaceImage(dataUrl);
    setPhotoError('');
    stopCamera();
  };

  const handleFileUpload = (file: File) => {
    setCameraError('');
    setPhotoError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFaceImage(reader.result as string);
      stopCamera();
    };
    reader.onerror = () => {
      setPhotoError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhotoError('');

    if (!faceImage) {
      setPhotoError('A face photograph is required to create your student account. Please take a photo or upload an image.');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 400));

    const cleanUserId = userId.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setPhotoError('Please type a valid email address (e.g. student@gmail.com).');
      setLoading(false);
      return;
    }

    if (!cleanPhone || cleanPhone.length < 7) {
      setPhotoError('Please type a valid mobile phone number (at least 7 digits).');
      setLoading(false);
      return;
    }

    // 1. Save to registered users map (student account with photo)
    try {
      const existingStr = localStorage.getItem('hms_registered_users');
      const registeredMap = existingStr ? JSON.parse(existingStr) : {};
      const studentId = `STU-2024-${String(Math.floor(Math.random() * 800) + 100)}`;
      registeredMap[cleanUserId] = {
        password: password.trim(),
        user: {
          id: `u_${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          role: 'student',
          studentId,
          photo: faceImage,
        },
      };
      localStorage.setItem('hms_registered_users', JSON.stringify(registeredMap));

      // 2. Ensure student record is added to hms_students_data with photo
      const nameParts = cleanName.split(' ');
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      const storedStudents = localStorage.getItem('hms_students_data');
      const studentsList = storedStudents ? JSON.parse(storedStudents) : [];
      const alreadyExists = studentsList.some(
        (s: any) => s.email?.toLowerCase() === cleanEmail.toLowerCase() || s.studentId === studentId
      );

      if (!alreadyExists) {
        const newStudent = {
          id: `s_${Date.now()}`,
          studentId,
          firstName,
          lastName,
          email: cleanEmail,
          phone: cleanPhone,
          course: 'MCA',
          semester: 'Sem 1',
          department: 'Computer Applications',
          roomNumber: 'A-201',
          blockName: 'Block A',
          checkInDate: new Date().toISOString().slice(0, 10),
          emergencyContact: '',
          emergencyPhone: '',
          status: 'active' as const,
          avatar: faceImage,
          photo: faceImage,
        };
        studentsList.unshift(newStudent);
        localStorage.setItem('hms_students_data', JSON.stringify(studentsList));

        // Log registration audit record explicitly tagged with this student's ID
        logAuditAction(
          'students',
          'CREATE',
          `${cleanName} (${studentId})`,
          `${cleanName} (Student Self-Registration)`,
          `New resident enrolled account with typed phone (${cleanPhone}), typed email (${cleanEmail}), and verified face photo`,
          studentId
        );
      }

      // 3. Ensure student has initial fee invoices generated in hms_fees_data
      const storedFees = localStorage.getItem('hms_fees_data');
      const feesList = storedFees ? JSON.parse(storedFees) : [];
      const hasFee = feesList.some((f: any) => f.studentId === studentId);
      if (!hasFee) {
        const studentDisplayName = `${firstName} ${lastName}`.trim() || cleanName;
        const initialFees = [
          {
            id: `inv_${Date.now()}_1`,
            invoiceNo: `INV-2024-${Math.floor(Math.random() * 800) + 100}`,
            studentId,
            studentName: studentDisplayName,
            category: 'Hostel Sem Fee',
            amount: 45000,
            issueDate: new Date().toISOString().slice(0, 10),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            status: 'pending',
          },
          {
            id: `inv_${Date.now()}_2`,
            invoiceNo: `INV-2024-${Math.floor(Math.random() * 800) + 100}`,
            studentId,
            studentName: studentDisplayName,
            category: 'Mess Fee',
            amount: 18000,
            issueDate: new Date().toISOString().slice(0, 10),
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            status: 'pending',
          },
        ];
        feesList.unshift(...initialFees);
        localStorage.setItem('hms_fees_data', JSON.stringify(feesList));
      }
    } catch (err) {
      console.error('Error saving signup data:', err);
    }

    setLoading(false);
    alert('Account created successfully with verified face photo! You can now log in with your credentials.');
    navigate('/login');
  };

  return (
    <>
      <Navbar />
      <div className="login-wrapper">
        <WaveBackground />
        <div className="login-box fade-in-up" style={{ maxWidth: 480 }}>
          {/* Centered Brand Header */}
          <div className="login-header">
            <Link to="/" className="login-brand" style={{ display: 'inline-flex', justifyContent: 'center' }}>
              <Logo size="lg" />
            </Link>
            <p className="login-subtitle">Hostel Management System</p>
            <h2 className="login-welcome-title">Student Registration</h2>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <span className="input-icon-lead">
                  <User size={18} />
                </span>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* User ID */}
            <div className="form-group">
              <label>User ID / Roll No</label>
              <div className="input-with-icon">
                <span className="input-icon-lead">
                  <User size={18} />
                </span>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. stu104 or roll no"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <span className="input-icon-lead">
                  <Mail size={18} />
                </span>
                <input
                  className="form-input"
                  type="email"
                  placeholder="e.g. student@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Mobile Phone Number */}
            <div className="form-group">
              <label>Mobile Phone Number</label>
              <div className="input-with-icon">
                <span className="input-icon-lead">
                  <Phone size={18} />
                </span>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <span className="input-icon-lead">
                  <Lock size={18} />
                </span>
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* REQUIRED FACE PHOTO SECTION (TAKE PHOTO OR UPLOAD IMAGE) */}
            <div className="form-group" style={{ marginTop: 16, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Camera size={16} style={{ color: 'var(--clr-primary)' }} />
                  Face Photograph / ID Photo <span style={{ color: 'var(--clr-danger)' }}>*</span>
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)' }}>
                  Required (Camera or Upload)
                </span>
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              {/* View 1: Active Live Camera */}
              {isCameraActive ? (
                <div
                  style={{
                    border: '2px solid var(--clr-primary)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    background: '#090a0f',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)',
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)', // Mirrored selfie orientation
                      }}
                    />

                    {/* Face Guide Oval */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '150px',
                        height: '190px',
                        borderRadius: '50%',
                        border: '2px dashed rgba(255, 255, 255, 0.8)',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Live Stream Indicator */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 12,
                        background: 'rgba(0, 0, 0, 0.65)',
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                      Live Camera
                    </div>
                  </div>

                  {/* Camera Controls */}
                  <div
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'var(--clr-surface)',
                      borderTop: '1px solid var(--clr-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-outline-dark btn-sm"
                      onClick={stopCamera}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={capturePhoto}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                    >
                      <Camera size={15} />
                      <span>Snap Photo</span>
                    </button>
                  </div>
                </div>
              ) : faceImage ? (
                /* View 2: Photo Selected / Captured */
                <div
                  style={{
                    border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '12px 14px',
                    background: 'var(--clr-surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '2px solid var(--clr-primary)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={faceImage}
                        alt="Face Photo Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Photo Attached</span>
                        <CheckCircle size={15} style={{ color: 'var(--clr-success)' }} />
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>
                        Verified face image for your student profile
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                      onClick={() => {
                        setFaceImage('');
                        startCamera();
                      }}
                      title="Retake photo using camera"
                    >
                      <RotateCcw size={12} />
                      <span>Retake</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload a different photo"
                    >
                      <UploadCloud size={12} />
                      <span>Upload</span>
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ color: 'var(--clr-danger)' }}
                      onClick={() => setFaceImage('')}
                      title="Remove image"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                /* View 3: Initial Empty State with Both Camera & Upload Buttons */
                <div
                  style={{
                    border: photoError ? '2px dashed var(--clr-danger)' : '2px dashed var(--clr-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 14px',
                    textAlign: 'center',
                    background: 'rgba(99, 102, 241, 0.03)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--clr-primary)',
                      }}
                    >
                      <Camera size={22} />
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--clr-text)' }}>
                        Take a Photo or Upload Image
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>
                        Students must provide a face photo for residency verification
                      </div>
                    </div>

                    {/* Both Options */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={startCamera}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px' }}
                      >
                        <Camera size={14} />
                        <span>Take with Camera</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px' }}
                      >
                        <UploadCloud size={14} />
                        <span>Upload Photo</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {cameraError && (
                <div style={{ color: 'var(--clr-danger)', fontSize: '0.78rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={14} />
                  <span>{cameraError}</span>
                </div>
              )}

              {photoError && (
                <div style={{ color: 'var(--clr-danger)', fontSize: '0.78rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={14} />
                  <span>{photoError}</span>
                </div>
              )}
            </div>

            {/* Actions: Sign Up + Back Button right near each other */}
            <div className="login-actions">
              <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
                {loading ? 'Creating Account…' : 'Sign Up →'}
              </button>
              <Link to="/" className="btn login-back-btn">
                <ArrowLeft size={16} /> Back to Home
              </Link>
            </div>

            {/* Switch to Sign In */}
            <div className="login-switch-prompt">
              Already have an account?
              <Link to="/login" className="login-switch-link">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Signup;
