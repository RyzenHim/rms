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
    isActive: Boolean(employeeDoc.isActive),
    isDeleted: Boolean(employeeDoc.isDeleted),
    deletedAt: employeeDoc.deletedAt || null,
});

const getActorRole = (req) => req.user?.roles?.[0] || "";
const isManagerActor = (req) => getActorRole(req) === "manager";

const ensureRoleAllowedForActor = (req, role) => {
    if (!allowedRoles.includes(role)) {
        return "Invalid employee role";
    }
    if (isManagerActor(req) && role === "admin") {
        return "Managers cannot create or manage admin employees";
    }
    return null;
};

const ensureTargetAllowedForActor = (req, employee) => {
    if (isManagerActor(req) && employee.roles === "admin") {
        return "Managers cannot manage admin employees";
    }
    return null;
};

const populateEmployees = (query = Employee.find()) =>
    query.populate("user", "name email isActive roles isDeleted").sort({ createdAt: -1 });

exports.getEmployees = async (req, res) => {
    try {
        const { status = "all", role = "all" } = req.query;
        const query = {};

        if (role !== "all" && allowedRoles.includes(role)) {
            query.roles = role;
        }

        if (status === "active") {
            query.isDeleted = { $ne: true };
            query.isActive = true;
        } else if (status === "inactive") {
            query.isDeleted = { $ne: true };
            query.isActive = false;
        } else if (status === "deleted") {
            query.isDeleted = true;
        }

        const employees = await populateEmployees(Employee.find(query));

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

        const roleError = ensureRoleAllowedForActor(req, role);
        if (roleError) {
            return res.status(400).json({ message: roleError });
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
            isDeleted: false,
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
            isDeleted: false,
            deletedAt: null,
        });

        const populated = await Employee.findById(employee._id).populate("user", "name email isActive roles isDeleted");
        return res.status(201).json({ message: "Employee created", employee: sanitize(populated) });
    } catch (error) {
        console.error("CREATE EMPLOYEE ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id).populate("user", "name email isActive roles isDeleted");
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const targetError = ensureTargetAllowedForActor(req, employee);
        if (targetError) {
            return res.status(403).json({ message: targetError });
        }
        if (employee.isDeleted) {
            return res.status(400).json({ message: "Restore the employee before editing the record" });
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

        if (role !== undefined) {
            const roleError = ensureRoleAllowedForActor(req, role);
            if (roleError) {
                return res.status(400).json({ message: roleError });
            }
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
            const nextActive = Boolean(isActive);
            employee.isActive = nextActive;
            employee.user.isActive = nextActive;
            if (nextActive) {
                employee.isDeleted = false;
                employee.deletedAt = null;
                employee.user.isDeleted = false;
            }
        }

        await employee.user.save();
        await employee.save();

        const updated = await Employee.findById(id).populate("user", "name email isActive roles isDeleted");
        return res.status(200).json({ message: "Employee updated", employee: sanitize(updated) });
    } catch (error) {
        console.error("UPDATE EMPLOYEE ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateEmployeeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const employee = await Employee.findById(id).populate("user", "name email isActive roles isDeleted");

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const targetError = ensureTargetAllowedForActor(req, employee);
        if (targetError) {
            return res.status(403).json({ message: targetError });
        }

        if (employee.isDeleted) {
            return res.status(400).json({ message: "Restore the employee before changing active status" });
        }

        const nextActive = Boolean(isActive);
        employee.isActive = nextActive;
        employee.user.isActive = nextActive;

        await employee.user.save();
        await employee.save();

        const updated = await Employee.findById(id).populate("user", "name email isActive roles isDeleted");
        return res.status(200).json({
            message: nextActive ? "Employee activated" : "Employee deactivated",
            employee: sanitize(updated),
        });
    } catch (error) {
        console.error("UPDATE EMPLOYEE STATUS ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.restoreEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id).populate("user", "name email isActive roles isDeleted");

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const targetError = ensureTargetAllowedForActor(req, employee);
        if (targetError) {
            return res.status(403).json({ message: targetError });
        }

        employee.isDeleted = false;
        employee.deletedAt = null;
        employee.isActive = true;
        employee.user.isDeleted = false;
        employee.user.isActive = true;

        await employee.user.save();
        await employee.save();

        const updated = await Employee.findById(id).populate("user", "name email isActive roles isDeleted");
        return res.status(200).json({ message: "Employee restored", employee: sanitize(updated) });
    } catch (error) {
        console.error("RESTORE EMPLOYEE ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id).populate("user", "name email isActive roles isDeleted");
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const targetError = ensureTargetAllowedForActor(req, employee);
        if (targetError) {
            return res.status(403).json({ message: targetError });
        }
        if (employee.isDeleted) {
            return res.status(400).json({ message: "Employee is already in deleted records" });
        }

        employee.isDeleted = true;
        employee.deletedAt = new Date();
        employee.isActive = false;
        employee.user.isDeleted = true;
        employee.user.isActive = false;

        await employee.user.save();
        await employee.save();

        return res.status(200).json({ message: "Employee moved to deleted records" });
    } catch (error) {
        console.error("DELETE EMPLOYEE ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
