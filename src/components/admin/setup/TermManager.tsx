import React, { useState, useEffect } from "react";
import Loading from "../../common/Loading";
import { request } from "../../utils/Request";

interface Term {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  academic_year_id: string;
}

const TermManager = () => {
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState<Term[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editTerm, setEditTerm] = useState<Term | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    academic_year_id: "3" // Defaulting to 2026 based on previous context
  });

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const res = await request("terms");
      // Handle the { list: [...] } wrapper seen earlier
      const rawList = res.list || res.data || res || [];
      setTerms(Array.isArray(rawList) ? rawList : []);
    } catch (e) {
      console.error("Failed to fetch terms", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleOpenModal = (term: Term | null = null) => {
    if (term) {
      setEditTerm(term);
      setFormData({
        name: term.name,
        start_date: term.start_date.split('T')[0],
        end_date: term.end_date.split('T')[0],
        academic_year_id: String(term.academic_year_id)
      });
    } else {
      setEditTerm(null);
      setFormData({
        name: "",
        start_date: "",
        end_date: "",
        academic_year_id: "3"
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editTerm) {
        await request(`terms/${editTerm.id}`, "PUT", formData);
      } else {
        await request("terms", "POST", formData);
      }
      setShowModal(false);
      fetchTerms();
    } catch (e) {
      console.error("Failed to save term", e);
      alert("Error saving term. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this term?")) return;
    setLoading(true);
    try {
      await request(`terms/${id}`, "DELETE");
      fetchTerms();
    } catch (e) {
      console.error("Failed to delete term", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {loading && <Loading />}
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Term Management</h1>
            <p className="text-slate-500 text-sm">Manage academic terms and their durations.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex h-10 items-center gap-2 rounded-sm bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New Term
          </button>
        </div>

        <div className="overflow-hidden border border-slate-200 bg-white shadow-sm rounded-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0f172a] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4 text-left">ID</th>
                <th className="p-4 text-left">Term Name</th>
                <th className="p-4 text-left">Start Date</th>
                <th className="p-4 text-left">End Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600">
              {terms.length > 0 ? (
                terms.map((term) => (
                  <tr key={term.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4">{term.id}</td>
                    <td className="p-4 font-bold text-slate-800">{term.name}</td>
                    <td className="p-4">{new Date(term.start_date).toLocaleDateString()}</td>
                    <td className="p-4">{new Date(term.end_date).toLocaleDateString()}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenModal(term)} className="text-blue-600 hover:underline font-bold text-xs">Edit</button>
                      <button onClick={() => handleDelete(term.id)} className="text-rose-600 hover:underline font-bold text-xs">Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 italic">No terms found. Add one to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-sm border border-slate-200 bg-white p-8 shadow-xl">
            <h2 className="text-lg font-bold text-slate-800 mb-6">{editTerm ? "Edit Term" : "Add New Term"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Term Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                  placeholder="e.g. Term 1 2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Start Date</label>
                  <input
                    required
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">End Date</label>
                  <input
                    required
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-sm bg-slate-900 px-6 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  {editTerm ? "Update Term" : "Save Term"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TermManager;
