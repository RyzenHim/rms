const User = require("../models/user.model");
const Employee = require("../models/employee.model");

const allowedRoles = ["admin", "manager", "kitchen", "cashier", "waiter"];

const sanitize = (employeeDoc) => ({
    id: employeeDoc._id,
    userId: employeeDoc.user?._id || employeeDoc.user,
    name: employeeDoc.user?.name || "",
    email: employeeDoc.user?.email || "",
    role: employeeDoc.roles,
    employeeCode: employeeDoc.employeeCode || "",
    department: employeeDoc.department || "",
    phone: employeeDoc.phone || "",
    emergencyContactName: employeeDoc.emergencyContactName || "",
    emergencyContactPhone: employeeDoc.emergencyContactPhone || "",
    address: employeeDoc.address || "",
    experienceYears: employeeDoc.experienceYears ?? 0,
    gender: employeeDoc.gender || "",
    bloodGroup: employeeDoc.bloodGroup || "",
    dateOfBirth: employeeDoc.dateOfBirth || null,
    idProofType: employeeDoc.idProofType || "",
    idProofNumber: employeeDoc.idProofNumber || "",
    salary: employeeDoc.salary ?? null,
    shift: employeeDoc.shift || "",
    joiningDate: employeeDoc.joiningDate,
    isActive: employeeDoc.isActive,
});

exports.getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find()
            .populate("user", "name email isActive roles")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            employees: employees.map(sanitize),
        });
    } catch (error) {
        console.error("GET EMPLOYEES ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.createEmployee = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            salary,
            shift,
            joiningDate,
            employeeCode,
            department,
            phone,
            emergencyContactName,
            emergencyContactPhone,
            address,
            experienceYears,
            gender,
            bloodGroup,
            dateOfBirth,
            idProofType,
            idProofNumber,
            isActive = true,
        } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Name, email, password and role are required" });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid employee role" });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const user = await User.create({
            name: String(name).trim(),
            email: normalizedEmail,
            password,
            roles: [role],
            isActive: Boolean(isActive),
        });

        const employee = await Employee.create({
            user: user._id,
            roles: role,
            employeeCode: String(employeeCode || "").trim(),
            department: String(department || "").trim(),
            phone: String(phone || "").trim(),
            emergencyContactName: String(emergencyContactName || "").trim(),
            emergencyContactPhone: String(emergencyContactPhone || "").trim(),
            address: String(address || "").trim(),
            experienceYears:
                experienceYears !== "" && experienceYears !== undefined
                    ? Number(experienceYears)
                    : 0,
            gender: gender || "",
            bloodGroup: String(bloodGroup || "").trim(),
            dateOfBirth: dateOfBirth || null,
            idProofType: String(idProofType || "").trim(),
            idProofNumber: String(idProofNumber || "").trim(),
            salary: salary !== "" ? Number(salary) : undefined,
            shift: shift || undefined,
            joiningDate: joiningDate || undefined,
            isActive: Boolean(isActive),
        });

        const populated = await Employee.findById(employee._id).populate("user", "name email isActive roles");
        return res.status(201).json({ message: "Employee created", employee: sanitize(populated) });
    } catch (error) {
        console.error("CREATE EMPLOYEE ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id).populate("user", "name email isActive roles");
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const {
            name,
            email,
            role,
            salary,
            shift,
            joiningDate,
            employeeCode,
            department,
            phone,
            emergencyContactName,
            emergencyContactPhone,
            address,
            experienceYears,
            gender,
            bloodGroup,
            dateOfBirth,
            idProofType,
            idProofNumber,
            isActive,
        } = req.body;
        if (role && !allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid employee role" });
        }

        if (name !== undefined) employee.user.name = String(name).trim();
        if (email !== undefined) {
            const normalizedEmail = String(email).toLowerCase().trim();
            const existingUser = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: employee.user._id },
            });
            if (existingUser) {
                return res.status(400).json({ message: "Email is already in use by another user" });
            }
            employee.user.email = normalizedEmail;
        }
        if (role !== undefined) {
            employee.roles = role;
            employee.user.roles = [role];
        }
        if (employeeCode !== undefined) employee.employeeCode = String(employeeCode || "").trim();
        if (department !== undefined) employee.department = String(department || "").trim();
        if (phone !== undefined) employee.phone = String(phone || "").trim();
        if (emergencyContactName !== undefined)
            employee.emergencyContactName = String(emergencyContactName || "").trim();
        if (emergencyContactPhone !== undefined)
            employee.emergencyContactPhone = String(emergencyContactPhone || "").trim();
        if (address !== undefined) employee.address = String(address || "").trim();
        if (experienceYears !== undefined)
            employee.experienceYears = experienceYears === "" ? 0 : Number(experienceYears);
        if (gender !== undefined) employee.gender = gender || "";
        if (bloodGroup !== undefined) employee.bloodGroup = String(bloodGroup || "").trim();
        if (dateOfBirth !== undefined) employee.dateOfBirth = dateOfBirth || null;
        if (idProofType !== undefined) employee.idProofType = String(idProofType || "").trim();
        if (idProofNumber !== undefined)
            employee.idProofNumber = String(idProofNumber || "").trim();
        if (salary !== undefined) employee.salary = salary === "" ? null : Number(salary);
        if (shift !== undefined) employee.shift = shift || undefined;
        if (joiningDate !== undefined) employee.joiningDate = joiningDate || employee.joiningDate;
        if (isActive !== undefined) {
            employee.isActive = Boolean(isActive);
            employee.user.isActive = Boolean(isActive);
        }

        await employee.user.save();
        await employee.save();

        const updated = await Employee.findById(id).populate("user", "name email isActive roles");
        return res.status(200).json({ message: "Employee updated", employee: sanitize(updated) });
    } catch (error) {
        console.error("UPDATE EMPLOYEE ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        await User.findByIdAndUpdate(employee.user, {
            isDeleted: true,
            isActive: false,
            email: `deleted_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@deleted.local`,
        });
        await employee.deleteOne();

        return res.status(200).json({ message: "Employee deleted" });
    } catch (error) {
        console.error("DELETE EMPLOYEE ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
