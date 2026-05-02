import { create } from 'zustand';

interface UiState {
    isComposePostOpen: boolean;
    isComposeStoryOpen: boolean;
    openComposePost: () => void;
    closeComposePost: () => void;
    openComposeStory: () => void;
    closeComposeStory: () => void;
}

const useUiStore = create<UiState>((set) => ({
    isComposePostOpen: false,
    isComposeStoryOpen: false,
    openComposePost: () => set({ isComposePostOpen: true }),
    closeComposePost: () => set({ isComposePostOpen: false }),
    openComposeStory: () => set({ isComposeStoryOpen: true }),
    closeComposeStory: () => set({ isComposeStoryOpen: false }),
}));

export default useUiStore;
