import ProfileView from '@/components/profile/ProfileView';

export default function UserProfile({ params }: { params: { username: string } }) {
    return <ProfileView username={params.username} />;
}
