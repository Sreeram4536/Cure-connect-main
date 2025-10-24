import React, { useState, useContext } from 'react';
import { patientHistoryService } from '../../services/patientHistoryServices';
import { DoctorContext } from '../../context/DoctorContext';
import { getDoctorAccessToken } from '../../context/tokenManagerDoctor';

const PatientHistoryTest = () => {
  const [userId, setUserId] = useState('68455c30da8a24634432c6aa');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const doctorContext = useContext(DoctorContext);
  const currentToken = getDoctorAccessToken();

  const testApiCall = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing API call with userId:', userId);
      
      const history = await patientHistoryService.getPatientHistory(userId);
      console.log('API response:', history);
      setResult(history);
    } catch (err: any) {
      console.error('API error:', err);
      setError(err.message || 'API call failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Patient History API Test</h1>
      
      {/* Authentication Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
        <p><strong>Context Token:</strong> {doctorContext?.dToken ? 'Present' : 'Missing'}</p>
        <p><strong>LocalStorage Token:</strong> {currentToken ? 'Present' : 'Missing'}</p>
        <p><strong>Token Value:</strong> {currentToken ? currentToken.substring(0, 20) + '...' : 'None'}</p>
        <p><strong>Context Loading:</strong> {doctorContext?.loading ? 'Yes' : 'No'}</p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">User ID:</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={testApiCall}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test API Call'}
        </button>
        
        <button
          onClick={() => window.location.href = '/doctor/login'}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Go to Login
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <strong>Success!</strong>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PatientHistoryTest;
