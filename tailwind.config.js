module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // App Router pages/components
    "./components/**/*.{js,ts,jsx,tsx}", // Standalone components folder
  ],
  theme: { extend: {} },
  plugins: [],
  safelist: [
    "before:bg-[radial-gradient(120%_80%_at_50%_0,rgba(99,102,241,0.32),rgba(99,102,241,0)_70%)]",
  ],
};
