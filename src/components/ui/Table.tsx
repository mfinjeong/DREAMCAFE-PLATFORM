import React from "react";

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className="w-full overflow-x-auto rounded-[3px] border border-[#20232e] bg-[#111319]">
    <table className={`w-full text-left text-xs text-zinc-300 ${className}`}>{children}</table>
  </div>
);

export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-[#0e0f14] text-[10px] uppercase font-mono tracking-wider text-zinc-400 border-b border-[#20232e]">
    {children}
  </thead>
);

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <tr className={`border-b border-[#181a22] hover:bg-[#161822] transition-colors duration-75 ${className}`}>
    {children}
  </tr>
);

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <th className={`px-3 py-2 font-medium text-zinc-300 ${className}`}>{children}</th>;

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <td className={`px-3 py-2 text-zinc-300 ${className}`}>{children}</td>;
