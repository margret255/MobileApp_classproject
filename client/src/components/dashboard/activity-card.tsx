import { ReactNode } from 'react';

type ActivityCardProps = {
  icon: ReactNode;
  label: string;
  value: number | string;
  bgColor: string;
  textColor: string;
};

export default function ActivityCard({ icon, label, value, bgColor, textColor }: ActivityCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${bgColor} ${textColor}`}>
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-gray-500 text-sm">{label}</h3>
          <p className="font-semibold text-2xl">{value}</p>
        </div>
      </div>
    </div>
  );
}
