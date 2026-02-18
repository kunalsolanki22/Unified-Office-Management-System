import { cn } from '../../utils/cn';

const Table = ({ className, children, ...props }) => {
    return (
        <div className="relative w-full overflow-auto rounded-lg border border-slate-200">
            <table className={cn("w-full caption-bottom text-sm text-left", className)} {...props}>
                {children}
            </table>
        </div>
    );
};

const TableHeader = ({ className, ...props }) => (
    <thead className={cn("[&_tr]:border-b bg-slate-50", className)} {...props} />
);

const TableBody = ({ className, ...props }) => (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

const TableRow = ({ className, ...props }) => (
    <tr
        className={cn(
            "border-b transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-50",
            className
        )}
        {...props}
    />
);

const TableHead = ({ className, ...props }) => (
    <th
        className={cn(
            "h-12 px-4 text-left align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0",
            className
        )}
        {...props}
    />
);

const TableCell = ({ className, ...props }) => (
    <td
        className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
        {...props}
    />
);

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell };
