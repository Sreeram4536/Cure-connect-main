import { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/admin/assets";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SearchBar from "../../components/common/SearchBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import { FaSort, FaSortUp, FaSortDown, FaChevronDown, FaCheck } from 'react-icons/fa';

const DoctorAppointments = () => {
  const context = useContext(DoctorContext);
  const appContext = useContext(AppContext);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 6;
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // default: newest first
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

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
  }, [dToken, currentPage, sortOrder]);

  useEffect(() => {
    if (!dToken) {
      navigate("/doctor/login");
    }
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const result = await getAppointmentsPaginated(currentPage, itemsPerPage, 'slotDate', sortOrder);
      setAppointments(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      await confirmAppointment(appointmentId);
      // Refresh current page after confirmation
      fetchAppointments();
    } catch (error) {
      console.error("Failed to confirm appointment:", error);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await cancelAppointment(appointmentId);
      // Refresh current page after cancellation
      fetchAppointments();
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
    }
  };

  const filteredAppointments = appointments.filter((item) =>
    item.userData.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: "index",
      header: "#",
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
        <>
          {item.cancelled ? (
            <p className="text-red-500">Cancelled</p>
          ) : item.isConfirmed ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/doctor/consultation");
              }}
              className="bg-primary px-4 py-1.5 text-sm rounded-lg font-medium text-white shadow transition duration-200"
            >
              Consultation
            </button>
          ) : (
            <div className="flex gap-2">
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
            </div>
          )}
        </>
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
            onSearch={(query) => setSearchQuery(query)}
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
      ) : filteredAppointments.length > 0 ? (
        <>
          <DataTable
            data={filteredAppointments}
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
        </>
      ) : (
        <div className="text-gray-500 mt-6 text-center w-full">
          No appointments found.
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
