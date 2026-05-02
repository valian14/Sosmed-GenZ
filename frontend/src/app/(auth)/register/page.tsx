import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-cyan-900/20 via-background to-background"></div>
            <RegisterForm />
        </main>
    );
}
