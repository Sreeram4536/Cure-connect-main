import { useState, useEffect } from 'react';
import { patientHistoryService } from '../../services/patientHistoryServices';
import type { PatientHistoryDTO, MedicalHistoryEntryDTO } from '../../types/patientHistory';
import { FaTimes, FaUser, FaStethoscope, FaSearch } from 'react-icons/fa';

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  patientName: string;
  patientEmail: string;
}

const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({
  isOpen,
  onClose,
  userId,
  patientName,
  patientEmail
}) => {
  console.log('PatientHistoryModal: Received props:', { userId, patientName, patientEmail });
  console.log('PatientHistoryModal: userId type:', typeof userId);
  console.log('PatientHistoryModal: userId value:', userId);
  const [patientHistory, setPatientHistory] = useState<PatientHistoryDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<MedicalHistoryEntryDTO[]>([]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchPatientHistory();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    if (patientHistory?.medicalHistory) {
      const filtered = patientHistory.medicalHistory.filter(entry =>
        entry.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.symptoms?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.treatment?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredHistory(filtered);
    }
  }, [patientHistory, searchQuery]);

  const fetchPatientHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('PatientHistoryModal - fetchPatientHistory called with userId:', userId);
      console.log('userId type:', typeof userId);
      
      // Ensure userId is a string
      let userIdString = '';
      if (typeof userId === 'string') {
        userIdString = userId;
      } else if (userId && typeof userId === 'object') {
        userIdString = (userId as any)._id?.toString() || (userId as any).id?.toString() || '';
      }
      // If a stringified object slipped through, extract 24-char ObjectId
      const idMatch = userIdString.match?.(/[a-fA-F0-9]{24}/);
      if (idMatch) userIdString = idMatch[0];
      
      console.log('Extracted userIdString:', userIdString);
      
      if (!userIdString) {
        setError('Invalid user ID');
        return;
      }
      
      console.log('Making API call with userIdString:', userIdString);
      const history = await patientHistoryService.getPatientHistory(userIdString);
      console.log('PatientHistoryModal - history received:', history);
      setPatientHistory(history);
    } catch (err: any) {
      console.error('Error fetching patient history:', err);
      
      // Provide more specific error messages
      if (err.response?.status === 404) {
        setError('No patient history found for this user. The patient may not have any completed appointments yet.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this patient\'s history.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to load patient history. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FaUser className="text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{patientName}</h2>
                <p className="text-blue-100">{patientEmail}</p>
                {patientHistory?.patientDob && (
                  <p className="text-blue-100 text-sm">
                    Age: {calculateAge(patientHistory.patientDob)} years
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">
              <p>{error}</p>
              <button
                onClick={fetchPatientHistory}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search medical history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Statistics */}
              {patientHistory && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Total Appointments</h3>
                    <p className="text-2xl font-bold text-blue-600">{patientHistory.medicalHistory.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Prescriptions</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {patientHistory.medicalHistory.filter(entry => entry.prescription).length}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">Last Visit</h3>
                    <p className="text-sm text-purple-600">
                      {patientHistory.medicalHistory.length > 0 
                        ? formatDate(patientHistory.medicalHistory[0].appointmentDate)
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Patient Info */}
              {patientHistory && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                    <p className="text-sm text-gray-600">Email: {patientHistory.patientEmail}</p>
                    <p className="text-sm text-gray-600">Phone: {patientHistory.patientPhone}</p>
                  </div>
                  
                  {patientHistory.allergies && patientHistory.allergies.length > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-red-900 mb-2">Allergies</h3>
                      <div className="flex flex-wrap gap-1">
                        {patientHistory.allergies.map((allergy, index) => (
                          <span key={index} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {patientHistory.chronicConditions && patientHistory.chronicConditions.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-yellow-900 mb-2">Chronic Conditions</h3>
                      <div className="flex flex-wrap gap-1">
                        {patientHistory.chronicConditions.map((condition, index) => (
                          <span key={index} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {patientHistory.emergencyContact && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-2">Emergency Contact</h3>
                      <p className="text-sm text-gray-600">{patientHistory.emergencyContact.name}</p>
                      <p className="text-sm text-gray-600">{patientHistory.emergencyContact.phone}</p>
                      <p className="text-sm text-gray-600">{patientHistory.emergencyContact.relationship}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Medical History */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaStethoscope className="text-4xl mx-auto mb-4 text-gray-300" />
                    <p>No medical history found</p>
                  </div>
                ) : (
                  filteredHistory.map((entry, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{entry.diagnosis}</h4>
                          <p className="text-sm text-gray-600">{formatDateTime(entry.appointmentDate)}</p>
                          <p className="text-sm text-blue-600">{entry.doctorName} - {entry.doctorSpeciality}</p>
                        </div>
                      </div>

                      {entry.symptoms && (
                        <div className="mb-3">
                          <h5 className="font-medium text-gray-700 mb-1">Symptoms:</h5>
                          <p className="text-sm text-gray-600">{entry.symptoms}</p>
                        </div>
                      )}

                      {entry.treatment && (
                        <div className="mb-3">
                          <h5 className="font-medium text-gray-700 mb-1">Treatment:</h5>
                          <p className="text-sm text-gray-600">{entry.treatment}</p>
                        </div>
                      )}

                      {entry.prescription && (
                        <div className="mb-3">
                          <h5 className="font-medium text-gray-700 mb-2">Prescription:</h5>
                          <div className="space-y-2">
                            {entry.prescription.items.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                  <p className="text-sm text-gray-600">Dosage: {item.dosage}</p>
                                  {item.instructions && (
                                    <p className="text-sm text-gray-600">Instructions: {item.instructions}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {entry.prescription.notes && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <strong>Notes:</strong> {entry.prescription.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {entry.notes && (
                        <div className="mb-3">
                          <h5 className="font-medium text-gray-700 mb-1">Additional Notes:</h5>
                          <p className="text-sm text-gray-600">{entry.notes}</p>
                        </div>
                      )}

                      {entry.followUpRequired && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Follow-up required</strong>
                            {entry.followUpDate && ` on ${formatDate(entry.followUpDate)}`}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryModal;