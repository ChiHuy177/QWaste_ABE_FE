import type { Metadata } from 'next';
import LandingPage from './_components/landing/LandingPage';

export const metadata: Metadata = {
    title: 'Qwaste - Smart Factory Management System',
    description:
        'Monitor CNC machines in real-time, manage production orders, ensure quality control, and optimize energy consumption — all in one platform.',
};

export default function Home() {
    return <LandingPage />;
}
