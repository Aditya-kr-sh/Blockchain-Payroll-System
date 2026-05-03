import React from 'react';

const DashboardCard = ({ title, value, icon: Icon, gradientClass }) => (
  <div className="glass-card p-5 flex items-center gap-4 group hover:scale-[1.02] transition-transform duration-200">
    <div className={`${gradientClass} p-3.5 rounded-xl shadow-lg flex-shrink-0`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-black text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
    </div>
  </div>
);

export default DashboardCard;
