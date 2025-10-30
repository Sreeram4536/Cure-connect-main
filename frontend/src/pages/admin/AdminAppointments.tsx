import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../../context/AdminContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/admin/assets";
import { motion } from "framer-motion";
import SearchBar from "../../components/common/SearchBar";
import Pagination from "../../components/common/Pagination";
import DataTable from "../../components/common/DataTable";
import { FaSort, FaSortUp, FaSortDown, FaChevronDown, FaCheck } from 'react-icons/fa';

const AdminAppointments = () => {
  const navigate = useNavigate();
  const context = useContext(AdminContext);
  const appContext = useContext(AppContext);

  if (!context || !appContext) {
    throw new Error("Contexts must be used within their providers");
  }

  const { aToken, getAppointmentsPaginated, cancelAppointment } = context;
  const { calculateAge, slotDateFormat, currencySymbol } = appContext;

  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  // const [totalCount, setTotalCount] = useState(0); // Not used
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 6;
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // default: newest first
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Ref to track if we're currently searching to prevent race conditions
  const isSearching = useRef(false);

  // Simple fetch function without useCallback
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const result = await getAppointmentsPaginated(currentPage, itemsPerPage, searchQuery, sortOrder);
      setAppointments(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Effect for page changes only
  useEffect(() => {
    if (aToken) {
      fetchAppointments();
    }
  }, [aToken, currentPage, sortOrder]);

  // Effect for search changes only
  useEffect(() => {
    if (aToken && searchQuery !== "") {
      setCurrentPage(1); // Reset to first page when searching
      fetchAppointments();
    }
  }, [aToken, searchQuery]);

  useEffect(() => {
    if (!aToken) {
      navigate("/admin/login");
    }
  }, [aToken, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await cancelAppointment(appointmentId);
      // Refresh current page after cancellation
      fetchAppointments();
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
    }
  };


  const handleSearch = (query: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(query);
    }, 300);
  };

  const columns = [
    {
      key: "index",
      header: "#",
      width: "0.5fr",
      hideOnMobile: true,
      render: (_: any, index: number) => (
        <p>{(currentPage - 1) * itemsPerPage + index + 1}</p>
      ),
    },
    {
      key: "patient",
      header: "Patient",
      width: "3fr",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <img
            className="w-10 h-10 rounded-full object-cover border"
            src={item.userData?.image || "/default-avatar.png"}
            alt="Patient"
          />
          <p className="font-medium text-gray-800 truncate">
            {item.userData?.name}
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
        <p>{calculateAge(item.userData?.dob)}</p>
      ),
    },
    {
      key: "datetime",
      header: "Date & Time",
      width: "3fr",
      render: (item: any) => (
        <p className="truncate text-sm">
          {slotDateFormat(item.slotDate)}, {item.slotTime}
        </p>
      ),
    },
    {
      key: "doctor",
      header: "Doctor",
      width: "3fr",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <img
            className="w-9 h-9 rounded-full object-cover border"
            src={item.docData?.image || "/default-avatar.png"}
            alt="Doctor"
          />
          <p className="text-gray-800 truncate">{item.docData?.name}</p>
        </div>
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
      header: "Actions",
      width: "1fr",
      render: (item: any) => (
        <>
          {item.cancelled ? (
            <p className="text-xs font-semibold text-red-400">Cancelled</p>
          ) : (
            <motion.img
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleCancelAppointment(item._id!);
              }}
              className="w-8 h-8 cursor-pointer hover:opacity-80 transition"
              src={assets.cancel_icon}
              alt="Cancel"
            />
          )}
        </>
      ),
    },
  ];

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-semibold">📅 All Appointments</p>

      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="max-w-sm w-full">
          <SearchBar
            placeholder="Search by patient or doctor name"
            onSearch={handleSearch}
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
              {[
                { label: "Newest First", order: "desc", icon: <FaSortDown className="h-4 w-4 text-indigo-500" /> },
                { label: "Oldest First", order: "asc", icon: <FaSortUp className="h-4 w-4 text-indigo-500" /> },
              ].map((opt, idx) => (
                <button
                  key={opt.label}
                  className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-indigo-50 text-left font-medium transition-colors ${
                    sortOrder === opt.order ? "bg-indigo-100 text-indigo-700" : "text-gray-700"
                  } ${idx === 0 ? "rounded-t-xl" : ""} ${idx === 1 ? "rounded-b-xl" : ""}`}
                  onClick={() => {
                    setSortOrder(opt.order as 'asc' | 'desc');
                    setSortDropdownOpen(false);
                    setCurrentPage(1);
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

      <DataTable
        data={appointments}
        columns={columns}
        loading={loading}
        emptyMessage="No matching appointments found."
        gridCols="grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr]"
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
};

export default AdminAppointments;