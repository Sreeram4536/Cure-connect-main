import { useContext, useEffect, useState, useRef } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/admin/assets";
import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
import SearchBar from "../../components/common/SearchBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import { FaSort, FaSortUp, FaSortDown, FaChevronDown, FaCheck, FaHistory } from 'react-icons/fa';
import { getPrescriptionByAppointmentAPI } from "../../services/appointmentServices";
import PatientHistoryModal from "../../components/doctor/PatientHistoryModal";
// import { AppointmentConfirmAPI, AppointmentCancelAPI } from "../../services/doctorServices";

const DoctorAppointments = () => {
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const context = useContext(DoctorContext);
  const appContext = useContext(AppContext);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  // const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 6;
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // default: newest first
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [rxOpen, setRxOpen] = useState(false);
  const [rx, setRx] = useState<any | null>(null);
  const [showPatientHistory, setShowPatientHistory] = useState(false);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<{
    userId: string;
    patientName: string;
    patientEmail: string;
  } | null>(null);

  if (!appContext) {
    throw new Error("AppContext must be used within AppContextProvider");
  }

  const { calculateAge, slotDateFormat, currencySymbol } = appContext;

  if (!context) {
    throw new Error("DoctorContext must be used within DoctorContextProvider");
  }

  const {
    dToken,
    getAppointmentsPaginated,
    confirmAppointment,
    cancelAppointment,
  } = context;

  useEffect(() => {
    if (dToken) {
      fetchAppointments();
    }
    // eslint-disable-next-line
  }, [dToken, currentPage, sortOrder, searchQuery]);

  useEffect(() => {
    if (!dToken) {
      navigate("/doctor/login");
    }
  }, [dToken, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const result = await getAppointmentsPaginated(currentPage, itemsPerPage, searchQuery);
      setAppointments(result.data);
      setTotalPages(result.totalPages);
  // setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      await confirmAppointment(appointmentId); // Use context method
      fetchAppointments();
    } catch (error) {
      console.error("Failed to confirm appointment:", error);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const data = await cancelAppointment(appointmentId, currentPage, itemsPerPage);
      if (data && data.data) {
        setAppointments(data.data);
        setTotalPages(data.totalPages || 1);
  // setTotalCount(data.totalCount || 0);
      } else if (data && data.appointments) {
        setAppointments(data.appointments);
        setTotalPages(1);
  // setTotalCount(data.appointments.length);
      } else {
        fetchAppointments(); // fallback
      }
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
    }
  };



  const columns = [
    {
      key: "index",
      header: "SL.NO",
      width: "0.5fr",
      hideOnMobile: true,
      render: (_: any, index: number) => <p>{index + 1}</p>,
    },
    {
      key: "patient",
      header: "Patient",
      width: "2fr",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <img
            className="w-12 h-12 rounded-full object-cover"
            src={item.userData?.image ? item.userData.image : "/default-avatar.png"}
            alt="user"
            onError={e => { (e.target as HTMLImageElement).src = "/default-avatar.png"; }}
          />
          <p>{item.userData?.name || '-'}</p>
        </div>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      width: "1fr",
      render: (item: any) => (
        <div>
          <p className="text-xs inline border border-primary px-2 rounded-full">
            {item.payment ? "Paid" : "Pending"}
          </p>
        </div>
      ),
    },
    {
      key: "age",
      header: "Age",
      width: "1fr",
      hideOnMobile: true,
      render: (item: any) => (
        <p>{item.userData?.dob ? calculateAge(item.userData.dob) : '-'}</p>
      ),
    },
    {
      key: "datetime",
      header: "Date & Time",
      width: "3fr",
      render: (item: any) => (
        <p>
          {slotDateFormat(item.slotDate)}, {item.slotTime}
        </p>
      ),
    },
    {
      key: "fees",
      header: "Fees",
      width: "1fr",
      render: (item: any) => (
        <p>
          {currencySymbol}
          {item.amount}
        </p>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "1fr",
      render: (item: any) => (
        <div className="flex gap-2 items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAppointment(item);
              setShowModal(true);
            }}
            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-indigo-200 transition"
          >
            Info
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              
              console.log('=== DEBUGGING USER ID EXTRACTION ===');
              console.log('item.userId type:', typeof item.userId);
              console.log('item.userId value:', item.userId);
              console.log('item.userData:', item.userData);
              console.log('item.userData._id:', item.userData?._id);
              console.log('item.userData._id type:', typeof item.userData?._id);
              
              // Extract the actual user ID string from the object
              let userId = '';
              
              // First try to get from userData._id (most reliable)
              if (item.userData && item.userData._id) {
                console.log('userData._id before toString:', item.userData._id);
                console.log('userData._id constructor:', item.userData._id.constructor?.name);
                console.log('userData._id has toString:', typeof item.userData._id.toString);
                
                // Try different methods to convert to string
                try {
                  if (typeof item.userData._id.toString === 'function') {
                    userId = item.userData._id.toString();
                    console.log('Using userData._id toString():', userId);
                  } else {
                    userId = String(item.userData._id);
                    console.log('Using userData._id String():', userId);
                  }
                } catch (error) {
                  console.error('Error converting _id to string:', error);
                  userId = JSON.stringify(item.userData._id);
                  console.log('Using userData._id JSON.stringify():', userId);
                }
                
                console.log('userId after processing type:', typeof userId);
                console.log('userId after processing value:', userId);
              }
              // If that fails, try item.userId
              else if (item.userId) {
                if (typeof item.userId === 'string') {
                  userId = item.userId;
                  console.log('Using string userId:', userId);
                } else if (typeof item.userId === 'object') {
                  if (item.userId._id) {
                    userId = item.userId._id.toString();
                    console.log('Using userId._id:', userId);
                  } else if (item.userId.id) {
                    userId = item.userId.id.toString();
                    console.log('Using userId.id:', userId);
                  }
                }
              }
              
              console.log('Final extracted userId:', userId);
              console.log('Final extracted userId type:', typeof userId);
              console.log('=== END DEBUGGING ===');
              
              if (!userId || typeof userId !== 'string') {
                console.error('Could not extract userId from item:', item);
                console.error('userId value:', userId);
                console.error('userId type:', typeof userId);
                alert('Error: Could not identify patient ID');
                return;
              }
              
              // Ensure userId is a clean string (remove any extra whitespace)
              userId = userId.trim();
              
              // Final validation
              if (!userId || userId.length < 10) {
                console.error('Invalid userId after processing:', userId);
                alert('Error: Invalid patient ID');
                return;
              }
              
              // As a final guard, if someone passes a stringified object, extract 24-char ObjectId
              const idMatch = userId.match(/[a-fA-F0-9]{24}/);
              const safeUserId = idMatch ? idMatch[0] : userId;

              console.log('Setting selectedPatientForHistory with:', {
                userId: safeUserId,
                patientName: item.userData?.name || 'Unknown',
                patientEmail: item.userData?.email || ''
              });
              
              setSelectedPatientForHistory({
                userId: safeUserId,
                patientName: item.userData?.name || 'Unknown',
                patientEmail: item.userData?.email || ''
              });
              setShowPatientHistory(true);
            }}
            className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-200 transition flex items-center gap-1"
            title="View Patient History"
          >
            <FaHistory className="text-xs" />
            History
          </button>
          {item.cancelled ? (
            <p className="text-red-500">Cancelled</p>
          ) : item.isConfirmed ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                try { sessionStorage.setItem('activeAppointmentId', String(item._id || item.appointmentId)); } catch {}
                try { sessionStorage.setItem('roleForCall', 'doctor'); } catch {}
                // Navigate to call page using conversation/appointment identifier if available
                if (item.conversationId) {
                  navigate(`/call/${item.conversationId}`);
                } else if (item.appointmentId) {
                  navigate(`/call/${item.appointmentId}`);
                } else {
                  navigate("/doctor/consultation");
                }
              }}
              className="bg-primary px-4 py-1.5 text-sm rounded-lg font-medium text-white shadow transition duration-200"
            >
              Consultation
            </button>
          ) : (
            <>
              {item.isCompleted && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const { data } = await getPrescriptionByAppointmentAPI(item._id || item.appointmentId);
                      setRx(data.prescription || null);
                      setRxOpen(true);
                    } catch {}
                  }}
                  className="bg-white border px-4 py-1.5 text-sm rounded-lg font-medium text-gray-700 shadow"
                >
                  View Prescription
                </button>
              )}
              <img
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelAppointment(item._id!);
                }}
                className="w-8 cursor-pointer"
                src={assets.cancel_icon}
                alt="Cancel"
              />
              <img
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmAppointment(item._id!);
                }}
                className="w-8 cursor-pointer"
                src={assets.tick_icon}
                alt="Confirm"
              />
            </>
          )}
        </div>
      ),
    },
  ];

  // Only date sort options
  const sortOptions = [
    { label: "Newest First", order: "desc", icon: <FaSortDown className="h-4 w-4 text-indigo-500" /> },
    { label: "Oldest First", order: "asc", icon: <FaSortUp className="h-4 w-4 text-indigo-500" /> },
  ];

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All Appointments</p>

      {/* 🔍 Left-aligned Search Bar */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="max-w-sm w-full">
          <SearchBar
            placeholder="Search by patient name"
            onSearch={(query) => {
              if (searchTimeout.current) clearTimeout(searchTimeout.current);
              searchTimeout.current = setTimeout(() => {
                if (query !== searchQuery) {
                  setSearchQuery(query);
                  setCurrentPage(1);
                }
              }, 400);
            }}
          />
        </div>
        {/* Modern Sort Dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white shadow hover:bg-indigo-50 transition-colors font-medium text-gray-700"
            onClick={() => setSortDropdownOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={sortDropdownOpen}
          >
            <FaSort className="text-indigo-500" />
            Sort by Date
            <FaChevronDown className={`transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {sortDropdownOpen && (
            <div className="absolute right-0 z-20 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl animate-fade-in overflow-hidden">
              {sortOptions.map((opt, idx) => (
                <button
                  key={opt.label}
                  className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-indigo-50 text-left font-medium transition-colors ${
                    sortOrder === opt.order ? "bg-indigo-100 text-indigo-700" : "text-gray-700"
                  } ${idx === 0 ? "rounded-t-xl" : ""} ${idx === sortOptions.length - 1 ? "rounded-b-xl" : ""}`}
                  onClick={() => {
                    setSortOrder(opt.order as 'asc' | 'desc');
                    setCurrentPage(1);
                    setSortDropdownOpen(false);
                  }}
                  aria-pressed={sortOrder === opt.order}
                >
                  {opt.icon}
                  {opt.label}
                  {sortOrder === opt.order && <FaCheck className="ml-auto text-green-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : appointments.length > 0 ? (
        <>
          <DataTable
            data={appointments}
            columns={columns}
            emptyMessage="No matching appointments found."
            gridCols="grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr]"
            containerClassName="max-h-[80vh] min-h-[50vh]"
          />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
          {/* Modal for appointment details */}
         {/* Modal for appointment details */}
{showModal && selectedAppointment && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 animate-fade-in relative overflow-hidden">
      
      {/* Header with patient image */}
      <div className="flex items-center gap-4 mb-6">
        <img
          className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow"
          src={selectedAppointment.userData?.image || "/default-avatar.png"}
          alt="Patient"
          onError={e => { (e.target as HTMLImageElement).src = "/default-avatar.png"; }}
        />
        <div>
          <h2 className="text-2xl font-bold text-indigo-700">
            {selectedAppointment.userData?.name || '-'}
          </h2>
          <p className="text-gray-500">{selectedAppointment.userData?.email || '-'}</p>
          {selectedAppointment.userData?.phone && (
            <p className="text-gray-500">📞 {selectedAppointment.userData.phone}</p>
          )}
        </div>
      </div>

      {/* Appointment Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
        <div className="bg-indigo-50 p-3 rounded-lg shadow-sm">
          <span className="font-semibold text-gray-900">Date</span>
          <p className="mt-1">{slotDateFormat(selectedAppointment.slotDate)}</p>
        </div>
        <div className="bg-indigo-50 p-3 rounded-lg shadow-sm">
          <span className="font-semibold text-gray-900">Slot</span>
          <p className="mt-1">{selectedAppointment.slotTime}</p>
        </div>
        <div className="bg-indigo-50 p-3 rounded-lg shadow-sm">
          <span className="font-semibold text-gray-900">Fees</span>
          <p className="mt-1">₹{selectedAppointment.amount}</p>
        </div>
        <div className="bg-indigo-50 p-3 rounded-lg shadow-sm">
          <span className="font-semibold text-gray-900">Payment Method</span>
          <p className="mt-1">{selectedAppointment.razorpayOrderId ? "Razorpay" : "Wallet"}</p>
        </div>
        <div className="bg-indigo-50 p-3 rounded-lg shadow-sm">
          <span className="font-semibold text-gray-900">Status</span>
          <p className="mt-1 capitalize">{selectedAppointment.status || '-'}</p>
        </div>

        {selectedAppointment.cancelled && (
          <div className="sm:col-span-2 bg-red-50 p-3 rounded-lg border border-red-200">
            <span className="font-semibold text-red-600">Cancelled</span>
            <p className="mt-1">
              {selectedAppointment.cancellationReason ? `Reason: ${selectedAppointment.cancellationReason}` : "No reason provided"}
            </p>
            {selectedAppointment.cancelledBy && (
              <p className="mt-1">Cancelled By: {selectedAppointment.cancelledBy}</p>
            )}
            {selectedAppointment.cancelledAt && (
              <p className="mt-1">Cancelled At: {slotDateFormat(selectedAppointment.cancelledAt)}</p>
            )}
          </div>
        )}
      </div>

      {/* Notes / Symptoms */}
      {selectedAppointment.notes && (
        <div className="mt-4 bg-gray-50 p-4 rounded-lg shadow-sm">
          <span className="font-semibold text-gray-900">Notes / Symptoms</span>
          <p className="mt-1 text-gray-700">{selectedAppointment.notes}</p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition font-medium"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


        </>
      ) : (
        <div className="text-gray-500 mt-6 text-center w-full">
          No appointments found.
        </div>
      )}
      {rxOpen && rx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold">Prescription</h3>
              <button onClick={()=>setRxOpen(false)} className="text-gray-500">✕</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2">Medicine</th>
                    <th className="py-2">Dosage</th>
                    <th className="py-2">Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {(rx.items||[]).map((it:any, idx:number)=> (
                    <tr key={idx} className="border-t">
                      <td className="py-2">{it.name}</td>
                      <td className="py-2">{it.dosage}</td>
                      <td className="py-2">{it.instructions || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rx.notes && <div className="mt-3 text-sm text-gray-700">Notes: {rx.notes}</div>}
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={()=>window.print()} className="px-3 py-2 rounded-lg bg-primary text-white">Print</button>
              <button onClick={()=>setRxOpen(false)} className="px-3 py-2 rounded-lg border">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Patient History Modal */}
      {showPatientHistory && selectedPatientForHistory && (
        <>
          {console.log('Rendering PatientHistoryModal with:', selectedPatientForHistory)}
          <PatientHistoryModal
            isOpen={showPatientHistory}
            onClose={() => {
              setShowPatientHistory(false);
              setSelectedPatientForHistory(null);
            }}
            userId={selectedPatientForHistory.userId}
            patientName={selectedPatientForHistory.patientName}
            patientEmail={selectedPatientForHistory.patientEmail}
          />
        </>
      )}
    </div>
  );
};

export default DoctorAppointments;
