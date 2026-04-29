import React, { useState, useEffect } from "react";
import Loading from "../../common/Loading";
import { request } from "../../utils/Request";

interface Teacher {
  id: string;
  user_id: string;
  teacher_code: string;
  user?: {
    name: string;
    email: string;
  };
}

const TeacherManager = () => {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [emailFilter, setEmailFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Teacher | null>(null);
  const [users, setUsers] = useState<any[]>([]); // To select from existing users
  const [formData, setFormData] = useState({
    user_id: "",
    teacher_code: "",
    status: "active"
  });

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await request("teachers");
      const rawList = res.data || res.list || res || [];
      setTeachers(Array.isArray(rawList) ? rawList : []);
    } catch (e) {
      console.error("Failed to fetch teachers", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const endpoints = ["users", "auth/users", "all-users"];
    let success = false;

    for (const endpoint of endpoints) {
      if (success) break;
      try {
        console.log(`Attempting to fetch users from: ${endpoint}`);
        const res = await request(endpoint);
        console.log(`Success fetching from ${endpoint}:`, res);

        const rawList = res.data || res.list || res || [];
        const list = Array.isArray(rawList) ? rawList : [];

        setUsers(list);
        if (list.length > 0) {
          if (!editItem && !formData.user_id) {
            setFormData(prev => ({ ...prev, user_id: String(list[0].id) }));
          }
          success = true;
        }
      } catch (e: any) {
        console.warn(`Endpoint '${endpoint}' failed:`, e.message || e);
      }
    }

    if (!success) {
      console.error("Could not find a valid users endpoint. Please check your Laravel api.php routes.");
    }
  };
  useEffect(() => {
    fetchTeachers();
    fetchUsers();
  }, []);

  const handleOpenModal = (item: Teacher | null = null) => {
    if (item) {
      setEditItem(item);
      setFormData({
        user_id: String(item.user_id),
        teacher_code: item.teacher_code || "",
        status: "active"
      });
    } else {
      setEditItem(null);
      // Auto-generate a suggested code: TEA + Current Year + 4 random digits
      const year = new Date().getFullYear();
      const random = Math.floor(1000 + Math.random() * 9000);
      const autoCode = `TEA-${year}-${random}`;

      setFormData({
        user_id: users.length > 0 ? String(users[0].id) : "",
        teacher_code: autoCode,
        status: "active"
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editItem) {
        await request(`teachers/update/${editItem.id}`, "PUT", formData);
      } else {
        await request("teachers/create", "POST", formData);
      }
      setShowModal(false);
      fetchTeachers();
    } catch (e) {
      console.error("Failed to save teacher", e);
      alert("Error saving teacher. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers
    .filter((item) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.teacher_code?.toLowerCase().includes(query) ||
        item.user?.name?.toLowerCase().includes(query) ||
        item.user?.email?.toLowerCase().includes(query);

      const hasEmail = Boolean(item.user?.email?.trim());
      const matchesEmailFilter =
        emailFilter === "all" ||
        (emailFilter === "with-email" && hasEmail) ||
        (emailFilter === "no-email" && !hasEmail);

      return matchesSearch && matchesEmailFilter;
    })
    .sort((a, b) => {
      if (sortBy === "name-asc") return (a.user?.name || "").localeCompare(b.user?.name || "");
      if (sortBy === "name-desc") return (b.user?.name || "").localeCompare(a.user?.name || "");
      if (sortBy === "code-asc") return (a.teacher_code || "").localeCompare(b.teacher_code || "");
      return Number(a.id) - Number(b.id);
    });

  return (
    <div className="p-6">
      {loading && <Loading />}
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Teacher Management</h1>
            <p className="text-slate-500 text-sm">Register and manage teaching staff.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex h-10 items-center gap-2 rounded-sm bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New Teacher
          </button>
        </div>

        <div className="grid gap-4 rounded-sm border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teacher, code, or email"
            className="h-10 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          />
          <select
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="h-10 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="all">All teachers</option>
            <option value="with-email">With email</option>
            <option value="no-email">Without email</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="name-asc">Sort: Name A-Z</option>
            <option value="name-desc">Sort: Name Z-A</option>
            <option value="code-asc">Sort: Code</option>
            <option value="id-asc">Sort: Oldest first</option>
          </select>
        </div>

        <div className="overflow-hidden border border-slate-200 bg-white shadow-sm rounded-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0f172a] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4 text-left">Code</th>
                <th className="p-4 text-left">Full Name</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-slate-400">{item.teacher_code}</td>
                    <td className="p-4 font-bold text-slate-800">{item.user?.name || "N/A"}</td>
                    <td className="p-4">{item.user?.email || "N/A"}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:underline font-bold text-xs">Edit</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 italic">No teachers match the current search and filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-sm border border-slate-200 bg-white p-8 shadow-xl">
            <h2 className="text-lg font-bold text-slate-800 mb-6">{editItem ? "Edit Teacher" : "Register Teacher"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Select User</label>
                <select
                  required
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="">Choose a user...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Teacher Code</label>
                <input
                  required
                  type="text"
                  value={formData.teacher_code}
                  onChange={(e) => setFormData({ ...formData, teacher_code: e.target.value })}
                  className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                  placeholder="e.g. TEACH-101"
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
                  {editItem ? "Update Teacher" : "Register Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManager;
