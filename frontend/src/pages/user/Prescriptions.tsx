import { useEffect, useState } from "react";
import { listUserPrescriptionsAPI } from "../../services/appointmentServices";

type RxItem = { name: string; dosage: string; instructions?: string };
type Rx = { _id: string; appointmentId: string; doctorId: string; createdAt: string; items: RxItem[]; notes?: string };

const Prescriptions = () => {
  const [list, setList] = useState<Rx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await listUserPrescriptionsAPI();
        setList(data.prescriptions || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-semibold mb-6">Your Prescriptions</h1>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : list.length === 0 ? (
          <div className="text-gray-500">No prescriptions found.</div>
        ) : (
          <div className="space-y-4">
            {list.map((rx) => (
              <div key={rx._id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Appointment: {rx.appointmentId}</div>
                  <div className="text-sm text-gray-500">{new Date(rx.createdAt).toLocaleString()}</div>
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
                      {rx.items.map((it, i) => (
                        <tr key={i} className="border-t">
                          <td className="py-2">{it.name}</td>
                          <td className="py-2">{it.dosage}</td>
                          <td className="py-2">{it.instructions || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rx.notes && <div className="mt-3 text-sm text-gray-700">Notes: {rx.notes}</div>}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => window.print()} className="px-3 py-2 rounded-lg bg-primary text-white">Print</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Prescriptions;


