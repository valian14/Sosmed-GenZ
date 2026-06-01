import { create } from 'zustand';

export interface UploadingPost {
    id: string;
    content: string;
    media_url?: string | null;
    progress: number;
}

interface PostStore {
    newPosts: any[];
    uploadingPosts: UploadingPost[];
    addNewPost: (post: any) => void;
    addUploadingPost: (post: UploadingPost) => void;
    updateUploadingPost: (id: string, progress: number) => void;
    removeUploadingPost: (id: string) => void;
    clearNewPosts: () => void;
}

const usePostStore = create<PostStore>((set) => ({
    newPosts: [],
    uploadingPosts: [],
    addNewPost: (post) => set((state) => ({ newPosts: [post, ...state.newPosts] })),
    addUploadingPost: (post) => set((state) => ({ uploadingPosts: [post, ...state.uploadingPosts] })),
    updateUploadingPost: (id, progress) => set((state) => ({
        uploadingPosts: state.uploadingPosts.map(p => p.id === id ? { ...p, progress } : p)
    })),
    removeUploadingPost: (id) => set((state) => ({
        uploadingPosts: state.uploadingPosts.filter(p => p.id !== id)
    })),
    clearNewPosts: () => set({ newPosts: [] })
}));

export default usePostStore;
