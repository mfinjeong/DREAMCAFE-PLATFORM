import React from "react";

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className="w-full overflow-x-auto rounded border border-[#1d212c]">
    <table className={`w-full text-left text-xs text-zinc-300 ${className}`}>{children}</table>
  </div>
);

export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-[#0c0d12] text-[10px] uppercase font-mono tracking-wider text-zinc-400 border-b border-[#1d212c]">
    {children}
  </thead>
);

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <tr className={`border-b border-[#191c26] hover:bg-[#13151f] transition-colors ${className}`}>
    {children}
  </tr>
);

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <th className={`px-3 py-2 font-semibold text-zinc-300 ${className}`}>{children}</th>;

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <td className={`px-3 py-2 text-zinc-300 ${className}`}>{children}</td>;
