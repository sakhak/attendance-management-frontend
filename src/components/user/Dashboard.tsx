import React from "react";

const Dashboard: React.FC = () => {
  const stats = [
    { label: "Total Students", value: "1,250", icon: "👥", color: "bg-blue-500" },
    { label: "Attendance Today", value: "95%", icon: "✅", color: "bg-green-500" },
    { label: "Late Arrivals", value: "12", icon: "⏰", color: "bg-yellow-500" },
    { label: "Absentees", value: "45", icon: "❌", color: "bg-red-500" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm">Welcome back to the Attendance Management System.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.color} text-white text-xl`}>
                {stat.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm font-medium text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-slate-400">Attendance Trends Chart (Placeholder)</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-slate-400">Recent Activities (Placeholder)</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
