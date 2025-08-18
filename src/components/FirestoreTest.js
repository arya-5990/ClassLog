import React, { useState } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

function FirestoreTest() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setStatus('Testing connection...');
    
    try {
      // Test 1: Try to read from a collection
      setStatus('Testing read access...');
      const testCollection = collection(db, 'test');
      const snapshot = await getDocs(testCollection);
      setStatus(`Read test passed. Found ${snapshot.size} documents.`);
      
      // Test 2: Try to write to a collection
      setStatus('Testing write access...');
      const testDoc = {
        message: 'Test document',
        timestamp: new Date().toISOString(),
        test: true
      };
      
      const docRef = await addDoc(collection(db, 'test'), testDoc);
      setStatus(`Write test passed. Document created with ID: ${docRef.id}`);
      
      // Test 3: Try to access users collection
      setStatus('Testing users collection access...');
      const usersSnapshot = await getDocs(collection(db, 'users'));
      setStatus(`Users collection access passed. Found ${usersSnapshot.size} users.`);
      
      setStatus('All tests passed! Firestore is working correctly.');
      
    } catch (error) {
      console.error('Firestore test error:', error);
      setStatus(`Test failed: ${error.message} (Code: ${error.code})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Firestore Connection Test</h2>
      <p>This component tests if Firestore is properly connected and accessible.</p>
      
      <button 
        onClick={testConnection} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Firestore Connection'}
      </button>
      
      {status && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: status.includes('failed') ? '#f8d7da' : '#d4edda',
          border: `1px solid ${status.includes('failed') ? '#f5c6cb' : '#c3e6cb'}`,
          borderRadius: '5px',
          color: status.includes('failed') ? '#721c24' : '#155724'
        }}>
          <strong>Status:</strong> {status}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>Troubleshooting Steps:</h3>
        <ol>
          <li>Make sure Firestore Database is created in Firebase Console</li>
          <li>Check that security rules allow read/write access</li>
          <li>Verify your Firebase configuration is correct</li>
          <li>Ensure your project is not suspended</li>
        </ol>
      </div>
    </div>
  );
}

export default FirestoreTest;
