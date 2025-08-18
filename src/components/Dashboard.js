import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format, getDay } from 'date-fns';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  deleteDoc,
  doc,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import * as XLSX from 'xlsx';
import './Dashboard.css';

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' or 'attendance'
  
  // Teacher form state
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    subject: '',
    email: '',
    phone: ''
  });
  
  // Attendance form state
  const [attendanceForm, setAttendanceForm] = useState({
    teacherId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    timeIn: '',
    timeOut: '',
    status: 'present' // present, absent, late
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchTeachers();
    fetchAttendanceRecords();
  }, []);

  // Fetch all teachers from Firestore
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'teachers'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const teachersList = [];
      querySnapshot.forEach((doc) => {
        teachersList.push({ id: doc.id, ...doc.data() });
      });
      setTeachers(teachersList);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all attendance records from Firestore
  const fetchAttendanceRecords = async () => {
    try {
      const q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const records = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  };

  // Handle teacher form input changes
  const handleTeacherFormChange = (e) => {
    const { name, value } = e.target;
    setTeacherForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle attendance form input changes
  const handleAttendanceFormChange = (e) => {
    const { name, value } = e.target;
    setAttendanceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    
    if (!teacherForm.name || !teacherForm.subject) {
      alert('Please fill in teacher name and subject');
      return;
    }

    try {
      const newTeacher = {
        name: teacherForm.name.trim(),
        subject: teacherForm.subject.trim(),
        email: teacherForm.email.trim() || '',
        phone: teacherForm.phone.trim() || '',
        addedBy: currentUser.uid,
        addedByDesignation: currentUser.designation,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'teachers'), newTeacher);
      
      // Reset form and refresh teachers
      setTeacherForm({
        name: '',
        subject: '',
        email: '',
        phone: ''
      });
      
      fetchTeachers();
      alert('Teacher added successfully!');
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert('Failed to add teacher. Please try again.');
    }
  };

  // Mark attendance
  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    
    if (!attendanceForm.teacherId || !attendanceForm.date) {
      alert('Please select a teacher and date');
      return;
    }

    if (attendanceForm.status === 'present' && (!attendanceForm.timeIn || !attendanceForm.timeOut)) {
      alert('Please fill in time in and time out for present teachers');
      return;
    }

    try {
      const selectedTeacherData = teachers.find(t => t.id === attendanceForm.teacherId);
      
      const attendanceRecord = {
        teacherId: attendanceForm.teacherId,
        teacherName: selectedTeacherData.name,
        teacherSubject: selectedTeacherData.subject,
        date: attendanceForm.date,
        timeIn: attendanceForm.timeIn || '',
        timeOut: attendanceForm.timeOut || '',
        status: attendanceForm.status,
        addedBy: currentUser.uid,
        addedByDesignation: currentUser.designation,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'attendance'), attendanceRecord);
      
      // Reset form and refresh attendance records
      setAttendanceForm({
        teacherId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        timeIn: '',
        timeOut: '',
        status: 'present'
      });
      
      fetchAttendanceRecords();
      alert('Attendance marked successfully!');
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    }
  };

  // Delete a teacher
  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher? This will also delete all their attendance records.')) {
      try {
        // Delete teacher
        await deleteDoc(doc(db, 'teachers', teacherId));
        
        // Delete all attendance records for this teacher
        const attendanceQuery = query(collection(db, 'attendance'), where('teacherId', '==', teacherId));
        const attendanceSnapshot = await getDocs(attendanceQuery);
        
        const deletePromises = attendanceSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        fetchTeachers();
        fetchAttendanceRecords();
        alert('Teacher and all attendance records deleted successfully!');
      } catch (error) {
        console.error('Error deleting teacher:', error);
        alert('Failed to delete teacher. Please try again.');
      }
    }
  };

  // Delete an attendance record
  const handleDeleteAttendance = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await deleteDoc(doc(db, 'attendance', recordId));
        fetchAttendanceRecords();
      } catch (error) {
        console.error('Error deleting attendance record:', error);
        alert('Failed to delete attendance record. Please try again.');
      }
    }
  };

  // Download teachers data as Excel
  const downloadTeachersExcel = () => {
    if (teachers.length === 0) {
      alert('No teachers data to download');
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = teachers.map(teacher => ({
        'Teacher ID': teacher.id,
        'Name': teacher.name,
        'Subject': teacher.subject,
        'Email': teacher.email || 'N/A',
        'Phone': teacher.phone || 'N/A',
        'Added By': teacher.addedByDesignation || 'N/A',
        'Added On': format(new Date(teacher.createdAt), 'dd/MM/yyyy HH:mm:ss')
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 25 }, // Teacher ID
        { wch: 20 }, // Name
        { wch: 20 }, // Subject
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 15 }, // Added By
        { wch: 20 }  // Added On
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers Data');

      // Generate filename with current date
      const currentDate = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const filename = `Teachers_Data_${currentDate}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);
      
      alert('Teachers data downloaded successfully!');
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  // Download attendance data as Excel
  const downloadAttendanceExcel = () => {
    if (attendanceRecords.length === 0) {
      alert('No attendance data to download');
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = attendanceRecords.map(record => ({
        'Record ID': record.id,
        'Teacher Name': record.teacherName,
        'Subject': record.teacherSubject,
        'Date': format(new Date(record.date), 'dd/MM/yyyy'),
        'Day': getDayName(record.date),
        'Status': record.status.charAt(0).toUpperCase() + record.status.slice(1),
        'Time In': record.timeIn || 'N/A',
        'Time Out': record.timeOut || 'N/A',
        'Duration': calculateDuration(record.timeIn, record.timeOut),
        'Added By': record.addedByDesignation || 'N/A',
        'Timestamp': format(new Date(record.timestamp), 'dd/MM/yyyy HH:mm:ss')
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 25 }, // Record ID
        { wch: 20 }, // Teacher Name
        { wch: 20 }, // Subject
        { wch: 15 }, // Date
        { wch: 15 }, // Day
        { wch: 12 }, // Status
        { wch: 12 }, // Time In
        { wch: 12 }, // Time Out
        { wch: 15 }, // Duration
        { wch: 15 }, // Added By
        { wch: 20 }  // Timestamp
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Data');

      // Generate filename with current date
      const currentDate = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const filename = `Attendance_Data_${currentDate}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);
      
      alert('Attendance data downloaded successfully!');
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  // Calculate duration between two times
  const calculateDuration = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return '-';
    
    const [inHour, inMin] = timeIn.split(':').map(Number);
    const [outHour, outMin] = timeOut.split(':').map(Number);
    
    let totalInMinutes = inHour * 60 + inMin;
    let totalOutMinutes = outHour * 60 + outMin;
    
    if (totalOutMinutes < totalInMinutes) {
      totalOutMinutes += 24 * 60;
    }
    
    const durationMinutes = totalOutMinutes - totalInMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  // Get day name from date
  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[getDay(date)];
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Get filtered attendance records for selected teacher
  const getFilteredAttendance = () => {
    if (!selectedTeacher) return attendanceRecords;
    return attendanceRecords.filter(record => record.teacherId === selectedTeacher);
  };

  const filteredAttendance = getFilteredAttendance();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Visiting Faculty Attendance</h1>
          <div className="user-info">
            <span>Welcome, {currentUser?.designation || 'User'}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => setActiveTab('teachers')}
          >
            Manage Teachers
          </button>
          <button 
            className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            Mark Attendance
          </button>
        </div>

        {/* Teachers Management Tab */}
        {activeTab === 'teachers' && (
          <>
            <div className="form-section">
              <h2>Add New Teacher</h2>
              <form onSubmit={handleAddTeacher} className="teacher-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Teacher Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={teacherForm.name}
                      onChange={handleTeacherFormChange}
                      placeholder="Enter teacher name"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={teacherForm.subject}
                      onChange={handleTeacherFormChange}
                      placeholder="Enter subject"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email (Optional)</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={teacherForm.email}
                      onChange={handleTeacherFormChange}
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone">Phone (Optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={teacherForm.phone}
                      onChange={handleTeacherFormChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                
                <button type="submit" className="submit-button">
                  Add Teacher
                </button>
              </form>
            </div>

            <div className="teachers-section">
              <div className="section-header">
                <h2>Teachers Directory</h2>
                <div className="section-actions">
                  <button 
                    onClick={downloadTeachersExcel}
                    className="btn btn-success download-btn"
                    disabled={teachers.length === 0}
                  >
                    📊 Download Excel
                  </button>
                </div>
              </div>
              
              {loading ? (
                <div className="loading">Loading teachers...</div>
              ) : (
                <div className="table-container">
                  <table className="teachers-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Subject</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Added On</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="no-records">
                            No teachers found. Add your first teacher above.
                          </td>
                        </tr>
                      ) : (
                        teachers.map((teacher) => (
                          <tr key={teacher.id}>
                            <td>{teacher.name}</td>
                            <td>{teacher.subject}</td>
                            <td>{teacher.email || '-'}</td>
                            <td>{teacher.phone || '-'}</td>
                            <td>{format(new Date(teacher.createdAt), 'dd/MM/yyyy')}</td>
                            <td>
                              <button
                                onClick={() => handleDeleteTeacher(teacher.id)}
                                className="delete-button"
                                title="Delete teacher"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <>
            <div className="form-section">
              <h2>Mark Attendance</h2>
              <form onSubmit={handleMarkAttendance} className="attendance-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="teacherId">Select Teacher</label>
                    <select
                      id="teacherId"
                      name="teacherId"
                      value={attendanceForm.teacherId}
                      onChange={handleAttendanceFormChange}
                      required
                    >
                      <option value="">Choose a teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} - {teacher.subject}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={attendanceForm.date}
                      onChange={handleAttendanceFormChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={attendanceForm.status}
                      onChange={handleAttendanceFormChange}
                      required
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                  </div>
                  
                  {attendanceForm.status === 'present' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="timeIn">Time In</label>
                        <input
                          type="time"
                          id="timeIn"
                          name="timeIn"
                          value={attendanceForm.timeIn}
                          onChange={handleAttendanceFormChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="timeOut">Time Out</label>
                        <input
                          type="time"
                          id="timeOut"
                          name="timeOut"
                          value={attendanceForm.timeOut}
                          onChange={handleAttendanceFormChange}
                          required
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <button type="submit" className="submit-button">
                  Mark Attendance
                </button>
              </form>
            </div>

            <div className="teacher-selection-section">
              <h2>Filter by Teacher</h2>
              <div className="teacher-selector">
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="teacher-select"
                >
                  <option value="">All Teachers</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} - {teacher.subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="records-section">
              <div className="section-header">
                <h2>
                  Attendance Records
                  {selectedTeacher && teachers.find(t => t.id === selectedTeacher) && 
                    ` - ${teachers.find(t => t.id === selectedTeacher).name}`
                  }
                </h2>
                <div className="section-actions">
                  <button 
                    onClick={downloadAttendanceExcel}
                    className="btn btn-success download-btn"
                    disabled={attendanceRecords.length === 0}
                  >
                    📊 Download Excel
                  </button>
                </div>
              </div>
              
              {loading ? (
                <div className="loading">Loading records...</div>
              ) : (
                <div className="table-container">
                  <table className="records-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Teacher Name</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                        <th>Duration</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="no-records">
                            {selectedTeacher 
                              ? `No attendance records found for this teacher. Mark attendance above.`
                              : 'No attendance records found. Mark attendance above.'
                            }
                          </td>
                        </tr>
                      ) : (
                        filteredAttendance.map((record) => (
                          <tr key={record.id}>
                            <td>{format(new Date(record.date), 'dd/MM/yyyy')}</td>
                            <td>{getDayName(record.date)}</td>
                            <td>{record.teacherName}</td>
                            <td>{record.teacherSubject}</td>
                            <td>
                              <span className={`status-badge status-${record.status}`}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </td>
                            <td>{record.timeIn || '-'}</td>
                            <td>{record.timeOut || '-'}</td>
                            <td>{calculateDuration(record.timeIn, record.timeOut)}</td>
                            <td>
                              <button
                                onClick={() => handleDeleteAttendance(record.id)}
                                className="delete-button"
                                title="Delete record"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
