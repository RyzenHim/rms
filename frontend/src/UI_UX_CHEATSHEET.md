# 🎨 UI/UX - Quick Reference Cheatsheet

## Button Variations

```jsx
{/* Primary Action */}
<button className="btn-primary">Sign In</button>

{/* Secondary Action */}
<button className="btn-secondary">Cancel</button>

{/* Outlined Button */}
<button className="btn-outline">Learn More</button>

{/* Danger Button */}
<button className="btn-danger">Delete</button>

{/* Small Button */}
<button className="btn-small">Add</button>

{/* Icon Button */}
<button className="btn-icon">
  <svg>...</svg>
</button>

{/* Loading State */}
<button className="btn-primary" disabled>
  <div className="flex items-center justify-center gap-2">
    <svg className="h-5 w-5 animate-spin">...</svg>
    Loading...
  </div>
</button>
```

---

## Card Variations

```jsx
{/* Standard Card */}
<div className="card-base">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>

{/* Elevated Card with Hover */}
<div className="card-elevated hover-lift">
  <h3>Hover me!</h3>
  <p>This card lifts on hover</p>
</div>

{/* Gradient Card */}
<div className="card-gradient">
  <h3>Gradient Card</h3>
  <p>Beautiful gradient background</p>
</div>

{/* Menu Item Card */}
<div className="card-elevated">
  <img src="..." alt="..." className="w-full rounded-xl mb-3" />
  <h3 className="heading-5">Dish Name</h3>
  <p className="text-slate-600 text-sm">Description</p>
  <div className="flex justify-between items-center mt-4">
    <span className="font-bold text-emerald-600">₹299</span>
    <button className="btn-small">Add to Cart</button>
  </div>
</div>
```

---

## Form Patterns

```jsx
{/* Basic Form Group */}
<div className="form-group">
  <label className="form-label">Email Address</label>
  <input className="input-base" type="email" placeholder="your@email.com" />
  <p className="form-hint">We'll never share your email</p>
</div>

{/* Form with Error */}
<div className="form-group">
  <label className="form-label">Password</label>
  <input className="input-base" type="password" />
  <p className="form-error">Password must be at least 8 characters</p>
</div>

{/* Complete Form */}
<form className="space-y-6">
  <div className="form-group">
    <label className="form-label">Full Name</label>
    <input className="input-base" type="text" placeholder="John Doe" />
  </div>
  <div className="form-group">
    <label className="form-label">Email</label>
    <input className="input-base" type="email" placeholder="john@example.com" />
  </div>
  <div className="form-group">
    <label className="form-label">Message</label>
    <textarea className="input-base" placeholder="Your message..."></textarea>
  </div>
  <button className="btn-primary w-full">Submit</button>
</form>
```

---

## Alert & Badge Patterns

```jsx
{/* Success Alert */}
<div className="alert-success">
  <div className="flex items-start gap-3">
    <svg className="h-5 w-5 text-green-600 flex-shrink-0">✓</svg>
    <div>
      <p className="font-semibold text-green-900">Success!</p>
      <p className="text-sm text-green-800">Order placed successfully</p>
    </div>
  </div>
</div>

{/* Error Alert */}
<div className="alert-error">
  <div className="flex items-start gap-3">
    <svg className="h-5 w-5 text-red-600 flex-shrink-0">✕</svg>
    <div>
      <p className="font-semibold text-red-900">Error!</p>
      <p className="text-sm text-red-800">Something went wrong</p>
    </div>
  </div>
</div>

{/* Warning Alert */}
<div className="alert-warning">
  <div className="flex items-start gap-3">
    <svg className="h-5 w-5 text-amber-600 flex-shrink-0">⚠</svg>
    <div>
      <p className="font-semibold text-amber-900">Warning!</p>
      <p className="text-sm text-amber-800">This action cannot be undone</p>
    </div>
  </div>
</div>

{/* Info Alert */}
<div className="alert-info">
  <div className="flex items-start gap-3">
    <svg className="h-5 w-5 text-blue-600 flex-shrink-0">ℹ</svg>
    <div>
      <p className="font-semibold text-blue-900">Info</p>
      <p className="text-sm text-blue-800">Additional information</p>
    </div>
  </div>
</div>

{/* Badges */}
<div className="space-x-2">
  <span className="badge-success">✓ Completed</span>
  <span className="badge-error">✕ Failed</span>
  <span className="badge-warning">⚠ Pending</span>
  <span className="badge-info">ℹ Info</span>
</div>
```

---

## Header & Typography

```jsx
{/* Page Header */}
<div className="mb-8">
  <h1 className="heading-1">Welcome Back</h1>
  <p className="text-slate-600 text-lg">Access your dashboard securely</p>
</div>

{/* Section Header */}
<div className="mb-6">
  <h2 className="heading-2">Recent Orders</h2>
  <div className="h-1 w-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full mt-3"></div>
</div>

{/* Card Title */}
<h3 className="heading-5">Menu Items</h3>

{/* Text Gradient */}
<h1 className="text-gradient">Beautiful Gradient Text</h1>
```

---

## List & Grid Patterns

```jsx
{/* Simple List */}
<ul className="space-y-3">
  <li className="card-base flex items-center gap-3">
    <input type="checkbox" className="w-5 h-5" />
    <span>Task one</span>
  </li>
  <li className="card-base flex items-center gap-3">
    <input type="checkbox" className="w-5 h-5" />
    <span>Task two</span>
  </li>
</ul>

{/* Card Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="card-elevated">Card 1</div>
  <div className="card-elevated">Card 2</div>
  <div className="card-elevated">Card 3</div>
</div>

{/* Table */}
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b-2 border-slate-200">
        <th className="text-left py-3 px-4 font-bold text-slate-900">Name</th>
        <th className="text-left py-3 px-4 font-bold text-slate-900">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-slate-200 hover:bg-slate-50 transition">
        <td className="py-3 px-4">John Doe</td>
        <td className="py-3 px-4"><span className="badge-success">✓ Active</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Modal Pattern

```jsx
{/* Modal Container */}
<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
  {/* Modal Content */}
  <div className="card-base max-w-md w-full">
    <div className="flex items-center justify-between mb-4">
      <h2 className="heading-3">Modal Title</h2>
      <button className="text-slate-500 hover:text-slate-700">✕</button>
    </div>
    
    <p className="text-slate-600 mb-6">Modal content goes here</p>
    
    <div className="flex gap-3">
      <button className="btn-secondary flex-1">Cancel</button>
      <button className="btn-primary flex-1">Confirm</button>
    </div>
  </div>
</div>
```

---

## Navigation Pattern

```jsx
{/* Top Navigation */}
<nav className="bg-white shadow-soft sticky top-0 z-40">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <h1 className="heading-4">Restaurant App</h1>
    
    <div className="hidden md:flex items-center gap-6">
      <a href="/" className="text-slate-600 hover:text-slate-900">Home</a>
      <a href="/menu" className="text-slate-600 hover:text-slate-900">Menu</a>
      <a href="/orders" className="text-slate-600 hover:text-slate-900">Orders</a>
      <button className="btn-primary">Sign Out</button>
    </div>
  </div>
</nav>

{/* Mobile Menu */}
<div className="fixed inset-0 bg-white z-30 flex flex-col p-6">
  <button className="text-right mb-6">✕</button>
  <a href="/" className="py-3 text-slate-700 hover:text-emerald-600">Home</a>
  <a href="/menu" className="py-3 text-slate-700 hover:text-emerald-600">Menu</a>
  <a href="/orders" className="py-3 text-slate-700 hover:text-emerald-600">Orders</a>
</div>
```

---

## Loading States

```jsx
{/* Loading Spinner */}
<div className="flex items-center justify-center">
  <svg className="h-8 w-8 animate-spin text-emerald-600">...</svg>
</div>

{/* Skeleton Loader */}
<div className="space-y-4">
  <div className="skeleton h-12 w-full rounded-lg"></div>
  <div className="skeleton h-8 w-3/4 rounded-lg"></div>
  <div className="skeleton h-8 w-1/2 rounded-lg"></div>
</div>

{/* Loading Button */}
<button className="btn-primary" disabled>
  <div className="flex items-center justify-center gap-2">
    <svg className="h-4 w-4 animate-spin">...</svg>
    Please wait...
  </div>
</button>
```

---

## Spacing Guide

```jsx
{/* Vertical Spacing */}
<div className="space-y-3">  {/* gap between items */}
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

{/* Horizontal Spacing */}
<div className="flex gap-3">  {/* gap between items */}
  <button>Button 1</button>
  <button>Button 2</button>
</div>

{/* Grid Spacing */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>Card 1</div>
  <div>Card 2</div>
</div>
```

---

## Color Usage

```jsx
{/* Primary Emerald */}
<div className="bg-emerald-600 text-white">Primary action</div>

{/* Secondary Slate */}
<div className="bg-slate-100 text-slate-900">Secondary action</div>

{/* Success Green */}
<div className="bg-green-100 text-green-700">Success state</div>

{/* Error Red */}
<div className="bg-red-100 text-red-700">Error state</div>

{/* Warning Amber */}
<div className="bg-amber-100 text-amber-700">Warning state</div>

{/* Info Blue */}
<div className="bg-blue-100 text-blue-700">Info state</div>
```

---

## Hover Effects

```jsx
{/* Hover Lift */}
<div className="hover-lift card-base">Lifts on hover</div>

{/* Hover Glow */}
<div className="hover-glow card-base">Glows on hover</div>

{/* Hover Color Change */}
<a href="/" className="text-slate-600 hover:text-emerald-600">Link</a>

{/* Hover Scale */}
<div className="card-base hover:scale-105 transition">Scales up</div>
```

---

## Focus States (Accessibility)

```jsx
{/* Input Focus */}
<input className="input-base" type="text" />
{/* Automatically has focus ring and color change */}

{/* Button Focus */}
<button className="btn-primary">
  {/* Automatically has focus ring */}
</button>

{/* Link Focus */}
<a href="/" className="focus:outline-none focus:ring-4 focus:ring-emerald-500/20">
  Link
</a>
```

---

## Responsive Breakpoints

```jsx
{/* Mobile: default, Tablet: md (768px), Desktop: lg (1024px) */}

{/* Hidden on mobile, visible on tablet+ */}
<div className="hidden md:block">Desktop only</div>

{/* Visible on mobile, hidden on tablet+ */}
<div className="block md:hidden">Mobile only</div>

{/* Responsive sizing */}
<div className="text-lg md:text-2xl">Responsive text</div>

{/* Responsive layout */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

---

## Common Patterns

### Profile Card
```jsx
<div className="card-elevated text-center">
  <img src="avatar.jpg" className="w-20 h-20 rounded-full mx-auto" />
  <h3 className="heading-4 mt-4">John Doe</h3>
  <p className="text-slate-600">john@example.com</p>
  <button className="btn-primary mt-4 w-full">Edit Profile</button>
</div>
```

### Order Item
```jsx
<div className="card-base flex items-center justify-between">
  <div>
    <h4 className="heading-5">Biryani</h4>
    <p className="text-sm text-slate-600">Order #123</p>
  </div>
  <div className="text-right">
    <p className="heading-5 text-emerald-600">₹299</p>
    <p className="text-sm text-slate-600">Pending</p>
  </div>
</div>
```

### Search Bar
```jsx
<div className="relative">
  <input className="input-base pl-12" type="search" placeholder="Search..." />
  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400">
    {/* Search icon */}
  </svg>
</div>
```

---

## Tips & Tricks

1. **Always use utility classes** - Never inline styles
2. **Use the spacing scale** - Consistent gaps and padding
3. **Responsive first** - Mobile design, then enhance for larger screens
4. **Test accessibility** - Keyboard navigation and focus states
5. **Follow patterns** - Copy from existing improved components
6. **Keep it simple** - Less is more in web design

---

**Reference:** See `UI_UX_IMPROVEMENTS.md` for detailed examples and guidelines.

Happy styling! 🎨
