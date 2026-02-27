const User = require('../models/user.model')

exports.signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body

        if (!email || !password || !role || !name) {
            return res
                .status(400)
                .json({ message: "Email, password , name and role are required" });
        }


        const isExisting = await User.findOne({ email })
        if (isExisting) {
            return res.status(400).json({ message: "User already exist!" })
        }

        const createdUser = await User.create({
            name, email, password, roles: role
        })
        return res.status(201).json({
            message: "User created successfully",
            user: {
                _id: createdUser._id,
                name: createdUser.name,
                email: createdUser.email,
                roles: createdUser.roles,
                theme: createdUser.theme,
                isActive: createdUser.isActive,
            },
        });
    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }


}