import React, { useEffect, useState } from "react";
import Loading from "../common/Loading";
import { request } from "../utils/Request";

type SettingsTab = "school" | "class" | "attendance";

type SchoolForm = {
  schoolName: string;
  address: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  academicYear: string;
  termSemester: string;
};

type AttendanceRulesForm = {
  lateThreshold: string;
  absentThreshold: string;
  excludeWeekends: boolean;
  excludeHolidays: boolean;
};

type ClassRow = {
  id: number;
  name: string;
  teacherName: string;
  scheduleDays: string[];
  studentCount: number;
};

type SchoolApi = {
  school_name?: string;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  academic_year?: string;
  term_semester?: string;
};

type AttendanceRulesApi = {
  late_threshold_minutes?: number;
  absent_threshold_minutes?: number;
  exclude_weekends?: boolean;
  auto_exclude_public_holidays?: boolean;
};

type ClassApi = {
  id: number;
  name: string;
  teacher_name?: string;
  schedule_days?: string[];
  student_count?: number;
};

const defaultSchoolForm: SchoolForm = {
  schoolName: "",
  address: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  country: "",
  academicYear: "",
  termSemester: "",
};

const defaultAttendanceRules: AttendanceRulesForm = {
  lateThreshold: "15",
  absentThreshold: "45",
  excludeWeekends: true,
  excludeHolidays: true,
};

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("school");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState<SchoolForm>(defaultSchoolForm);
  const [attendanceRules, setAttendanceRules] = useState<AttendanceRulesForm>(defaultAttendanceRules);
  const [classes, setClasses] = useState<ClassRow[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [school, classList, rules] = await Promise.all([
        request("/settings/school"),
        request("/settings/classes"),
        request("/settings/attendance-rules"),
      ]);

      setFormData(mapSchoolResponse(school as SchoolApi));
      setClasses(((classList as ClassApi[]) || []).map(mapClassResponse));
      setAttendanceRules(mapAttendanceRulesResponse(rules as AttendanceRulesApi));
    } catch (error) {
      console.error("Failed to load settings:", error);
      setErrorMessage(getRequestErrorMessage(error, "Unable to load settings from the database."));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRuleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setAttendanceRules((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const updated = await request("/settings/school", "put", mapSchoolPayload(formData));
      setFormData(mapSchoolResponse(updated as SchoolApi));
      alert("School settings updated successfully!");
    } catch (error) {
      console.error("Failed to save school settings:", error);
      setErrorMessage(getRequestErrorMessage(error, "Unable to save school settings."));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendanceRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const updated = await request("/settings/attendance-rules", "put", mapAttendanceRulesPayload(attendanceRules));
      setAttendanceRules(mapAttendanceRulesResponse(updated as AttendanceRulesApi));
      alert("Attendance rules updated successfully!");
    } catch (error) {
      console.error("Failed to save attendance rules:", error);
      setErrorMessage(getRequestErrorMessage(error, "Unable to save attendance rules."));
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    const name = window.prompt("Class name");
    if (!name) return;

    const teacherName = window.prompt("Teacher name") || "";
    const scheduleDaysText = window.prompt("Schedule days, separated by commas", "Mon, Wed, Fri") || "";
    const scheduleDays = splitScheduleDays(scheduleDaysText);

    setLoading(true);
    setErrorMessage("");

    try {
      const created = await request("/settings/classes", "post", {
        name,
        teacher_name: teacherName,
        schedule_days: scheduleDays,
      });
      setClasses((prev) => [...prev, mapClassResponse(created as ClassApi)]);
    } catch (error) {
      console.error("Failed to add class:", error);
      setErrorMessage(getRequestErrorMessage(error, "Unable to add class."));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClass = async (classItem: ClassRow) => {
    const name = window.prompt("Class name", classItem.name);
    if (!name) return;

    const teacherName = window.prompt("Teacher name", classItem.teacherName) || "";
    const scheduleDaysText =
      window.prompt("Schedule days, separated by commas", classItem.scheduleDays.join(", ")) || "";
    const scheduleDays = splitScheduleDays(scheduleDaysText);

    setLoading(true);
    setErrorMessage("");

    try {
      const updated = await request(`/settings/classes/${classItem.id}`, "put", {
        name,
        teacher_name: teacherName,
        schedule_days: scheduleDays,
      });
      setClasses((prev) =>
        prev.map((item) => (item.id === classItem.id ? mapClassResponse(updated as ClassApi) : item)),
      );
    } catch (error) {
      console.error("Failed to update class:", error);
      setErrorMessage(getRequestErrorMessage(error, "Unable to update class."));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classItem: ClassRow) => {
    const confirmed = window.confirm(`Delete ${classItem.name}?`);
    if (!confirmed) return;

    setLoading(true);
    setErrorMessage("");

    try {
      await request(`/settings/classes/${classItem.id}`, "delete");
      setClasses((prev) => prev.filter((item) => item.id !== classItem.id));
    } catch (error) {
      console.error("Failed to delete class:", error);
      setErrorMessage(getRequestErrorMessage(error, "Unable to delete class."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      {loading && <Loading />}

      <div className="mx-auto max-w-7xl px-6 py-8">
        {errorMessage && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mb-8 flex gap-14 border-b border-slate-200">
          {[
            { id: "school", label: "School Information" },
            { id: "class", label: "Class Management" },
            { id: "attendance", label: "Attendance Rules" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`min-w-36 pb-5 text-left text-[14px] font-medium transition-all ${
                activeTab === tab.id
                  ? "border-b-2 border-indigo-500 text-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "school" && (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-8">
              <h2 className="text-[17px] font-bold text-slate-800">School Details</h2>
              <p className="mt-1 text-[13px] text-slate-400">
                Manage your institution's profile and academic year settings.
              </p>
            </div>

            <form onSubmit={handleSaveSchool}>
              <div className="space-y-8 p-8">
                <div className="space-y-6">
                  <TextField label="School Name" name="schoolName" value={formData.schoolName} onChange={handleChange} />
                  <TextField label="Address" name="address" value={formData.address} onChange={handleChange} />

                  <div className="grid gap-6 md:grid-cols-2">
                    <TextField label="City" name="city" value={formData.city} onChange={handleChange} />
                    <TextField label="State/Province" name="stateProvince" value={formData.stateProvince} onChange={handleChange} />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <TextField label="Postal Code" name="postalCode" value={formData.postalCode} onChange={handleChange} />
                    <TextField label="Country" name="country" value={formData.country} onChange={handleChange} />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8">
                  <h3 className="mb-6 text-[14px] font-bold text-slate-800">Academic Year Configuration</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <TextField label="Current Academic Year" name="academicYear" value={formData.academicYear} onChange={handleChange} />
                    <TextField label="Term / Semester" name="termSemester" value={formData.termSemester} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <PanelFooter>
                <SaveButton label="Save Changes" />
              </PanelFooter>
            </form>
          </div>
        )}

        {activeTab === "class" && (
          <section>
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Classes</h2>
                <p className="mt-2 text-sm text-slate-500">Manage classes, sections, and schedules.</p>
              </div>
              <button
                type="button"
                onClick={handleAddClass}
                className="inline-flex h-12 items-center gap-3 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <PlusIcon />
                Add Class
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              {classes.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-500">No classes found.</div>
              ) : (
                classes.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="grid min-h-24 grid-cols-[1fr_auto_auto_auto] items-center gap-8 border-b border-slate-200 px-5 last:border-b-0"
                  >
                    <div>
                      <div className="mb-4 text-sm font-medium text-indigo-600">{classItem.name}</div>
                      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-500">
                        <span>
                          <span className="text-slate-600">Teacher:</span> {classItem.teacherName || "Unassigned"}
                        </span>
                        <span>{classItem.scheduleDays.join(", ")}</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-medium text-slate-700">
                      {classItem.studentCount} Students
                    </span>
                    <IconButton label="Edit class" onClick={() => handleEditClass(classItem)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton label="Delete class" danger onClick={() => handleDeleteClass(classItem)}>
                      <TrashIcon />
                    </IconButton>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "attendance" && (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-8">
              <h2 className="text-lg font-semibold text-slate-900">Attendance Rules</h2>
              <p className="mt-3 text-sm text-slate-500">
                Configure how attendance is calculated and reported.
              </p>
            </div>

            <form onSubmit={handleSaveAttendanceRules}>
              <div className="space-y-8 p-8">
                <div>
                  <h3 className="mb-6 text-sm font-medium text-slate-900">Time Thresholds</h3>
                  <div className="grid gap-8 md:grid-cols-2">
                    <RuleField
                      label="Late Threshold (minutes)"
                      name="lateThreshold"
                      value={attendanceRules.lateThreshold}
                      helper="Students arriving after this time are marked Late."
                      onChange={handleRuleChange}
                    />
                    <RuleField
                      label="Absent Threshold (minutes)"
                      name="absentThreshold"
                      value={attendanceRules.absentThreshold}
                      helper="Students arriving after this time are marked Absent."
                      onChange={handleRuleChange}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8">
                  <h3 className="mb-6 text-sm font-medium text-slate-900">Calculation Settings</h3>
                  <div className="space-y-6">
                    <CheckboxField
                      name="excludeWeekends"
                      checked={attendanceRules.excludeWeekends}
                      label="Exclude Weekends"
                      helper="Do not count Saturday and Sunday in attendance calculations."
                      onChange={handleRuleChange}
                    />
                    <CheckboxField
                      name="excludeHolidays"
                      checked={attendanceRules.excludeHolidays}
                      label="Auto-exclude Public Holidays"
                      helper="Automatically skip dates marked as public holidays in the calendar."
                      onChange={handleRuleChange}
                    />
                  </div>
                </div>
              </div>

              <PanelFooter>
                <SaveButton label="Save Rules" />
              </PanelFooter>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

function mapSchoolResponse(data: SchoolApi): SchoolForm {
  return {
    schoolName: data.school_name || "",
    address: data.address || "",
    city: data.city || "",
    stateProvince: data.state_province || "",
    postalCode: data.postal_code || "",
    country: data.country || "",
    academicYear: data.academic_year || "",
    termSemester: data.term_semester || "",
  };
}

function mapSchoolPayload(data: SchoolForm): Record<string, unknown> {
  return {
    school_name: data.schoolName,
    address: data.address,
    city: data.city,
    state_province: data.stateProvince,
    postal_code: data.postalCode,
    country: data.country,
    academic_year: data.academicYear,
    term_semester: data.termSemester,
  };
}

function mapAttendanceRulesResponse(data: AttendanceRulesApi): AttendanceRulesForm {
  return {
    lateThreshold: String(data.late_threshold_minutes ?? 15),
    absentThreshold: String(data.absent_threshold_minutes ?? 45),
    excludeWeekends: Boolean(data.exclude_weekends),
    excludeHolidays: Boolean(data.auto_exclude_public_holidays),
  };
}

function mapAttendanceRulesPayload(data: AttendanceRulesForm): Record<string, unknown> {
  return {
    late_threshold_minutes: Number(data.lateThreshold),
    absent_threshold_minutes: Number(data.absentThreshold),
    exclude_weekends: data.excludeWeekends,
    auto_exclude_public_holidays: data.excludeHolidays,
  };
}

function mapClassResponse(data: ClassApi): ClassRow {
  return {
    id: data.id,
    name: data.name,
    teacherName: data.teacher_name || "",
    scheduleDays: data.schedule_days || [],
    studentCount: data.student_count || 0,
  };
}

function splitScheduleDays(value: string) {
  return value
    .split(",")
    .map((day) => day.trim())
    .filter(Boolean);
}

function getRequestErrorMessage(error: unknown, fallback: string) {
  const apiError = error as { message?: string };

  if (apiError?.message === "Unauthorized.") {
    return "Unauthorized. Please log in with an admin account before opening Settings.";
  }

  return apiError?.message || fallback;
}

function TextField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[13px] font-bold text-slate-600">{label}</span>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="h-11 w-full rounded-md border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

function RuleField({
  label,
  name,
  value,
  helper,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  helper: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        className="h-12 w-full rounded-lg border border-slate-300 px-4 text-base text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      <span className="mt-2 block text-sm text-slate-500">{helper}</span>
    </label>
  );
}

function CheckboxField({
  name,
  checked,
  label,
  helper,
  onChange,
}: {
  name: string;
  checked: boolean;
  label: string;
  helper: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex items-start gap-4">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 accent-blue-600"
      />
      <span>
        <span className="block text-sm font-medium text-slate-700">{label}</span>
        <span className="mt-2 block text-sm text-slate-500">{helper}</span>
      </span>
    </label>
  );
}

function PanelFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 p-6">{children}</div>;
}

function SaveButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="inline-flex h-12 items-center gap-3 rounded-lg bg-indigo-600 px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
    >
      <SaveIcon />
      {label}
    </button>
  );
}

function IconButton({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded text-slate-600 transition hover:bg-slate-100 ${
        danger ? "text-red-400 hover:bg-red-50 hover:text-red-500" : ""
      }`}
    >
      {children}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export default Settings;
