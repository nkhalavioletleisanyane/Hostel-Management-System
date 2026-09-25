import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import WaveBackground from '../components/ui/WaveBackground';
import { User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import '../styles/login.css';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));

    const cleanUserId = userId.trim().toLowerCase();
    const cleanName = name.trim();
    const email = cleanUserId.includes('@') ? cleanUserId : `${cleanUserId}@hms.edu`;

    // 1. Save to registered users map
    try {
      const existingStr = localStorage.getItem('hms_registered_users');
      const registeredMap = existingStr ? JSON.parse(existingStr) : {};
      registeredMap[cleanUserId] = {
        password: password.trim(),
        user: {
          id: `u_${Date.now()}`,
          name: cleanName,
          email,
          role: 'student',
          studentId: `STU-2024-${String(Math.floor(Math.random() * 800) + 100)}`,
        },
      };
      localStorage.setItem('hms_registered_users', JSON.stringify(registeredMap));

      // 2. Ensure student record is added to hms_students_data
      const studentId = registeredMap[cleanUserId].user.studentId;
        const nameParts = cleanName.split(' ');
        const firstName = nameParts[0] || 'Student';
        const lastName = nameParts.slice(1).join(' ') || 'User';
        const avatarInitials = ((firstName[0] || 'S') + (lastName[0] || 'U')).toUpperCase();

        const storedStudents = localStorage.getItem('hms_students_data');
        const studentsList = storedStudents ? JSON.parse(storedStudents) : [];
        const alreadyExists = studentsList.some(
          (s: any) => s.email?.toLowerCase() === email.toLowerCase() || s.studentId === studentId
        );

        if (!alreadyExists) {
          const newStudent = {
            id: `s_${Date.now()}`,
            studentId,
            firstName,
            lastName,
            email,
            phone: '9876543210',
            course: 'MCA',
            semester: 'Sem 1',
            department: 'Computer Applications',
            roomNumber: 'A-201',
            blockName: 'Block A',
            checkInDate: new Date().toISOString().slice(0, 10),
            emergencyContact: 'Guardian / Parent',
            emergencyPhone: '9876500000',
            status: 'active',
            avatar: avatarInitials,
          };
          studentsList.unshift(newStudent);
          localStorage.setItem('hms_students_data', JSON.stringify(studentsList));
        }
    } catch (err) {
      console.error('Error saving signup data:', err);
    }

    setLoading(false);
    alert('Account created successfully! You can now log in with your credentials.');
    navigate('/login');
  };

  return (
    <>
      <Navbar />
      <div className="login-wrapper">
        <WaveBackground />
        <div className="login-box fade-in-up">
          {/* Centered Brand Header */}
          <div className="login-header">
            <Link to="/" className="login-brand">
              <span className="brand-icon">🏠</span>
              <span>HMS</span>
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
                  placeholder="e.g. stu104 or admin2"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
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
