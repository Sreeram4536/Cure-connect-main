import { useEffect, useState } from "react";
import { getApi } from "../../axios/axiosInstance";

type RxItem = { name: string; dosage: string; instructions?: string };
type Rx = { _id: string; appointmentId: string; userId: string; createdAt: string; items: RxItem[]; notes?: string };

const PatientHistory = () => {
  const api = getApi("doctor");
  const [userId, setUserId] = useState("");
  const [list, setList] = useState<Rx[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [rx, setRx] = useState<Rx | null>(null);

  const fetchHistory = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/doctor/patients/${userId}/history`);
      setList(data.prescriptions || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchHistory();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Patient History</h1>
        <div className="flex gap-2 mb-4">
          <input value={userId} onChange={(e)=>setUserId(e.target.value)} placeholder="Enter Patient User ID" className="border rounded-lg px-3 py-2 flex-1"/>
          <button onClick={fetchHistory} className="px-4 py-2 rounded-lg bg-primary text-white">Search</button>
        </div>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : list.length === 0 ? (
          <div className="text-gray-500">No records found</div>
        ) : (
          <div className="space-y-3">
            {list.map((p) => (
              <div key={p._id} className="bg-white rounded-xl shadow p-4 border">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Appointment: {p.appointmentId}</div>
                  <div className="text-sm text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
                </div>
                <div className="mt-2">
                  <button onClick={()=>{setRx(p); setOpen(true);}} className="px-3 py-2 rounded-lg bg-white border">View Prescription</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && rx && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold">Prescription</h3>
              <button onClick={()=>setOpen(false)} className="text-gray-500">✕</button>
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
              <button onClick={()=>setOpen(false)} className="px-3 py-2 rounded-lg border">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientHistory;


