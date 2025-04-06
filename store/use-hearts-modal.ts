// ZUSTAND: It allows any component in the app to access and modify 
// the exit modal state easily.


import { create } from "zustand";

type HeartsModalState = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
};


export  const useHeartsModal = create<HeartsModalState>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
}));

