import { useContext, useEffect, useState, useRef } from "react";
import { AdminContext } from "../../context/AdminContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SearchBar from "../../components/common/SearchBar";
import Pagination from "../../components/common/Pagination";
import { Dialog, DialogTitle } from "@headlessui/react";

const AdminDoctorList = () => {
  const navigate = useNavigate();
  const context = useContext(AdminContext);

  if (!context) {
    throw new Error("AdminContext must be used within AdminContextProvider");
  }

  const { aToken, getDoctorsPaginated, changeAvailability, toggleBlockDoctor } = context;

  const [currentPage, setCurrentPage] = useState(1);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  // const [totalCount, setTotalCount] = useState(0); 
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 2;
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDoctor, setTargetDoctor] = useState<any>(null);
  const [targetAction, setTargetAction] = useState<"block" | "unblock" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  
  const isSearching = useRef(false);


  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const result = await getDoctorsPaginated(currentPage, itemsPerPage, searchQuery);
      setDoctors(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (aToken) {
      fetchDoctors();
    }
  }, [aToken, currentPage]);

 
  useEffect(() => {
    if (aToken && searchQuery !== "") {
      setCurrentPage(1); 
      fetchDoctors();
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

  const handleChangeAvailability = async (docId: string) => {
    try {
      await changeAvailability(docId);
      
      fetchDoctors();
    } catch (error) {
      console.error("Failed to change availability:", error);
    }
  };

  const handleToggleBlock = (doctorId: string, isBlocked: boolean) => {
    
    setTargetDoctor(doctors.find((d) => d._id === doctorId));
    setTargetAction(isBlocked ? "unblock" : "block");
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!targetDoctor || !targetAction) return;
    setActionLoading(true);
    try {
      await toggleBlockDoctor(targetDoctor._id, targetAction === "block");
       setDoctors((prevDoctors) =>
        prevDoctors.map((doc) =>
          doc._id === targetDoctor._id
            ? { ...doc, isBlocked: targetAction === "block" }
            : doc
        )
      );
      setConfirmOpen(false);
      setTargetDoctor(null);
      setTargetAction(null);
      // fetchDoctors();
    } catch (error) {
      // error handled in context
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAction = () => {
    setConfirmOpen(false);
    setTargetDoctor(null);
    setTargetAction(null);
  };


  // Only filter by status client-side (search is server-side)
  const filteredDoctors = doctors.filter((doctor) => doctor.status === "approved");

  // Debounce search
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleSearch = (query: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(query);
    }, 300);
  };

  return (
    <div className="m-5 max-h-[90vh] overflow-y-scroll">
      <h1 className="text-lg font-medium mb-3">👨‍⚕️ All Doctors</h1>

      {/* Left-aligned Search Bar */}
      <div className="mb-5 max-w-sm">
        <SearchBar
          placeholder="Search by name or speciality"
          onSearch={handleSearch}
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          Loading doctors...
        </div>
      ) : filteredDoctors.length > 0 ? (
        <>
          <div className="w-full flex flex-wrap gap-4 gap-y-6">
            {filteredDoctors.map((item, index) => (
              <motion.div
                className="border border-indigo-200 rounded-xl max-w-56 overflow-hidden cursor-pointer group transition-transform duration-300 hover:-translate-y-1"
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <img
                  className="bg-indigo-50 group-hover:bg-primary transition-all duration-500"
                  src={item.image}
                  alt=""
                />
                <div className="p-4">
                  <p className="text-neutral-800 text-lg font-medium">{item.name}</p>
                  <p className="text-zinc-600 text-sm">{item.speciality}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-semibold w-fit transition-colors duration-300 ${
                        item.isBlocked
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {item.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </div>
                  {/* <div className="mt-2 flex items-center gap-1 text-sm">
                    <input
                      onChange={() => handleChangeAvailability(item._id)}
                      type="checkbox"
                      checked={item.available}
                    />
                    <p>Available</p>
                  </div> */}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBlock(item._id, item.isBlocked);
                      }}
                      className={`px-3 py-1 text-xs rounded-lg font-medium text-white shadow-sm transition duration-200 ${
                        item.isBlocked
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      {item.isBlocked ? "Unblock" : "Block"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
          {/* Confirmation Modal */}
          <Dialog open={confirmOpen} onClose={handleCancelAction} className="fixed z-50 inset-0 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/30" />
            <div className="relative bg-white rounded-xl shadow-xl p-8 max-w-sm w-full mx-auto flex flex-col items-center">
              <DialogTitle className="text-lg font-semibold mb-2">
                {targetAction === "block" ? "Block Doctor" : "Unblock Doctor"}
              </DialogTitle>
              <Dialog.Description className="mb-4 text-gray-600 text-center">
                Are you sure you want to {targetAction} <span className="font-bold">{targetDoctor?.name}</span>?
              </Dialog.Description>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={handleCancelAction}
                  className="px-4 py-1.5 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`px-4 py-1.5 rounded-lg font-medium text-white ${
                    targetAction === "block"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : targetAction === "block" ? "Block" : "Unblock"}
                </button>
              </div>
            </div>
          </Dialog>
        </>
      ) : (
        <div className="text-center w-full text-gray-500 text-sm py-10">
          No matching doctors found.
        </div>
      )}
    </div>
  );
};

export default AdminDoctorList;

