import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // 1. Initial State mn LocalStorage
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || 'system';
    });

    // 2. Logic bach n-detectiw wach l-system fih Dark Mode
    const [systemIsDark, setSystemIsDark] = useState(
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => setSystemIsDark(e.matches);

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // 3. Calcul dial darkMode (Booleen) - Hadchi li kays'hel l-khedma f les composants
    const darkMode = useMemo(() => {
        if (theme === 'dark') return true;
        if (theme === 'light') return false;
        return systemIsDark; // ila khtarina 'system'
    }, [theme, systemIsDark]);

    // 4. Appliquer l-class f l-HTML u hfadh f LocalStorage
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        
        if (darkMode) {
            root.classList.add('dark');
        } else {
            root.classList.add('light');
        }
        
        localStorage.setItem('theme', theme);
    }, [theme, darkMode]);

    // 5. Synchronisation bin les onglets (tabs)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'theme' && e.newValue) {
                setTheme(e.newValue);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const updateTheme = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, darkMode, updateTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme khassha t-khdem wast ThemeProvider');
    }
    return context;
};