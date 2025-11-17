import { useEffect, useState } from "react";
import { listUserPrescriptionsAPI } from "../../services/appointmentServices";
import { Download } from "lucide-react";
import { toast } from "react-toastify";
import { downloadPrescriptionAsPDF } from "../../utils/prescriptionDownload";

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
                  <button
                    onClick={async () => {
                      try {
                        const date = new Date(rx.createdAt).toISOString().split('T')[0];
                        const filename = `Prescription_${rx.appointmentId}_${date}.pdf`;
                        // Create a temporary element with the prescription content for PDF generation
                        const tempDiv = document.createElement('div');
                        tempDiv.id = 'temp-prescription-download';
                        tempDiv.className = 'bg-white p-6';
                        tempDiv.innerHTML = `
                          <div class="border-b-4 border-primary pb-4 mb-6 text-center">
                            <h1 class="text-3xl font-extrabold text-primary uppercase">CureConnect</h1>
                            <p class="text-gray-500 text-sm">Your Trusted Digital Health Partner</p>
                          </div>
                          <div class="mb-8">
                            <h2 class="text-lg font-semibold mb-4">Prescription</h2>
                            <p class="text-sm text-gray-600 mb-4">Appointment ID: ${rx.appointmentId}</p>
                            <p class="text-sm text-gray-600 mb-4">Date: ${new Date(rx.createdAt).toLocaleDateString()}</p>
                            <table class="w-full border border-gray-300 text-sm">
                              <thead class="bg-gray-100">
                                <tr>
                                  <th class="py-2 px-3 border text-left">Medicine</th>
                                  <th class="py-2 px-3 border text-left">Dosage</th>
                                  <th class="py-2 px-3 border text-left">Instructions</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${rx.items.map((it: any) => `
                                  <tr>
                                    <td class="py-2 px-3 border">${it.name}</td>
                                    <td class="py-2 px-3 border">${it.dosage}</td>
                                    <td class="py-2 px-3 border">${it.instructions || '-'}</td>
                                  </tr>
                                `).join('')}
                              </tbody>
                            </table>
                            ${rx.notes ? `<p class="mt-4 text-sm"><strong>Notes:</strong> ${rx.notes}</p>` : ''}
                          </div>
                        `;
                        document.body.appendChild(tempDiv);
                        await downloadPrescriptionAsPDF('temp-prescription-download', filename);
                        document.body.removeChild(tempDiv);
                        toast.success('Prescription downloaded successfully');
                      } catch (error) {
                        toast.error('Failed to download prescription');
                        console.error(error);
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
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


