import TableStatusManager from "../../components/admin_Components/TableStatusManager";

const AdminTableStatus = () => {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="heading-1">Table Status Management</h1>
                <p className="text-lg text-slate-600">
                    Manage table availability and status in real-time. Update table status from available, reserved, occupied, to maintenance mode.
                </p>
            </div>

            <div className="card-elevated p-6">
                <TableStatusManager />
            </div>
        </div>
    );
};

export default AdminTableStatus;
