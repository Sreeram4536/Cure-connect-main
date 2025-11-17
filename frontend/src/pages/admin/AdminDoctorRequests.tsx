import { useContext, useEffect, useState, useRef } from "react";
import { AdminContext } from "../../context/AdminContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SearchBar from "../../components/common/SearchBar";
import Pagination from "../../components/common/Pagination";

const AdminDoctorRequests = () => {
  const navigate = useNavigate();
  const context = useContext(AdminContext);

  if (!context) throw new Error("AdminContext must be used within AdminContextProvider");

  const { aToken, getDoctorsPaginated, approveDoctor, rejectDoctor } = context;

  const [currentPage, setCurrentPage] = useState(1);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 6;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (doctor: any) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedDoctor(null);
    setIsModalOpen(false);
  };

  // Dynamic preview for PDFs / Docs / Images
  const renderFilePreview = (url: string) => {
    if (!url) return null;
    const ext = url.split(".").pop()?.toLowerCase() || "";

    if (["pdf", "doc", "docx"].includes(ext)) {
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      return (
        <iframe
          src={viewerUrl}
          title="Document Preview"
          className="w-full h-64 border rounded mt-2"
        />
      );
    }

    if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
      return (
        <img
          src={url}
          alt="Preview"
          className="mt-2 max-h-40 border rounded shadow-sm"
        />
      );
    }

    return null;
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const result = await getDoctorsPaginated(currentPage, itemsPerPage);
      setDoctors(result.data);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (aToken) fetchDoctors(); }, [aToken, currentPage]);
  useEffect(() => { if (!aToken) navigate("/admin/login"); }, [aToken, navigate]);

  const handleApproveDoctor = async (id: string) => { await approveDoctor(id); fetchDoctors(); };
  const handleRejectDoctor = async (id: string) => { await rejectDoctor(id); fetchDoctors(); };

  const pendingDoctors = doctors.filter(d => d.status === "pending")
    .filter(d => d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 d.speciality?.toLowerCase().includes(searchQuery.toLowerCase()));

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleSearch = (query: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setSearchQuery(query), 300);
  };

  return (
    <div className="m-5 max-h-[90vh] overflow-y-scroll">
      <h1 className="text-xl font-semibold mb-4">Doctor Requests</h1>

      <div className="mb-5 max-w-sm">
        <SearchBar placeholder="Search by name or speciality" onSearch={handleSearch} />
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500 text-sm">Loading doctor requests...</div>
      ) : pendingDoctors.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-4">
            {pendingDoctors.map((doc, idx) => (
              <motion.div
                key={idx}
                onClick={() => openModal(doc)}
                className="cursor-pointer border border-indigo-200 rounded-xl overflow-hidden hover:shadow-lg transition transform hover:-translate-y-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <img className="w-full h-36 object-cover bg-indigo-50" src={doc.image} alt="" />
                <div className="p-4">
                  <p className="text-lg font-medium text-neutral-800">{doc.name}</p>
                  <p className="text-sm text-zinc-600">{doc.speciality}</p>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApproveDoctor(doc._id); }}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-1.5 rounded-md"
                    >Approve</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRejectDoctor(doc._id); }}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-1.5 rounded-md"
                    >Reject</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
        </>
      ) : <div className="text-gray-500 mt-6 text-center">No doctor requests found.</div>}

      {/* Modal */}
      {isModalOpen && selectedDoctor && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 120 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 max-h-[85vh] overflow-y-auto relative"
          >
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-600 bg-gray-200 hover:bg-gray-300 w-8 h-8 flex items-center justify-center rounded-full">✕</button>

            <h2 className="text-2xl font-semibold text-indigo-700 text-center mb-5">Doctor Details</h2>

            <div className="flex justify-center mb-4">
              <img src={selectedDoctor.image} alt="Doctor" className="w-32 h-32 rounded-full border-4 border-indigo-200 shadow-md" />
            </div>

            <div className="space-y-2 text-gray-700 text-sm px-2">
              <p><strong className="text-indigo-700">Name:</strong> {selectedDoctor.name}</p>
              <p><strong className="text-indigo-700">Email:</strong> {selectedDoctor.email}</p>
              <p><strong className="text-indigo-700">Speciality:</strong> {selectedDoctor.speciality}</p>
              <p><strong className="text-indigo-700">Degree:</strong> {selectedDoctor.degree}</p>
              <p><strong className="text-indigo-700">Experience:</strong> {selectedDoctor.experience} years</p>
              <p><strong className="text-indigo-700">Fees:</strong> ₹{selectedDoctor.fees}</p>
              <div>
                <strong className="text-indigo-700">Address:</strong>
                <div className="mt-1 pl-2 border-l-2 border-indigo-300">
                  <p>{selectedDoctor.address?.line1}</p>
                  <p>{selectedDoctor.address?.line2}</p>
                </div>
              </div>

              {/* License Button & Preview */}
              <div className="mt-3">
                <strong className="text-indigo-700">License Document:</strong>
                <a
                  href={selectedDoctor.license}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md transition transform hover:scale-105"
                >
                  📄 View License Document
                </a>
                <div className="mt-2 border rounded-lg p-2 bg-gray-50 shadow-inner">
                  {renderFilePreview(selectedDoctor.license)}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <button onClick={() => handleApproveDoctor(selectedDoctor._id)} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md">Approve</button>
              <button onClick={() => handleRejectDoctor(selectedDoctor._id)} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md">Reject</button>
            </div>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
};

export default AdminDoctorRequests;
