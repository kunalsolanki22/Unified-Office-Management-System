const Analytics = () => {
    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900"><span className="text-blue-900">System</span> <span className="text-orange-500">Analytics</span></h1>
                <p className="text-slate-500 text-sm uppercase tracking-wider">Deep insights and data retention metrics</p>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 p-24 text-center bg-slate-50/50">
                <p className="text-slate-500 font-medium">Analytical data streams are currently synchronizing...</p>
            </div>
        </div>
    );
};
export default Analytics;
