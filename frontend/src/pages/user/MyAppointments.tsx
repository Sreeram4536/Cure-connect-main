import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { showErrorToast } from "../../utils/errorHandler";
import {
  cancelAppointmentAPI,
  getAppointmentsPaginatedAPI,
} from "../../services/appointmentServices";
import { toast } from "react-toastify";
import type { AppointmentTypes } from "../../types/appointment";
import {
  PaymentRazorpayAPI,
  VerifyRazorpayAPI,
} from "../../services/paymentServices";
import type {
  RazorpayOptions,
  RazorpayPaymentResponse,
} from "../../types/razorpay";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, User, CreditCard, X, CheckCircle, AlertCircle, Video, Filter, SortAsc, SortDesc, Download } from "lucide-react";
import Pagination from "../../components/common/Pagination";
import { getPrescriptionByAppointmentAPI } from "../../services/appointmentServices";
import { downloadPrescriptionAsPDF } from "../../utils/prescriptionDownload";

const MyAppointments = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("MyAppointments must be used within an AppContextProvider");
  }

  const { token, getDoctorsData, slotDateFormat } = context;

  const [appointments, setAppointments] = useState<AppointmentTypes[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter and sort states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const navigate = useNavigate();
  const itemsPerPage = 2;
  const [rxOpen, setRxOpen] = useState(false);
  const [rx, setRx] = useState<any | null>(null);

  if (!token) {
    toast.error("Please login to continue...");
    return;
  }

  const getUserAppointments = async () => {
    try {
      setLoading(true);
      console.log(`Fetching appointments with params:`, {
        currentPage,
        itemsPerPage,
        sortBy,
        sortOrder,
        statusFilter,
        dateFrom,
        dateTo
      });
      
      const { data } = await getAppointmentsPaginatedAPI(
        currentPage,
        itemsPerPage,
        statusFilter === 'all' ? undefined : statusFilter,
        dateFrom || undefined,
        dateTo || undefined,
        token,
        sortBy,
        sortOrder
      );

      console.log(`Received appointment data:`, data);

      if (data.success) {
        setAppointments(data.data);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
        console.log(`Set appointments:`, {
          appointmentsLength: data.data.length,
          totalPages: data.totalPages,
          totalCount: data.totalCount
        });
      } else {
        console.error(`API returned error:`, data);
      }
    } catch (error) {
      console.error(`Error fetching appointments:`, error);
      showErrorToast(error);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { data } = await cancelAppointmentAPI(appointmentId, token);

      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
        getDoctorsData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  const initPay = (
    order: { id: string; amount: number; currency: string; receipt?: string },
    appointmentId: string
  ) => {
    const options: RazorpayOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Appointment Payment",
      description: "Appointment Payment",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response: RazorpayPaymentResponse) => {
        console.log(response);

        try {
          const { data } = await VerifyRazorpayAPI(
            appointmentId,
            response,
            token
          );

          if (data.success) {
            console.log(appointmentId);
            toast.success(data.message);
            getUserAppointments();
            navigate("/my-appointments");
          }
        } catch (error) {
          showErrorToast(error);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  useEffect(() => {
    if (token) {
      getUserAppointments();
    }
  }, [token, currentPage, sortBy, sortOrder, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("date");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const getStatusBadge = (appointment: AppointmentTypes) => {
    if (appointment.cancelled) {
      return (
        <div className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
          <X className="w-4 h-4 mr-1" />
          Cancelled
        </div>
      );
    }
    if (appointment.payment) {
      return (
        <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4 mr-1" />
          Paid
        </div>
      );
    }
    return null;
  };

  // Helper: Check if current time is within the consultation window (5 min before to end of slot)
  const isConsultationTime = (appointment: AppointmentTypes) => {
    const slotDateTime = new Date(`${appointment.slotDate}T${appointment.slotTime}`);
    const now = new Date();
    // Show button from 5 minutes before slot time until 30 minutes after (or slot duration if available)
    const startWindow = new Date(slotDateTime.getTime() - 5 * 60 * 1000); // 5 min before
    const endWindow = new Date(slotDateTime.getTime() + 30 * 60 * 1000); // 30 min after
    return now >= startWindow && now <= endWindow;
  };

  console.log(`Rendering appointments:`, { 
    appointmentsLength: appointments.length, 
    appointments: appointments,
    loading,
    totalCount,
    totalPages
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Appointments</h1>
          <p className="text-gray-600">Manage and track your upcoming consultations</p>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <button
                  onClick={() => handleSort('slotDate')}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                    sortBy === 'slotDate' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Date
                  {sortBy === 'slotDate' && (
                    sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('slotTime')}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                    sortBy === 'slotTime' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Time
                  {sortBy === 'slotTime' && (
                    sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Showing {appointments.length} of {totalCount} appointments
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      handleFilterChange();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Appointments</option>
                    <option value="active">Active</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      handleFilterChange();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      handleFilterChange();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/30">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading appointments...</p>
            </div>
          </div>
        )}

        {/* Appointments List */}
        {!loading && (
          <div className="space-y-6">
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/30">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Appointments Found</h3>
                  <p className="text-gray-500">
                    {totalCount > 0 ? "No appointments match your current filters." : "You don't have any appointments scheduled yet."}
                  </p>
                </div>
              </div>
            ) : (
              appointments.map((item, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Doctor Image */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <img
                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-lg"
                            src={item.docData?.image || '/default.png'}
                            alt={item.docData?.name || 'Doctor'}
                          />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                      </div>

                      {/* Doctor Info */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-800">{item.docData?.name || 'Doctor'}</h3>
                              {getStatusBadge(item)}
                            </div>

                            <p className="text-primary font-semibold mb-3">{item.docData?.speciality || ''}</p>
                            
                              <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-500" />
                                  <span>{item.docData?.address?.line1 || 'No address'}</span>
                                </div>
                                {item.docData?.address?.line2 && (
                                  <div className="flex items-center gap-2 ml-6">
                                    <span>{item.docData.address.line2}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">{slotDateFormat(item.slotDate)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">{item.slotTime}</span>
                                </div>
                               
                                {item.payment && (
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">Fees: ₹{item.amount}</span>
                                  </div>
                                )}
                              </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-3 sm:items-end">
                            {!item.cancelled && item.payment && !item.isCompleted && (item.docId || item.docData?._id) && (
                              <button
                                onClick={() => {
                                  try { sessionStorage.setItem('activeAppointmentId', String((item as any)._id || (item as any).id)); } catch {}
                                  const doctorId = item.docId || item.docData?._id;
                                  navigate(`/consultation/${doctorId}`);
                                }}
                                className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                              >
                                <Video className="w-4 h-4" />
                                Start Consultation
                              </button>
                            )}

                            {!item.cancelled && !item.isCompleted &&(
                              <button
                                onClick={() => cancelAppointment((item._id || (item as any).id) as string)}
                                className="flex items-center gap-2 bg-white border-2 border-red-500 text-red-500 px-6 py-3 rounded-xl font-semibold hover:bg-red-500 hover:text-white transition-all duration-300"
                              >
                                <X className="w-4 h-4" />
                                Cancel Appointment
                              </button>
                            )}
                            {item.isCompleted && (
                              <button
                                onClick={async () => {
                                  try{
                                    const id = (item as any)._id || (item as any).appointmentId;
                                    const { data } = await getPrescriptionByAppointmentAPI(id);
                                    setRx(data.prescription || null);
                                    setRxOpen(true);
                                  } catch{}
                                }}
                                className="flex items-center gap-2 bg-white border-2 border-primary text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary hover:text-white transition-all duration-300"
                              >
                                View Prescription
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
     {rxOpen && rx && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:bg-transparent print:static">
    <div
      id="prescription"
      className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 font-sans text-gray-800 print:shadow-none print:border print:rounded-none print:w-[210mm] print:h-[297mm] print:p-10"
    >
      {/* CureConnect Header */}
      <div className="border-b-4 border-primary pb-4 mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-primary uppercase tracking-wide">
          CureConnect
        </h1>
        <p className="text-gray-500 text-sm">Your Trusted Digital Health Partner</p>
      </div>

      {/* Doctor and Patient Info */}
      <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8 text-sm">
        <div className="text-left">
          <h2 className="text-lg font-semibold text-gray-900">
            Dr. {rx?.doctor?.name || "Unknown Doctor"}
          </h2>
          <p className="text-gray-600">{rx?.doctor?.specialization || "General Physician"}</p>
          <p className="text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="text-right">
          <h2 className="text-lg font-semibold text-gray-900">
            {rx?.patient?.name || "Patient Name"}
          </h2>
          <p className="text-gray-600">
            Gender:{" "}
            {rx?.patient?.gender||undefined}
          </p>
          <p className="text-gray-600">
            DOB:{" "}
            {rx?.patient?.dob
              ? new Date(rx.patient.dob).toLocaleDateString()
              : "Not Provided"}
          </p>
        </div>
      </div>

      {/* Prescription Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border border-gray-300 text-sm rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="py-2 px-3 border-r text-left w-1/3">Medicine</th>
              <th className="py-2 px-3 border-r text-left w-1/4">Dosage</th>
              <th className="py-2 px-3 text-left w-2/5">Instructions</th>
            </tr>
          </thead>
          <tbody>
            {(rx.items || []).length > 0 ? (
              rx.items.map((it: any, idx: number) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-3 border-r">{it.name}</td>
                  <td className="py-2 px-3 border-r">{it.dosage}</td>
                  <td className="py-2 px-3">{it.instructions || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-4 text-gray-500 italic"
                >
                  No medicines prescribed.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Doctor’s Notes */}
      {rx.notes && (
        <div className="bg-gray-50 border-l-4 border-primary px-4 py-3 rounded text-gray-700 text-sm mb-8">
          <strong className="text-primary">Doctor’s Notes:</strong> {rx.notes}
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 flex justify-between items-center text-sm">
        <div className="text-gray-500">
          <p>© {new Date().getFullYear()} CureConnect Healthcare</p>
        </div>
        {/* <div className="text-right">
          <p className="font-semibold text-gray-800">______________________</p>
          <p className="text-gray-500 text-xs">Doctor’s Signature</p>
        </div> */}
      </div>

      {/* Buttons (Hidden in Print) */}
      <div className="mt-6 flex gap-3 justify-end print:hidden" id="prescription-buttons">
        <button
          onClick={async () => {
            try {
              const doctorName = rx?.doctor?.name || "Unknown";
              const date = new Date().toISOString().split('T')[0];
              const filename = `Prescription_${doctorName.replace(/\s+/g, '_')}_${date}.pdf`;
              await downloadPrescriptionAsPDF('prescription', filename);
              toast.success('Prescription downloaded successfully');
            } catch (error) {
              toast.error('Failed to download prescription');
              console.error(error);
            }
          }}
          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition"
        >
          🖨 Print
        </button>
        <button
          onClick={() => setRxOpen(false)}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
};

export default MyAppointments;
