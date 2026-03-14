import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
    FiChevronLeft,
    FiChevronRight,
    FiLogOut,
    FiMoon,
    FiSun,
    FiX,
    FiMenu,
    FiHome,
    FiClipboard,
    FiSettings,
    FiEye,
    FiTrendingUp,
    FiCoffee,
    FiPlus,
    FiGrid,
    FiCalendar,
    FiBox,
    FiUsers,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

// Icon mapping for different menu items
const getIconForLabel = (label) => {
    const iconMap = {
        Dashboard: FiHome,
        Orders: FiClipboard,
        Settings: FiSettings,
        "Table Status": FiEye,
        Analytics: FiTrendingUp,
        "Order Status": FiClipboard,
        "Place Order": FiPlus,
        Menu: FiCoffee,
        "Table QR": FiBox,
        "Table Management": FiGrid,
        Reservations: FiCalendar,
        Inventory: FiBox,
        Employees: FiUsers,
    };
    return iconMap[label] || FiHome;
};

const EmployeeSidebar = ({
    links = [],
    brandName = "DelishDrop",
    brandSub = "",
    logoImage = "",
    palette,
    resolvedMode,
    setUserMode,
    allowUserThemeToggle = true,
    mobileOpen,
    setMobileOpen,
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuth();

    const onLogout = () => {
        logout();
        setMobileOpen(false);
        navigate("/auth/login");
    };

    const toggleSidebar = () => {
        setSidebarOpen((prev) => !prev);
    };

    return (
        <>
            {/* Mobile Header */}
            <div
                className="sticky top-0 z-40 border-b backdrop-blur-sm md:hidden"
                style={{
                    borderColor: palette.border,
                    backgroundColor: palette.panelBg,
                    backdropFilter: palette.backdrop,
                    boxShadow: palette.glassShadow,
                }}
            >
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <Link to="/" className="flex min-w-0 items-center gap-2">
                        {logoImage ? (
                            <img src={logoImage} alt="logo" className="h-8 w-8 rounded-lg object-cover shadow-sm" />
                        ) : (
                            <div
                                className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white"
                                style={{ backgroundColor: palette.primary }}
                            >
                                D
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold tracking-tight" style={{ color: palette.text }}>
                                {brandName}
                            </p>
                            {brandSub && (
                                <p className="truncate text-xs font-medium" style={{ color: palette.muted }}>
                                    {brandSub}
                                </p>
                            )}
                        </div>
                    </Link>
                    <button
                        onClick={() => setMobileOpen((prev) => !prev)}
                        className="inline-flex items-center rounded-lg p-2 transition-all"
                        style={{
                            backgroundColor: palette.cardBg,
                            color: palette.text,
                            border: `1px solid ${palette.border}`,
                        }}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileOpen(false)}
                    style={{ top: "3.5rem" }}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-12 z-30 flex h-[calc(100vh-3rem)] flex-col border-r transition-all duration-300 md:sticky md:top-0 md:h-screen ${sidebarOpen ? "w-64" : "w-20"
                    } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
                style={{
                    borderColor: palette.border,
                    backgroundColor: palette.panelBg,
                    color: palette.text,
                    backdropFilter: palette.backdrop,
                    boxShadow: palette.glassShadow,
                }}
            >
                {/* Logo Section */}
                <div
                    className="hidden border-b px-4 py-5 md:flex md:items-center md:justify-between"
                    style={{ borderColor: palette.border }}
                >
                    <Link to="/" className={`flex items-center gap-3 transition-all ${!sidebarOpen && "justify-center w-full"}`}>
                        {logoImage ? (
                            <img src={logoImage} alt="logo" className="h-10 w-10 rounded-lg object-cover shadow-md flex-shrink-0" />
                        ) : (
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white shadow-md flex-shrink-0"
                                style={{ backgroundColor: palette.primary }}
                            >
                                D
                            </div>
                        )}
                        {sidebarOpen && (
                            <div className="min-w-0">
                                {brandSub && (
                                    <p className="truncate text-xs font-semibold uppercase tracking-widest" style={{ color: palette.muted }}>
                                        {brandSub}
                                    </p>
                                )}
                                <p className="truncate text-sm font-bold tracking-tight">{brandName}</p>
                            </div>
                        )}
                    </Link>
                    <button
                        onClick={toggleSidebar}
                        className="rounded-lg p-2 transition-all"
                        style={{
                            backgroundColor: palette.cardBg,
                            color: palette.text,
                            border: `1px solid ${palette.border}`,
                        }}
                        aria-label="Toggle sidebar"
                        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    >
                        {sidebarOpen ? <FiChevronLeft className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {links.map((link) => {
                        const Icon = getIconForLabel(link.label);
                        return (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-all duration-200 ${!sidebarOpen && "justify-center"
                                    } ${isActive ? "nav-active" : ""}`
                                }
                                style={({ isActive }) => ({
                                    backgroundColor: isActive ? palette.cardBg : "transparent",
                                    color: palette.text,
                                    border: isActive ? `1px solid ${palette.border}` : "1px solid transparent",
                                    boxShadow: isActive ? palette.glassShadow : "none",
                                })}
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                                        {sidebarOpen && <span className="truncate">{link.label}</span>}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Divider */}
                <div
                    className="mx-3 my-2 h-px"
                    style={{ backgroundColor: palette.border }}
                />

                {/* Footer Actions */}
                <div className="space-y-2 px-3 py-4">
                    {allowUserThemeToggle ? (
                        <button
                            onClick={() => setUserMode(resolvedMode === "dark" ? "light" : "dark")}
                            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200"
                            style={{
                                backgroundColor: palette.cardBg,
                                color: palette.text,
                                border: `1px solid ${palette.border}`,
                            }}
                            title={resolvedMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {resolvedMode === "dark" ? (
                                <FiSun className="h-5 w-5 flex-shrink-0" />
                            ) : (
                                <FiMoon className="h-5 w-5 flex-shrink-0" />
                            )}
                            {sidebarOpen && (
                                <span className="truncate">{resolvedMode === "dark" ? "Light" : "Dark"}</span>
                            )}
                        </button>
                    ) : null}

                    {isAuthenticated ? (
                        <button
                            onClick={onLogout}
                            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg"
                            style={{
                                backgroundColor: palette.primary,
                                boxShadow: palette.glassShadow,
                            }}
                            title="Logout"
                        >
                            <FiLogOut className="h-5 w-5 flex-shrink-0" />
                            {sidebarOpen && <span className="truncate">Logout</span>}
                        </button>
                    ) : null}
                </div>
            </aside>
        </>
    );
};

export default EmployeeSidebar;
