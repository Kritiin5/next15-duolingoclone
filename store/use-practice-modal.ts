// ZUSTAND: It allows any component in the app to access and modify 
// the exit modal state easily.


import { create } from "zustand";

type PracticeModalState = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
};


export  const usePracticeModal = create<PracticeModalState>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
}));

