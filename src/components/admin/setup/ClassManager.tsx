import React, { useState, useEffect } from "react";
import Loading from "../../common/Loading";
import { request } from "../../utils/Request";

interface ClassItem {
  id: string;
  name: string;
  room_number: string;
  grade_level_id: string;
}

const ClassManager = () => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ClassItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    room_number: "",
    grade_level_id: "1"
  });

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await request("classes");
      const rawList = res.list?.data || res.list || res.data || res || [];
      setClasses(Array.isArray(rawList) ? rawList : []);
    } catch (e) {
      console.error("Failed to fetch classes", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleOpenModal = (item: ClassItem | null = null) => {
    if (item) {
      setEditItem(item);
      setFormData({
        name: item.name,
        room_number: item.room_number || "",
        grade_level_id: String(item.grade_level_id || "1")
      });
    } else {
      setEditItem(null);
      setFormData({
        name: "",
        room_number: "",
        grade_level_id: "1"
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editItem) {
        await request(`classes/update/${editItem.id}`, "PUT", formData);
      } else {
        await request("classes/create", "POST", formData);
      }
      setShowModal(false);
      fetchClasses();
    } catch (e) {
      console.error("Failed to save class", e);
      alert("Error saving class. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    setLoading(true);
    try {
      await request(`classes/${id}`, "DELETE");
      fetchClasses();
    } catch (e) {
      console.error("Failed to delete class", e);
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
            <h1 className="text-2xl font-bold text-slate-900">Class Management</h1>
            <p className="text-slate-500 text-sm">Create and organize academic classes.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex h-10 items-center gap-2 rounded-sm bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New Class
          </button>
        </div>

        <div className="overflow-hidden border border-slate-200 bg-white shadow-sm rounded-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0f172a] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4 text-left">ID</th>
                <th className="p-4 text-left">Class Name</th>
                <th className="p-4 text-left">Room</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600">
              {classes.length > 0 ? (
                classes.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4">{item.id}</td>
                    <td className="p-4 font-bold text-slate-800">{item.name}</td>
                    <td className="p-4">{item.room_number || "N/A"}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:underline font-bold text-xs">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="text-rose-600 hover:underline font-bold text-xs">Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 italic">No classes found. Add one to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-sm border border-slate-200 bg-white p-8 shadow-xl">
            <h2 className="text-lg font-bold text-slate-800 mb-6">{editItem ? "Edit Class" : "Add New Class"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Class Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                  placeholder="e.g. Grade 10-A"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Room Number</label>
                <input
                  type="text"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                  placeholder="e.g. R-101"
                />
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
                  {editItem ? "Update Class" : "Save Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManager;
