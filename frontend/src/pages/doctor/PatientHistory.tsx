import { useState, useEffect } from 'react';
import { patientHistoryService } from '../../services/patientHistoryServices';
import type { PatientHistoryDTO } from '../../types/patientHistory';
import { FaUser, FaStethoscope, FaPills, FaHistory, FaSort, FaSortUp, FaSortDown, FaTimes } from 'react-icons/fa';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';

const PatientHistory = () => {
  const [patients, setPatients] = useState<PatientHistoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<PatientHistoryDTO | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchQuery, sortOrder]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      if (searchQuery.trim()) {
        result = await patientHistoryService.searchPatients({
          query: searchQuery,
          page: currentPage,
          limit: itemsPerPage
        });
      } else {
        result = await patientHistoryService.getPatientsByDoctor(currentPage, itemsPerPage);
      }
      
      setPatients(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError('Failed to load patients');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
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

  const columns = [
    {
      key: "patient",
      header: "Patient",
      width: "2fr",
      render: (item: PatientHistoryDTO) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
            {item.patientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.patientName}</p>
            <p className="text-sm text-gray-500">{item.patientEmail}</p>
            <p className="text-sm text-gray-500">{item.patientPhone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "age",
      header: "Age",
      width: "1fr",
      hideOnMobile: true,
      render: (item: PatientHistoryDTO) => (
        <p>{item.patientDob ? calculateAge(item.patientDob) : '-'} years</p>
      ),
    },
    {
      key: "medicalHistory",
      header: "Medical Records",
      width: "1fr",
      render: (item: PatientHistoryDTO) => (
        <div className="text-center">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {item.medicalHistory.length} records
          </span>
        </div>
      ),
    },
    {
      key: "prescriptions",
      header: "Prescriptions",
      width: "1fr",
      render: (item: PatientHistoryDTO) => (
        <div className="text-center">
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            {item.medicalHistory.filter(entry => entry.prescription).length} prescriptions
          </span>
        </div>
      ),
    },
    {
      key: "lastVisit",
      header: "Last Visit",
      width: "1fr",
      render: (item: PatientHistoryDTO) => (
        <p className="text-sm">
          {item.medicalHistory.length > 0 
            ? formatDate(item.medicalHistory[0].appointmentDate)
            : 'No visits'
          }
        </p>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "1fr",
      render: (item: PatientHistoryDTO) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedPatient(item);
              setShowPatientModal(true);
            }}
            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-200 transition flex items-center gap-1"
          >
            <FaStethoscope className="text-xs" />
            View History
          </button>
        </div>
      ),
    },
  ];

  const sortOptions = [
    { label: "Newest First", order: "desc", icon: <FaSortDown className="h-4 w-4 text-indigo-500" /> },
    { label: "Oldest First", order: "asc", icon: <FaSortUp className="h-4 w-4 text-indigo-500" /> },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient History</h1>
        <p className="text-gray-600">View patient medical records and prescriptions</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="max-w-md w-full">
          <SearchBar
            placeholder="Search patients by name, email, or phone"
            onSearch={handleSearch}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white shadow hover:bg-indigo-50 transition-colors font-medium text-gray-700"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            >
              <FaSort className="text-indigo-500" />
              Sort by Date
              <FaSortDown className={`transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortDropdownOpen && (
              <div className="absolute right-0 z-20 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.label}
                    className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-indigo-50 text-left font-medium transition-colors ${
                      sortOrder === opt.order ? "bg-indigo-100 text-indigo-700" : "text-gray-700"
                    }`}
                    onClick={() => {
                      setSortOrder(opt.order as 'asc' | 'desc');
                      setCurrentPage(1);
                      setSortDropdownOpen(false);
                    }}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaUser className="text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaStethoscope className="text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Medical Records</p>
              <p className="text-2xl font-bold text-gray-900">
                {patients.reduce((acc, patient) => acc + patient.medicalHistory.length, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FaPills className="text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900">
                {patients.reduce((acc, patient) => 
                  acc + patient.medicalHistory.filter(entry => entry.prescription).length, 0
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaHistory className="text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Recent Visits</p>
              <p className="text-2xl font-bold text-gray-900">
                {patients.filter(patient => 
                  patient.medicalHistory.length > 0 && 
                  new Date(patient.medicalHistory[0].appointmentDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-600 py-8">
          <p>{error}</p>
          <button
            onClick={fetchPatients}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : patients.length > 0 ? (
        <>
          <DataTable
            data={patients}
            columns={columns}
            emptyMessage="No patients found."
            gridCols="grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]"
            containerClassName="max-h-[70vh] min-h-[50vh]"
          />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <FaUser className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
          <p className="text-gray-500">Start by completing appointments to build patient history.</p>
        </div>
      )}

      {/* Patient Detail Modal */}
      {showPatientModal && selectedPatient && (
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
                    <h2 className="text-2xl font-bold">{selectedPatient.patientName}</h2>
                    <p className="text-blue-100">{selectedPatient.patientEmail}</p>
                    <p className="text-blue-100">{selectedPatient.patientPhone}</p>
                    {selectedPatient.patientDob && (
                      <p className="text-blue-100 text-sm">
                        Age: {calculateAge(selectedPatient.patientDob)} years
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowPatientModal(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {selectedPatient.medicalHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaStethoscope className="text-4xl mx-auto mb-4 text-gray-300" />
                  <p>No medical history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
                  {selectedPatient.medicalHistory.map((entry, index) => (
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
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowPatientModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientHistory;