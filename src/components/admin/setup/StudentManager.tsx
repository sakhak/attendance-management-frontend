import React, { useState, useEffect } from "react";
import Loading from "../../common/Loading";
import { request } from "../../utils/Request";

interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  student?: {
    student_code: string;
    user?: {
      name: string;
    };
  };
  classes?: {
    name: string;
  };
}

type UserOption = {
  id: string | number;
  name?: string;
  email?: string;
  role?: string;
  type?: string;
  user_type?: string;
  roles?: Array<string | { name?: string; key?: string; title?: string }>;
};

const StudentManager = () => {
  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Enrollment | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]); 
  const [classes, setClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    user_id: "",
    class_id: "",
    student_code: "",
    status: "active"
  });

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const res = await request("enrollments");
      // Handle nesting: res.list.data or res.data or res.list or res
      const rawList = res?.list?.data || res?.data || res?.list || res || [];
      setEnrollments(Array.isArray(rawList) ? rawList : []);
    } catch (e) {
      console.error("Failed to fetch enrollments", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const endpoints = [
        "users?role=student",
        "auth/users?role=student",
        "all-users?role=student",
        "users",
        "auth/users",
        "all-users",
      ];
      let usersList: UserOption[] = [];
      let success = false;

      for (const endpoint of endpoints) {
        if (success) break;
        try {
          const res = await request(endpoint);
          const rawList = res?.data || res?.list || res || [];
          const list = Array.isArray(rawList) ? rawList.filter(isStudentUser) : [];
          if (list.length > 0) {
            usersList = list;
            success = true;
          }
        } catch (e) {
          // Continue to next endpoint
        }
      }

      const classesRes = await request("classes");
      // Handle nesting: res.list.data or res.data or res.list or res
      const rawClasses = classesRes?.list?.data || classesRes?.data || classesRes?.list || classesRes || [];
      const classesList = Array.isArray(rawClasses) ? rawClasses : [];

      setUsers(usersList);
      setClasses(classesList);

      // Auto-select first user if creating new
      if (!editItem && usersList.length > 0) {
        setFormData(prev => ({ ...prev, user_id: String(usersList[0].id) }));
      }
    } catch (e) {
      console.error("Failed to fetch dependencies", e);
    }
  };

  useEffect(() => {
    fetchEnrollments();
    fetchData();
  }, []);

  const handleOpenModal = (item: Enrollment | null = null) => {
    if (item) {
      setEditItem(item);
      setFormData({
        user_id: "", // Enrollment usually links student_id, need to check backend logic
        class_id: String(item.class_id),
        student_code: item.student?.student_code || "",
        status: "active"
      });
    } else {
      setEditItem(null);
      // Auto-generate a suggested code: STU + Current Year + 4 random digits
      const year = new Date().getFullYear();
      const random = Math.floor(1000 + Math.random() * 9000);
      const autoCode = `STU-${year}-${random}`;
      
      setFormData({
        user_id: users.length > 0 ? String(users[0].id) : "",
        class_id: classes.length > 0 ? String(classes[0].id) : "",
        student_code: autoCode,
        status: "active"
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Submitting Enrollment Data:", formData);
    try {
      if (editItem) {
        await request(`enrollments/update/${editItem.id}`, "PUT", formData);
      } else {
        const response = await request("enrollments/create", "POST", formData);
        console.log("Enrollment success response:", response);
      }
      setShowModal(false);
      fetchEnrollments();
    } catch (err: any) {
      console.error("Failed to save enrollment", err);
      let errorMsg = "Error saving enrollment.";
      
      // If backend returns validation messages
      if (err?.errors) {
        errorMsg += "\n" + Object.entries(err.errors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
          .join("\n");
      } else if (err?.message) {
        errorMsg += " " + err.message;
      }
      
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to unenroll this student?")) return;
    setLoading(true);
    try {
      await request(`enrollments/${id}`, "DELETE");
      fetchEnrollments();
    } catch (e) {
      console.error("Failed to delete enrollment", e);
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
            <h1 className="text-2xl font-bold text-slate-900">Student Enrollments</h1>
            <p className="text-slate-500 text-sm">Assign students to academic classes.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex h-10 items-center gap-2 rounded-sm bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Enroll New Student
          </button>
        </div>

        <div className="overflow-hidden border border-slate-200 bg-white shadow-sm rounded-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0f172a] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4 text-left">Student Code</th>
                <th className="p-4 text-left">Student Name</th>
                <th className="p-4 text-left">Assigned Class</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600">
              {enrollments.length > 0 ? (
                enrollments.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-slate-400">{item.student?.student_code}</td>
                    <td className="p-4 font-bold text-slate-800">{item.student?.user?.name || "N/A"}</td>
                    <td className="p-4">{item.classes?.name || "N/A"}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleDelete(item.id)} className="text-rose-600 hover:underline font-bold text-xs">Unenroll</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 italic">No enrollments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-sm border border-slate-200 bg-white p-8 shadow-xl">
            <h2 className="text-lg font-bold text-slate-800 mb-6">{editItem ? "Update Enrollment" : "Enroll Student"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Select Student (User)</label>
                <select
                  required
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="">Choose a student...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || "Unnamed Student"} ({u.email || "No email"})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Select Class</label>
                <select
                  required
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="">Choose a class...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Student Code</label>
                <input
                  required
                  type="text"
                  value={formData.student_code}
                  onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
                  className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                  placeholder="e.g. STU-2026-001"
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
                  {editItem ? "Update" : "Enroll Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function isStudentUser(user: UserOption) {
  const roles = extractRoles(user);
  const hasStudentRole = roles.includes("student");
  const hasNonStudentRole = roles.some((role) =>
    ["admin", "teacher", "staff", "instructor"].includes(role),
  );

  return hasStudentRole && !hasNonStudentRole;
}

function extractRoles(user: UserOption) {
  const rawRoles = [
    user.role,
    user.type,
    user.user_type,
    ...(Array.isArray(user.roles) ? user.roles : []),
  ];

  return rawRoles
    .map((role) => {
      if (typeof role === "string") return role;
      return role?.name || role?.key || role?.title || "";
    })
    .filter(Boolean)
    .map((role) => String(role).toLowerCase());
}

export default StudentManager;
