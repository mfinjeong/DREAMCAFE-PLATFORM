import React from "react";

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className="w-full overflow-x-auto rounded-[4px] border border-[#22252A] bg-[#15171A]">
    <table className={`w-full text-left text-xs text-[#EDEDEE] ${className}`}>{children}</table>
  </div>
);

export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-[#111317] text-[10px] uppercase font-mono tracking-wider text-[#8A909A] border-b border-[#22252A]">
    {children}
  </thead>
);

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <tr className={`border-b border-[#1C1F24] hover:bg-[#1A1D22] transition-colors duration-75 ${className}`}>
    {children}
  </tr>
);

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <th className={`px-3 py-2 font-medium text-[#EDEDEE] ${className}`}>{children}</th>;

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <td className={`px-3 py-2 text-[#EDEDEE] ${className}`}>{children}</td>;
