import { useContext, useEffect, useState, useRef } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/admin/assets";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SearchBar from "../../components/common/SearchBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import { FaSort, FaSortUp, FaSortDown, FaChevronDown, FaCheck, FaHistory } from 'react-icons/fa';
import { Download } from 'lucide-react';
import { toast } from 'react-toastify';
import { getPrescriptionByAppointmentAPI } from "../../services/appointmentServices";
import PatientHistoryModal from "../../components/doctor/PatientHistoryModal";
import { downloadPrescriptionAsPDF } from "../../utils/prescriptionDownload";
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
      const result = await getAppointmentsPaginated(currentPage, itemsPerPage, searchQuery, sortOrder);
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
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border"
            src={item.userData?.image || "/default-avatar.png"}
            alt="user"
            onError={(e) => ((e.target as HTMLImageElement).src = "/default-avatar.png")}
          />
          <div className="flex flex-col">
            <p className="font-medium text-gray-800">{item.userData?.name || "-"}</p>
            <p className="text-gray-500 text-xs sm:text-sm">{item.userData?.email || "-"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      width: "1fr",
      render: (item: any) => (
        <p
          className={`text-xs sm:text-sm inline border px-2 py-0.5 rounded-full ${
            item.payment ? "border-green-500 text-green-600 bg-green-50" : "border-yellow-500 text-yellow-600 bg-yellow-50"
          }`}
        >
          {item.payment ? "Paid" : "Pending"}
        </p>
      ),
    },
    {
      key: "age",
      header: "Age",
      width: "1fr",
      hideOnMobile: true,
      render: (item: any) => (
        <p>{item.userData?.dob ? calculateAge(item.userData.dob) : "-"}</p>
      ),
    },
    {
      key: "datetime",
      header: "Date & Time",
      width: "2fr",
      render: (item: any) => (
        <p className="text-gray-700">
          {slotDateFormat(item.slotDate)}, {item.slotTime}
        </p>
      ),
    },
    {
      key: "fees",
      header: "Fees",
      width: "1fr",
      render: (item: any) => (
        <p className="font-medium">
          {currencySymbol}
          {item.amount}
        </p>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "2fr",
      render: (item: any) => (
        <div className="flex flex-wrap gap-2 items-center justify-start">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAppointment(item);
              setShowModal(true);
            }}
            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md text-xs sm:text-sm font-medium hover:bg-indigo-200 transition"
          >
            Info
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPatientForHistory({
                userId: item.userData?._id || item.userId,
                patientName: item.userData?.name || "Unknown",
                patientEmail: item.userData?.email || "",
              });
              setShowPatientHistory(true);
            }}
            className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-xs sm:text-sm font-medium hover:bg-green-200 transition flex items-center gap-1"
            title="View Patient History"
          >
            <FaHistory className="text-xs" /> History
          </button>

          {item.cancelled ? (
            <p className="text-red-500 text-sm">Cancelled</p>
          ) : item.isConfirmed ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/call/${item.conversationId || item.appointmentId}`);
              }}
              className="bg-primary px-4 py-1.5 text-xs sm:text-sm rounded-lg font-medium text-white shadow hover:bg-primary/90 transition"
            >
              Consultation
            </button>
          ) : (
            <>
              {item.isCompleted && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const { data } = await getPrescriptionByAppointmentAPI(item._id);
                    setRx(data.prescription || null);
                    setRxOpen(true);
                  }}
                  className="bg-white border px-3 py-1 text-xs sm:text-sm rounded-md font-medium text-gray-700 shadow hover:bg-gray-50 transition"
                >
                  View Prescription
                </button>
              )}
              {!item.cancelled && !item.isConfirmed && !item.isCompleted && (
                <>
                  <img
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelAppointment(item._id);
                    }}
                    className="w-7 cursor-pointer hover:opacity-80 transition"
                    src={assets.cancel_icon}
                    alt="Cancel"
                  />
                  <img
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmAppointment(item._id);
                    }}
                    className="w-7 cursor-pointer hover:opacity-80 transition"
                    src={assets.tick_icon}
                    alt="Confirm"
                  />
                </>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  const sortOptions = [
    { label: "Newest First", order: "desc", icon: <FaSortDown className="h-4 w-4 text-indigo-500" /> },
    { label: "Oldest First", order: "asc", icon: <FaSortUp className="h-4 w-4 text-indigo-500" /> },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6">
      <motion.h1
        className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        All Appointments
      </motion.h1>

      {/* Search + Sort */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="max-w-sm w-full">
          <SearchBar
            placeholder="Search by patient name"
            onSearch={(query) => {
              if (searchTimeout.current) clearTimeout(searchTimeout.current);
              searchTimeout.current = setTimeout(() => {
                setSearchQuery(query);
                setCurrentPage(1);
              }, 400);
            }}
          />
        </div>
        <div className="relative">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white shadow hover:bg-indigo-50 transition font-medium text-gray-700"
            onClick={() => setSortDropdownOpen((o) => !o)}
          >
            <FaSort className="text-indigo-500" />
            Sort by Date
            <FaChevronDown className={`transition-transform ${sortDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {sortDropdownOpen && (
            <div className="absolute right-0 z-20 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
              {sortOptions.map((opt, i) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    setSortOrder(opt.order as "asc" | "desc");
                    setSortDropdownOpen(false);
                  }}
                  className={`flex items-center w-full gap-2 px-4 py-3 text-sm transition ${
                    sortOrder === opt.order
                      ? "bg-indigo-100 text-indigo-700"
                      : "hover:bg-indigo-50 text-gray-700"
                  }`}
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

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <DataTable
            data={appointments}
            columns={columns}
            emptyMessage="No matching appointments found."
            gridCols="grid-cols-[0.5fr_2fr_1fr_1fr_2fr_1fr_2fr]"
            containerClassName="rounded-lg border border-gray-200 shadow-sm bg-white overflow-x-auto"
          />

          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </>
      )}

      {/* Responsive Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 relative">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <img
                src={selectedAppointment.userData?.image || "/default-avatar.png"}
                alt="Patient"
                className="w-20 h-20 rounded-full border-2 border-indigo-500 object-cover"
              />
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-indigo-700">
                  {selectedAppointment.userData?.name || "-"}
                </h2>
                <p className="text-gray-500">{selectedAppointment.userData?.email || "-"}</p>
                {selectedAppointment.userData?.phone && (
                  <p className="text-gray-500">📞 {selectedAppointment.userData.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard label="Date" value={slotDateFormat(selectedAppointment.slotDate)} />
              <InfoCard label="Slot" value={selectedAppointment.slotTime} />
              <InfoCard label="Fees" value={`₹${selectedAppointment.amount}`} />
              <InfoCard
                label="Payment"
                value={selectedAppointment.razorpayOrderId ? "Razorpay" : "Wallet"}
              />
              <InfoCard label="Status" value={selectedAppointment.status || "-"} />
            </div>

            {selectedAppointment.cancelled && (
              <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded-lg">
                <p className="font-semibold text-red-700">Cancelled</p>
                <p className="text-sm text-red-600 mt-1">
                  {selectedAppointment.cancellationReason || "No reason provided"}
                </p>
              </div>
            )}

            {selectedAppointment.notes && (
              <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold text-gray-800">Notes / Symptoms</p>
                <p className="text-gray-700 mt-1">{selectedAppointment.notes}</p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rx Modal */}
      {rxOpen && rx && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div id="prescription-doctor" className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Prescription</h3>
              <button onClick={() => setRxOpen(false)}>✕</button>
            </div>
            <div className="overflow-x-auto text-sm">
              <table className="w-full border-t">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="py-2 text-left">Medicine</th>
                    <th className="py-2 text-left">Dosage</th>
                    <th className="py-2 text-left">Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {rx.items.map((it: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{it.name}</td>
                      <td className="py-2">{it.dosage}</td>
                      <td className="py-2">{it.instructions || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rx.notes && <p className="mt-2 text-gray-700 text-sm">Notes: {rx.notes}</p>}
            <div className="mt-4 flex justify-end gap-2" id="prescription-buttons-doctor">
              <button
                onClick={async () => {
                  try {
                    const patientName = rx?.patient?.name || "Patient";
                    const date = new Date().toISOString().split('T')[0];
                    const filename = `Prescription_${patientName.replace(/\s+/g, '_')}_${date}.pdf`;
                    await downloadPrescriptionAsPDF('prescription-doctor', filename);
                    toast.success('Prescription downloaded successfully');
                  } catch (error) {
                    toast.error('Failed to download prescription');
                    console.error(error);
                  }
                }}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button onClick={() => window.print()} className="bg-primary text-white px-3 py-2 rounded-lg">
                Print
              </button>
              <button onClick={() => setRxOpen(false)} className="border px-3 py-2 rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient History Modal */}
      {showPatientHistory && selectedPatientForHistory && (
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
      )}
    </div>
  );
};

// Helper for clean info display
const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-indigo-50 p-3 rounded-lg text-sm">
    <p className="font-semibold text-gray-900">{label}</p>
    <p className="text-gray-700 mt-1">{value}</p>
  </div>
);

export default DoctorAppointments;
